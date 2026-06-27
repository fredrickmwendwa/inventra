from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib.auth import update_session_auth_hash
from django.contrib import messages
from .models import UserProfile
from .forms import ProfileUpdateForm, PasswordChangeForm, AddStaffForm


def get_tenant_profile(request):
    """Helper — returns the logged-in user's profile."""
    return request.user.profile


# ---- Profile ----
@login_required
def profile(request):
    user_profile = get_tenant_profile(request)

    profile_form = ProfileUpdateForm(instance=user_profile, user=request.user)
    password_form = PasswordChangeForm()

    if request.method == 'POST':

        if 'update_profile' in request.POST:
            profile_form = ProfileUpdateForm(
                request.POST,
                request.FILES,
                instance=user_profile,
                user=request.user
            )
            if profile_form.is_valid():
                profile_form.save()
                messages.success(request, 'Profile updated successfully.')
                return redirect('accounts:profile')
            else:
                messages.error(request, 'Please fix the errors below.')

        elif 'change_password' in request.POST:
            password_form = PasswordChangeForm(request.POST)
            if password_form.is_valid():
                current = password_form.cleaned_data['current_password']
                new_pass = password_form.cleaned_data['new_password']
                if request.user.check_password(current):
                    request.user.set_password(new_pass)
                    request.user.save()
                    update_session_auth_hash(request, request.user)
                    messages.success(request, 'Password changed successfully.')
                    return redirect('accounts:profile')
                else:
                    messages.error(request, 'Current password is incorrect.')

    return render(request, 'accounts/profile.html', {
        'profile_form': profile_form,
        'password_form': password_form,
        'user_profile': user_profile,
    })


# ---- Staff List ----
@login_required
def staff_list(request):
    user_profile = get_tenant_profile(request)
    tenant = user_profile.tenant

    staff = UserProfile.objects.filter(tenant=tenant).select_related('user').order_by('role', 'user__first_name')

    return render(request, 'accounts/staff_list.html', {
        'staff': staff,
    })


# ---- Add Staff ----
@login_required
def add_staff(request):
    user_profile = get_tenant_profile(request)

    if not user_profile.is_manager():
        messages.error(request, 'You do not have permission to add staff.')
        return redirect('accounts:staff_list')

    form = AddStaffForm()

    if request.method == 'POST':
        form = AddStaffForm(request.POST)
        if form.is_valid():
            user = User(
                username=form.cleaned_data['username'],
                first_name=form.cleaned_data['first_name'],
                last_name=form.cleaned_data['last_name'],
                email=form.cleaned_data['email'],
            )
            user.set_password(form.cleaned_data['password'])
            user.save()

            UserProfile.objects.create(
                user=user,
                tenant=user_profile.tenant,
                role=form.cleaned_data['role'],
                phone=form.cleaned_data.get('phone', ''),
            )

            messages.success(request, f'Staff member {user.get_full_name()} added successfully.')
            return redirect('accounts:staff_list')
        else:
            messages.error(request, 'Please fix the errors below.')

    return render(request, 'accounts/add_staff.html', {'form': form})


# ---- Edit Staff ----
@login_required
def edit_staff(request, staff_id):
    user_profile = get_tenant_profile(request)

    if not user_profile.is_manager():
        messages.error(request, 'You do not have permission to edit staff.')
        return redirect('accounts:staff_list')

    staff_profile = get_object_or_404(
        UserProfile,
        id=staff_id,
        tenant=user_profile.tenant
    )

    # Prevent editing self here — use profile page instead
    if staff_profile.user == request.user:
        return redirect('accounts:profile')

    if request.method == 'POST':
        role = request.POST.get('role')
        phone = request.POST.get('phone', '')
        first_name = request.POST.get('first_name', '')
        last_name = request.POST.get('last_name', '')

        if role in dict(UserProfile.ROLE_CHOICES):
            staff_profile.role = role
            staff_profile.phone = phone
            staff_profile.save()
            staff_profile.user.first_name = first_name
            staff_profile.user.last_name = last_name
            staff_profile.user.save()
            messages.success(request, 'Staff member updated.')
        else:
            messages.error(request, 'Invalid role selected.')

        return redirect('accounts:staff_list')

    return render(request, 'accounts/edit_staff.html', {
        'staff_profile': staff_profile,
        'roles': UserProfile.ROLE_CHOICES,
    })


# ---- Remove Staff ----
@login_required
def remove_staff(request, staff_id):
    user_profile = get_tenant_profile(request)

    if not user_profile.is_owner():
        messages.error(request, 'Only the owner can remove staff members.')
        return redirect('accounts:staff_list')

    staff_profile = get_object_or_404(
        UserProfile,
        id=staff_id,
        tenant=user_profile.tenant
    )

    if staff_profile.user == request.user:
        messages.error(request, 'You cannot remove yourself.')
        return redirect('accounts:staff_list')

    if staff_profile.role == 'owner':
        messages.error(request, 'Cannot remove the business owner.')
        return redirect('accounts:staff_list')

    name = staff_profile.user.get_full_name()
    staff_profile.user.delete()
    messages.success(request, f'{name} has been removed.')
    return redirect('accounts:staff_list')
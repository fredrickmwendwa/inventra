from django.shortcuts import render, redirect
from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .forms import BusinessRegistrationForm, OwnerRegistrationForm, LoginForm
from apps.accounts.models import UserProfile


def landing_page(request):
    if request.user.is_authenticated:
        return redirect('dashboard:home')
    return render(request, 'tenants/landing.html')

def register_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard:home')

    business_form = BusinessRegistrationForm()
    owner_form = OwnerRegistrationForm()

    if request.method == 'POST':
        business_form = BusinessRegistrationForm(request.POST, request.FILES)
        owner_form = OwnerRegistrationForm(request.POST)

        if business_form.is_valid() and owner_form.is_valid():
            # Save the tenant/business first
            tenant = business_form.save()

            # Save the user
            user = owner_form.save(commit=False)
            user.set_password(owner_form.cleaned_data['password'])
            user.save()

            # Create the user profile and link to tenant
            UserProfile.objects.create(
                user=user,
                tenant=tenant,
                role='owner'
            )

            messages.success(request, 'Account created successfully. Please log in.')
            return redirect('tenants:login')
        else:
            messages.error(request, 'Please fix the errors below.')

    return render(request, 'tenants/register.html', {
        'business_form': business_form,
        'owner_form': owner_form,
    })


def login_view(request):
    if request.user.is_authenticated:
        return redirect('dashboard:home')

    form = LoginForm()

    if request.method == 'POST':
        form = LoginForm(data=request.POST)
        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect('dashboard:home')
        else:
            messages.error(request, 'Invalid username or password.')

    return render(request, 'tenants/login.html', {'form': form})


@login_required
def logout_view(request):
    logout(request)
    return redirect('tenants:login')
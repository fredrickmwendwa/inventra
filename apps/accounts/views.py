from django.shortcuts import render
from django.contrib.auth.decorators import login_required


@login_required
def profile(request):
    return render(request, 'accounts/profile.html')


@login_required
def staff_list(request):
    return render(request, 'accounts/staff_list.html')
from django.shortcuts import render
from django.contrib.auth.decorators import login_required


@login_required
def supplier_list(request):
    return render(request, 'suppliers/supplier_list.html')
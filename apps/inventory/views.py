from django.shortcuts import render
from django.contrib.auth.decorators import login_required


@login_required
def product_list(request):
    return render(request, 'inventory/product_list.html')


@login_required
def category_list(request):
    return render(request, 'inventory/category_list.html')


@login_required
def stock_movements(request):
    return render(request, 'inventory/stock_movements.html')
from django.shortcuts import render
from django.contrib.auth.decorators import login_required


@login_required
def sale_list(request):
    return render(request, 'sales/sale_list.html')
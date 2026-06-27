from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator
from django.db.models import Q
from .models import Supplier
from .forms import SupplierForm


def get_tenant(request):
    return request.user.profile.tenant


@login_required
def supplier_list(request):
    tenant = get_tenant(request)
    suppliers = Supplier.objects.filter(tenant=tenant)

    # Search
    q = request.GET.get('q', '')
    if q:
        suppliers = suppliers.filter(
            Q(name__icontains=q) |
            Q(email__icontains=q) |
            Q(phone__icontains=q)
        )

    # Filter by status
    status = request.GET.get('status', '')
    if status == 'active':
        suppliers = suppliers.filter(is_active=True)
    elif status == 'inactive':
        suppliers = suppliers.filter(is_active=False)

    paginator = Paginator(suppliers, 15)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    total_active = Supplier.objects.filter(tenant=tenant, is_active=True).count()
    total_inactive = Supplier.objects.filter(tenant=tenant, is_active=False).count()

    return render(request, 'suppliers/supplier_list.html', {
        'page_obj': page_obj,
        'q': q,
        'status': status,
        'total_active': total_active,
        'total_inactive': total_inactive,
    })


@login_required
def add_supplier(request):
    tenant = get_tenant(request)
    form = SupplierForm()

    if request.method == 'POST':
        form = SupplierForm(request.POST)
        if form.is_valid():
            supplier = form.save(commit=False)
            supplier.tenant = tenant
            supplier.save()
            messages.success(request, f'Supplier "{supplier.name}" added successfully.')
            return redirect('suppliers:supplier_list')
        else:
            messages.error(request, 'Please fix the errors below.')

    return render(request, 'suppliers/add_supplier.html', {'form': form})


@login_required
def supplier_detail(request, supplier_id):
    tenant = get_tenant(request)
    supplier = get_object_or_404(Supplier, id=supplier_id, tenant=tenant)

    return render(request, 'suppliers/supplier_detail.html', {
        'supplier': supplier,
    })


@login_required
def edit_supplier(request, supplier_id):
    tenant = get_tenant(request)
    supplier = get_object_or_404(Supplier, id=supplier_id, tenant=tenant)
    form = SupplierForm(instance=supplier)

    if request.method == 'POST':
        form = SupplierForm(request.POST, instance=supplier)
        if form.is_valid():
            form.save()
            messages.success(request, f'Supplier "{supplier.name}" updated.')
            return redirect('suppliers:supplier_detail', supplier_id=supplier.id)
        else:
            messages.error(request, 'Please fix the errors below.')

    return render(request, 'suppliers/edit_supplier.html', {
        'form': form,
        'supplier': supplier,
    })


@login_required
def delete_supplier(request, supplier_id):
    tenant = get_tenant(request)
    supplier = get_object_or_404(Supplier, id=supplier_id, tenant=tenant)
    name = supplier.name
    supplier.delete()
    messages.success(request, f'Supplier "{name}" deleted.')
    return redirect('suppliers:supplier_list')


@login_required
def toggle_supplier_status(request, supplier_id):
    tenant = get_tenant(request)
    supplier = get_object_or_404(Supplier, id=supplier_id, tenant=tenant)
    supplier.is_active = not supplier.is_active
    supplier.save()
    status = 'activated' if supplier.is_active else 'deactivated'
    messages.success(request, f'Supplier "{supplier.name}" {status}.')
    return redirect('suppliers:supplier_detail', supplier_id=supplier.id)
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator
from django.db.models import Q, Sum
from django.db import transaction
from .models import Sale, SaleItem
from .forms import SaleForm
from apps.inventory.models import Product, StockMovement


def get_tenant(request):
    return request.user.profile.tenant


# ---- Sale List ----
@login_required
def sale_list(request):
    tenant = get_tenant(request)
    sales = Sale.objects.filter(tenant=tenant).prefetch_related('items')

    # Search
    q = request.GET.get('q', '')
    if q:
        sales = sales.filter(
            Q(sale_number__icontains=q) |
            Q(customer_name__icontains=q) |
            Q(customer_phone__icontains=q)
        )

    # Filter by status
    status = request.GET.get('status', '')
    if status:
        sales = sales.filter(status=status)

    # Summary counts
    total_confirmed = Sale.objects.filter(tenant=tenant, status='confirmed').count()
    total_draft = Sale.objects.filter(tenant=tenant, status='draft').count()
    total_cancelled = Sale.objects.filter(tenant=tenant, status='cancelled').count()

    # Total revenue from confirmed sales
    revenue = sum(
        sale.total_amount()
        for sale in Sale.objects.filter(tenant=tenant, status='confirmed')
    )

    paginator = Paginator(sales, 15)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    return render(request, 'sales/sale_list.html', {
        'page_obj': page_obj,
        'q': q,
        'status': status,
        'total_confirmed': total_confirmed,
        'total_draft': total_draft,
        'total_cancelled': total_cancelled,
        'revenue': revenue,
    })


# ---- New Sale ----
@login_required
def new_sale(request):
    tenant = get_tenant(request)
    products = Product.objects.filter(tenant=tenant, is_active=True)
    form = SaleForm()

    if request.method == 'POST':
        form = SaleForm(request.POST)

        # Pull line items from POST
        product_ids = request.POST.getlist('product_id')
        quantities = request.POST.getlist('quantity')
        unit_prices = request.POST.getlist('unit_price')

        if not product_ids:
            messages.error(request, 'Please add at least one product to the sale.')
            return render(request, 'sales/new_sale.html', {
                'form': form,
                'products': products,
            })

        if form.is_valid():
            with transaction.atomic():
                sale = form.save(commit=False)
                sale.tenant = tenant
                sale.created_by = request.user
                sale.save()

                for i in range(len(product_ids)):
                    try:
                        product = Product.objects.get(
                            id=product_ids[i], tenant=tenant
                        )
                        qty = int(quantities[i])
                        price = float(unit_prices[i])

                        if qty <= 0:
                            continue

                        SaleItem.objects.create(
                            sale=sale,
                            product=product,
                            quantity=qty,
                            unit_price=price
                        )

                        # Deduct stock if confirmed
                        if sale.status == 'confirmed':
                            product.stock_quantity = max(
                                0, product.stock_quantity - qty
                            )
                            product.save()

                            StockMovement.objects.create(
                                tenant=tenant,
                                product=product,
                                movement_type='out',
                                quantity=qty,
                                notes=f'Sale {sale.sale_number}',
                                created_by=request.user
                            )

                    except (Product.DoesNotExist, ValueError, IndexError):
                        continue

                messages.success(
                    request,
                    f'Sale {sale.sale_number} created successfully.'
                )
                return redirect('sales:sale_detail', sale_id=sale.id)
        else:
            messages.error(request, 'Please fix the errors below.')

    return render(request, 'sales/new_sale.html', {
        'form': form,
        'products': products,
    })


# ---- Sale Detail ----
@login_required
def sale_detail(request, sale_id):
    tenant = get_tenant(request)
    sale = get_object_or_404(
        Sale.objects.prefetch_related('items__product'),
        id=sale_id,
        tenant=tenant
    )
    return render(request, 'sales/sale_detail.html', {'sale': sale})


# ---- Edit Sale ----
@login_required
def edit_sale(request, sale_id):
    tenant = get_tenant(request)
    sale = get_object_or_404(Sale, id=sale_id, tenant=tenant)

    if sale.status == 'confirmed':
        messages.error(request, 'Confirmed sales cannot be edited.')
        return redirect('sales:sale_detail', sale_id=sale.id)

    products = Product.objects.filter(tenant=tenant, is_active=True)
    form = SaleForm(instance=sale)

    if request.method == 'POST':
        form = SaleForm(request.POST, instance=sale)

        product_ids = request.POST.getlist('product_id')
        quantities = request.POST.getlist('quantity')
        unit_prices = request.POST.getlist('unit_price')

        if not product_ids:
            messages.error(request, 'Please add at least one product.')
            return render(request, 'sales/edit_sale.html', {
                'form': form,
                'sale': sale,
                'products': products,
            })

        if form.is_valid():
            with transaction.atomic():
                updated_sale = form.save(commit=False)

                # If being confirmed now, deduct stock
                confirming_now = (
                    sale.status != 'confirmed' and
                    updated_sale.status == 'confirmed'
                )

                updated_sale.save()

                # Delete old items and rebuild
                sale.items.all().delete()

                for i in range(len(product_ids)):
                    try:
                        product = Product.objects.get(
                            id=product_ids[i], tenant=tenant
                        )
                        qty = int(quantities[i])
                        price = float(unit_prices[i])

                        if qty <= 0:
                            continue

                        SaleItem.objects.create(
                            sale=updated_sale,
                            product=product,
                            quantity=qty,
                            unit_price=price
                        )

                        if confirming_now:
                            product.stock_quantity = max(
                                0, product.stock_quantity - qty
                            )
                            product.save()

                            StockMovement.objects.create(
                                tenant=tenant,
                                product=product,
                                movement_type='out',
                                quantity=qty,
                                notes=f'Sale {updated_sale.sale_number} confirmed',
                                created_by=request.user
                            )

                    except (Product.DoesNotExist, ValueError, IndexError):
                        continue

                messages.success(request, f'Sale {updated_sale.sale_number} updated.')
                return redirect('sales:sale_detail', sale_id=updated_sale.id)
        else:
            messages.error(request, 'Please fix the errors below.')

    return render(request, 'sales/edit_sale.html', {
        'form': form,
        'sale': sale,
        'products': products,
    })


# ---- Confirm Sale ----
@login_required
def confirm_sale(request, sale_id):
    tenant = get_tenant(request)
    sale = get_object_or_404(Sale, id=sale_id, tenant=tenant)

    if sale.status != 'draft':
        messages.error(request, 'Only draft sales can be confirmed.')
        return redirect('sales:sale_detail', sale_id=sale.id)

    with transaction.atomic():
        for item in sale.items.all():
            product = item.product
            product.stock_quantity = max(
                0, product.stock_quantity - item.quantity
            )
            product.save()

            StockMovement.objects.create(
                tenant=tenant,
                product=product,
                movement_type='out',
                quantity=item.quantity,
                notes=f'Sale {sale.sale_number} confirmed',
                created_by=request.user
            )

        sale.status = 'confirmed'
        sale.save()

    messages.success(request, f'Sale {sale.sale_number} confirmed.')
    return redirect('sales:sale_detail', sale_id=sale.id)


# ---- Cancel Sale ----
@login_required
def cancel_sale(request, sale_id):
    tenant = get_tenant(request)
    sale = get_object_or_404(Sale, id=sale_id, tenant=tenant)

    if sale.status == 'cancelled':
        messages.error(request, 'This sale is already cancelled.')
        return redirect('sales:sale_detail', sale_id=sale.id)

    with transaction.atomic():
        # Restore stock if was confirmed
        if sale.status == 'confirmed':
            for item in sale.items.all():
                product = item.product
                product.stock_quantity += item.quantity
                product.save()

                StockMovement.objects.create(
                    tenant=tenant,
                    product=product,
                    movement_type='in',
                    quantity=item.quantity,
                    notes=f'Sale {sale.sale_number} cancelled — stock restored',
                    created_by=request.user
                )

        sale.status = 'cancelled'
        sale.save()

    messages.success(request, f'Sale {sale.sale_number} cancelled.')
    return redirect('sales:sale_detail', sale_id=sale.id)


# ---- Delete Sale ----
@login_required
def delete_sale(request, sale_id):
    tenant = get_tenant(request)
    sale = get_object_or_404(Sale, id=sale_id, tenant=tenant)

    if sale.status == 'confirmed':
        messages.error(request, 'Confirmed sales cannot be deleted.')
        return redirect('sales:sale_detail', sale_id=sale.id)

    number = sale.sale_number
    sale.delete()
    messages.success(request, f'Sale {number} deleted.')
    return redirect('sales:sale_list')
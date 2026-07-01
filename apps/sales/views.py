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


# ─────────────────────────────────────────────
#  SALE LIST
# ─────────────────────────────────────────────
@login_required
def sale_list(request):
    tenant = get_tenant(request)
    sales  = Sale.objects.filter(tenant=tenant).prefetch_related('items')

    # Search
    q = request.GET.get('q', '')
    if q:
        sales = sales.filter(
            Q(sale_number__icontains=q) |
            Q(customer_name__icontains=q) |
            Q(customer_phone__icontains=q)
        )

    # Status filter
    status = request.GET.get('status', '')
    if status:
        sales = sales.filter(status=status)

    # Summary counts
    total_confirmed = Sale.objects.filter(tenant=tenant, status='confirmed').count()
    total_draft     = Sale.objects.filter(tenant=tenant, status='draft').count()
    total_cancelled = Sale.objects.filter(tenant=tenant, status='cancelled').count()

    # Total revenue (confirmed only)
    revenue = sum(
        sale.total_amount()
        for sale in Sale.objects.filter(tenant=tenant, status='confirmed')
    )

    paginator   = Paginator(sales, 15)
    page_number = request.GET.get('page')
    page_obj    = paginator.get_page(page_number)

    return render(request, 'sales/sale_list.html', {
        'page_obj':        page_obj,
        'q':               q,
        'status':          status,
        'total_confirmed': total_confirmed,
        'total_draft':     total_draft,
        'total_cancelled': total_cancelled,
        'revenue':         revenue,
    })


# ─────────────────────────────────────────────
#  HELPER — validate line items against stock
#  Returns (cleaned_lines, errors)
#  cleaned_lines = list of (product, qty, price)
#  errors        = list of human-readable strings
# ─────────────────────────────────────────────
def _validate_lines(product_ids, quantities, unit_prices, tenant, check_stock):
    """
    Loops through the raw POST lists, fetches each product,
    checks stock when check_stock=True, and returns either
    a clean list of tuples or a list of error strings.

    check_stock should be True when the sale is being CONFIRMED
    (i.e. stock will actually be deducted right now).
    It should be False for draft saves where no stock moves.
    """
    cleaned_lines = []
    errors        = []

    for i in range(len(product_ids)):
        # Skip blank rows (user added a row but left it empty)
        if not product_ids[i]:
            continue

        try:
            product = Product.objects.get(id=int(product_ids[i]), tenant=tenant)
            qty     = int(quantities[i])
            price   = float(unit_prices[i])
        except (Product.DoesNotExist, ValueError, IndexError, TypeError):
            errors.append('One or more line items contained invalid data.')
            continue

        # Skip rows where quantity is 0 or negative
        if qty <= 0:
            continue

        # Stock check — only when sale is being confirmed
        if check_stock:
            if product.stock_quantity == 0:
                errors.append(
                    f'"{product.name}" is out of stock and cannot be sold.'
                )
                continue

            if qty > product.stock_quantity:
                errors.append(
                    f'"{product.name}": you requested {qty} '
                    f'but only {product.stock_quantity} '
                    f'{"is" if product.stock_quantity == 1 else "are"} in stock.'
                )
                continue

        cleaned_lines.append((product, qty, price))

    return cleaned_lines, errors


# ─────────────────────────────────────────────
#  NEW SALE
# ─────────────────────────────────────────────
@login_required
def new_sale(request):
    tenant = get_tenant(request)

    # Only show products that actually have stock
    products = Product.objects.filter(
        tenant=tenant,
        is_active=True,
        stock_quantity__gt=0
    ).order_by('name')

    form = SaleForm()

    if request.method == 'POST':
        form = SaleForm(request.POST)

        product_ids = request.POST.getlist('product_id')
        quantities  = request.POST.getlist('quantity')
        unit_prices = request.POST.getlist('unit_price')

        # Must have at least one product
        if not any(p for p in product_ids if p):
            messages.error(request, 'Please add at least one product to the sale.')
            return render(request, 'sales/new_sale.html', {
                'form': form, 'products': products,
            })

        if form.is_valid():
            status_value = form.cleaned_data.get('status', 'draft')

            # Only validate stock when the sale is being confirmed right now.
            # Draft sales are just intentions — no stock moves yet.
            check_stock = (status_value == 'confirmed')

            cleaned_lines, errors = _validate_lines(
                product_ids, quantities, unit_prices, tenant, check_stock
            )

            if not cleaned_lines:
                messages.error(
                    request,
                    'No valid products were added. '
                    'Please select at least one product with a quantity greater than 0.'
                )
                return render(request, 'sales/new_sale.html', {
                    'form': form, 'products': products,
                })

            # Stop here if any line failed the stock check
            if errors:
                for err in errors:
                    messages.error(request, err)
                return render(request, 'sales/new_sale.html', {
                    'form': form, 'products': products,
                })

            # Everything passed — create the sale
            with transaction.atomic():
                sale              = form.save(commit=False)
                sale.tenant       = tenant
                sale.created_by   = request.user
                sale.save()

                for product, qty, price in cleaned_lines:
                    SaleItem.objects.create(
                        sale       = sale,
                        product    = product,
                        quantity   = qty,
                        unit_price = price,
                    )

                    # Deduct stock only when confirming
                    if sale.status == 'confirmed':
                        product.stock_quantity -= qty
                        product.save()

                        StockMovement.objects.create(
                            tenant        = tenant,
                            product       = product,
                            movement_type = 'out',
                            quantity      = qty,
                            notes         = f'Sale {sale.sale_number}',
                            created_by    = request.user,
                        )

            messages.success(
                request, f'Sale {sale.sale_number} created successfully.'
            )
            return redirect('sales:sale_detail', sale_id=sale.id)

        else:
            messages.error(request, 'Please fix the errors below.')

    return render(request, 'sales/new_sale.html', {
        'form': form, 'products': products,
    })


# ─────────────────────────────────────────────
#  SALE DETAIL
# ─────────────────────────────────────────────
@login_required
def sale_detail(request, sale_id):
    tenant = get_tenant(request)
    sale   = get_object_or_404(
        Sale.objects.prefetch_related('items__product'),
        id=sale_id,
        tenant=tenant,
    )
    return render(request, 'sales/sale_detail.html', {'sale': sale})


# ─────────────────────────────────────────────
#  EDIT SALE
# ─────────────────────────────────────────────
@login_required
def edit_sale(request, sale_id):
    tenant = get_tenant(request)
    sale   = get_object_or_404(Sale, id=sale_id, tenant=tenant)

    if sale.status == 'confirmed':
        messages.error(request, 'Confirmed sales cannot be edited.')
        return redirect('sales:sale_detail', sale_id=sale.id)

    # Only show products that have stock
    products = Product.objects.filter(
        tenant=tenant,
        is_active=True,
        stock_quantity__gt=0
    ).order_by('name')

    form = SaleForm(instance=sale)

    if request.method == 'POST':
        form = SaleForm(request.POST, instance=sale)

        product_ids = request.POST.getlist('product_id')
        quantities  = request.POST.getlist('quantity')
        unit_prices = request.POST.getlist('unit_price')

        if not any(p for p in product_ids if p):
            messages.error(request, 'Please add at least one product.')
            return render(request, 'sales/edit_sale.html', {
                'form': form, 'sale': sale, 'products': products,
            })

        if form.is_valid():
            updated_preview  = form.save(commit=False)
            confirming_now   = (
                sale.status != 'confirmed' and
                updated_preview.status == 'confirmed'
            )

            # Stock check only kicks in when the sale is being
            # moved from draft → confirmed right now
            check_stock = confirming_now

            cleaned_lines, errors = _validate_lines(
                product_ids, quantities, unit_prices, tenant, check_stock
            )

            if not cleaned_lines:
                messages.error(request, 'No valid products were added.')
                return render(request, 'sales/edit_sale.html', {
                    'form': form, 'sale': sale, 'products': products,
                })

            if errors:
                for err in errors:
                    messages.error(request, err)
                return render(request, 'sales/edit_sale.html', {
                    'form': form, 'sale': sale, 'products': products,
                })

            with transaction.atomic():
                updated_sale = form.save(commit=False)
                updated_sale.save()

                # Wipe old line items and rebuild from scratch
                sale.items.all().delete()

                for product, qty, price in cleaned_lines:
                    SaleItem.objects.create(
                        sale       = updated_sale,
                        product    = product,
                        quantity   = qty,
                        unit_price = price,
                    )

                    # Only deduct stock if this edit is confirming the sale
                    if confirming_now:
                        product.stock_quantity -= qty
                        product.save()

                        StockMovement.objects.create(
                            tenant        = tenant,
                            product       = product,
                            movement_type = 'out',
                            quantity      = qty,
                            notes         = f'Sale {updated_sale.sale_number} confirmed',
                            created_by    = request.user,
                        )

            messages.success(
                request, f'Sale {updated_sale.sale_number} updated.'
            )
            return redirect('sales:sale_detail', sale_id=updated_sale.id)

        else:
            messages.error(request, 'Please fix the errors below.')

    return render(request, 'sales/edit_sale.html', {
        'form': form, 'sale': sale, 'products': products,
    })


# ─────────────────────────────────────────────
#  CONFIRM SALE
# ─────────────────────────────────────────────
@login_required
def confirm_sale(request, sale_id):
    tenant = get_tenant(request)
    sale   = get_object_or_404(Sale, id=sale_id, tenant=tenant)

    if sale.status != 'draft':
        messages.error(request, 'Only draft sales can be confirmed.')
        return redirect('sales:sale_detail', sale_id=sale.id)

    # Run the same stock check before confirming
    errors = []
    for item in sale.items.all():
        product = item.product
        if product.stock_quantity == 0:
            errors.append(
                f'"{product.name}" is now out of stock. '
                f'Remove it from the sale before confirming.'
            )
        elif item.quantity > product.stock_quantity:
            errors.append(
                f'"{product.name}": sale has {item.quantity} '
                f'but only {product.stock_quantity} '
                f'{"is" if product.stock_quantity == 1 else "are"} now in stock. '
                f'Edit the sale to reduce the quantity first.'
            )

    if errors:
        for err in errors:
            messages.error(request, err)
        return redirect('sales:sale_detail', sale_id=sale.id)

    with transaction.atomic():
        for item in sale.items.all():
            product                    = item.product
            product.stock_quantity    -= item.quantity
            product.save()

            StockMovement.objects.create(
                tenant        = tenant,
                product       = product,
                movement_type = 'out',
                quantity      = item.quantity,
                notes         = f'Sale {sale.sale_number} confirmed',
                created_by    = request.user,
            )

        sale.status = 'confirmed'
        sale.save()

    messages.success(request, f'Sale {sale.sale_number} confirmed.')
    return redirect('sales:sale_detail', sale_id=sale.id)


# ─────────────────────────────────────────────
#  CANCEL SALE
# ─────────────────────────────────────────────
@login_required
def cancel_sale(request, sale_id):
    tenant = get_tenant(request)
    sale   = get_object_or_404(Sale, id=sale_id, tenant=tenant)

    if sale.status == 'cancelled':
        messages.error(request, 'This sale is already cancelled.')
        return redirect('sales:sale_detail', sale_id=sale.id)

    with transaction.atomic():
        # If it was confirmed, restore the stock
        if sale.status == 'confirmed':
            for item in sale.items.all():
                product                 = item.product
                product.stock_quantity += item.quantity
                product.save()

                StockMovement.objects.create(
                    tenant        = tenant,
                    product       = product,
                    movement_type = 'in',
                    quantity      = item.quantity,
                    notes         = f'Sale {sale.sale_number} cancelled — stock restored',
                    created_by    = request.user,
                )

        sale.status = 'cancelled'
        sale.save()

    messages.success(request, f'Sale {sale.sale_number} cancelled.')
    return redirect('sales:sale_detail', sale_id=sale.id)


# ─────────────────────────────────────────────
#  DELETE SALE
# ─────────────────────────────────────────────
@login_required
def delete_sale(request, sale_id):
    tenant = get_tenant(request)
    sale   = get_object_or_404(Sale, id=sale_id, tenant=tenant)

    if sale.status == 'confirmed':
        messages.error(request, 'Confirmed sales cannot be deleted.')
        return redirect('sales:sale_detail', sale_id=sale.id)

    number = sale.sale_number
    sale.delete()
    messages.success(request, f'Sale {number} deleted.')
    return redirect('sales:sale_list')
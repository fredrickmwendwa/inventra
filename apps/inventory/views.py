from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.core.paginator import Paginator
from django.db.models import Q
from .models import Category, Product, StockMovement
from .forms import CategoryForm, ProductForm, StockMovementForm


def get_tenant(request):
    return request.user.profile.tenant


# =====================
# CATEGORY VIEWS
# =====================

@login_required
def category_list(request):
    tenant = get_tenant(request)
    categories = Category.objects.filter(tenant=tenant)

    return render(request, 'inventory/category_list.html', {
        'categories': categories,
    })


@login_required
def add_category(request):
    tenant = get_tenant(request)
    form = CategoryForm()

    if request.method == 'POST':
        form = CategoryForm(request.POST)
        if form.is_valid():
            category = form.save(commit=False)
            category.tenant = tenant
            category.save()
            messages.success(request, f'Category "{category.name}" created.')
            return redirect('inventory:category_list')
        else:
            messages.error(request, 'Please fix the errors below.')

    return render(request, 'inventory/add_category.html', {'form': form})


@login_required
def edit_category(request, category_id):
    tenant = get_tenant(request)
    category = get_object_or_404(Category, id=category_id, tenant=tenant)
    form = CategoryForm(instance=category)

    if request.method == 'POST':
        form = CategoryForm(request.POST, instance=category)
        if form.is_valid():
            form.save()
            messages.success(request, f'Category "{category.name}" updated.')
            return redirect('inventory:category_list')
        else:
            messages.error(request, 'Please fix the errors below.')

    return render(request, 'inventory/edit_category.html', {
        'form': form,
        'category': category,
    })


@login_required
def delete_category(request, category_id):
    tenant = get_tenant(request)
    category = get_object_or_404(Category, id=category_id, tenant=tenant)
    name = category.name
    category.delete()
    messages.success(request, f'Category "{name}" deleted.')
    return redirect('inventory:category_list')


# =====================
# PRODUCT VIEWS
# =====================

@login_required
def product_list(request):
    tenant = get_tenant(request)
    products = Product.objects.filter(tenant=tenant).select_related('category')

    # Search
    q = request.GET.get('q', '')
    if q:
        products = products.filter(
            Q(name__icontains=q) |
            Q(sku__icontains=q) |
            Q(category__name__icontains=q)
        )

    # Filter by category
    category_id = request.GET.get('category', '')
    if category_id:
        products = products.filter(category_id=category_id)

    # Filter by stock status
    stock_filter = request.GET.get('stock', '')
    if stock_filter == 'low':
        products = [p for p in products if p.is_low_stock() and not p.is_out_of_stock()]
    elif stock_filter == 'out':
        products = [p for p in products if p.is_out_of_stock()]
    else:
        products = list(products)

    # Pagination
    paginator = Paginator(products, 15)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    categories = Category.objects.filter(tenant=tenant)

    return render(request, 'inventory/product_list.html', {
        'page_obj': page_obj,
        'categories': categories,
        'q': q,
        'category_id': category_id,
        'stock_filter': stock_filter,
        'total_products': len(products),
    })


@login_required
def add_product(request):
    tenant = get_tenant(request)
    form = ProductForm(tenant=tenant)

    if request.method == 'POST':
        form = ProductForm(tenant=tenant, data=request.POST, files=request.FILES)
        if form.is_valid():
            product = form.save(commit=False)
            product.tenant = tenant
            product.save()

            # Record initial stock movement if stock > 0
            if product.stock_quantity > 0:
                StockMovement.objects.create(
                    tenant=tenant,
                    product=product,
                    movement_type='in',
                    quantity=product.stock_quantity,
                    notes='Initial stock on product creation',
                    created_by=request.user
                )

            messages.success(request, f'Product "{product.name}" added successfully.')
            return redirect('inventory:product_list')
        else:
            messages.error(request, 'Please fix the errors below.')

    return render(request, 'inventory/add_product.html', {'form': form})


@login_required
def product_detail(request, product_id):
    tenant = get_tenant(request)
    product = get_object_or_404(Product, id=product_id, tenant=tenant)
    movements = StockMovement.objects.filter(product=product).order_by('-created_at')[:10]

    return render(request, 'inventory/product_detail.html', {
        'product': product,
        'movements': movements,
    })


@login_required
def edit_product(request, product_id):
    tenant = get_tenant(request)
    product = get_object_or_404(Product, id=product_id, tenant=tenant)
    old_quantity = product.stock_quantity
    form = ProductForm(tenant=tenant, instance=product)

    if request.method == 'POST':
        form = ProductForm(
            tenant=tenant,
            data=request.POST,
            files=request.FILES,
            instance=product
        )
        if form.is_valid():
            updated = form.save()

            # Record stock adjustment if quantity changed
            new_quantity = updated.stock_quantity
            if new_quantity != old_quantity:
                diff = new_quantity - old_quantity
                StockMovement.objects.create(
                    tenant=tenant,
                    product=updated,
                    movement_type='adjustment',
                    quantity=diff,
                    notes=f'Stock adjusted during product edit (was {old_quantity})',
                    created_by=request.user
                )

            messages.success(request, f'Product "{updated.name}" updated.')
            return redirect('inventory:product_detail', product_id=updated.id)
        else:
            messages.error(request, 'Please fix the errors below.')

    return render(request, 'inventory/edit_product.html', {
        'form': form,
        'product': product,
    })


@login_required
def delete_product(request, product_id):
    tenant = get_tenant(request)
    product = get_object_or_404(Product, id=product_id, tenant=tenant)
    name = product.name
    product.delete()
    messages.success(request, f'Product "{name}" deleted.')
    return redirect('inventory:product_list')


# =====================
# STOCK MOVEMENT VIEWS
# =====================

@login_required
def stock_movements(request):
    tenant = get_tenant(request)
    movements = StockMovement.objects.filter(
        tenant=tenant
    ).select_related('product', 'created_by')

    # Filter by type
    movement_type = request.GET.get('type', '')
    if movement_type:
        movements = movements.filter(movement_type=movement_type)

    # Search by product
    q = request.GET.get('q', '')
    if q:
        movements = movements.filter(product__name__icontains=q)

    paginator = Paginator(movements, 20)
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    return render(request, 'inventory/stock_movements.html', {
        'page_obj': page_obj,
        'movement_type': movement_type,
        'q': q,
    })


@login_required
def add_stock_movement(request):
    tenant = get_tenant(request)
    form = StockMovementForm(tenant=tenant)

    if request.method == 'POST':
        form = StockMovementForm(tenant=tenant, data=request.POST)
        if form.is_valid():
            movement = form.save(commit=False)
            movement.tenant = tenant
            movement.created_by = request.user

            product = movement.product

            # Update stock quantity
            if movement.movement_type == 'in':
                product.stock_quantity += movement.quantity
            elif movement.movement_type == 'out':
                if movement.quantity > product.stock_quantity:
                    messages.error(
                        request,
                        f'Not enough stock. Available: {product.stock_quantity}'
                    )
                    return render(request, 'inventory/add_stock_movement.html', {'form': form})
                product.stock_quantity -= movement.quantity
            elif movement.movement_type == 'adjustment':
                product.stock_quantity = movement.quantity

            product.save()
            movement.save()

            messages.success(request, 'Stock movement recorded successfully.')
            return redirect('inventory:stock_movements')
        else:
            messages.error(request, 'Please fix the errors below.')

    return render(request, 'inventory/add_stock_movement.html', {'form': form})
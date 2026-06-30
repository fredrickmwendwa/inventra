from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.db.models import Sum, Count
from django.utils import timezone
from datetime import timedelta
from apps.inventory.models import Product, Category, StockMovement
from apps.sales.models import Sale, SaleItem
from apps.suppliers.models import Supplier
from apps.accounts.models import UserProfile


def get_tenant(request):
    return request.user.profile.tenant


@login_required
def home(request):
    tenant = get_tenant(request)
    today = timezone.now().date()
    thirty_days_ago = today - timedelta(days=30)
    seven_days_ago = today - timedelta(days=7)

    # ---- Core counts ----
    total_products = Product.objects.filter(
        tenant=tenant, is_active=True
    ).count()

    total_categories = Category.objects.filter(tenant=tenant).count()

    total_suppliers = Supplier.objects.filter(
        tenant=tenant, is_active=True
    ).count()

    total_staff = UserProfile.objects.filter(tenant=tenant).count()

    # ---- Stock alerts ----
    low_stock_products = Product.objects.filter(
        tenant=tenant, is_active=True
    )
    low_stock = [p for p in low_stock_products if p.is_low_stock() and not p.is_out_of_stock()]
    out_of_stock = [p for p in low_stock_products if p.is_out_of_stock()]

    # ---- Sales stats ----
    confirmed_sales = Sale.objects.filter(
        tenant=tenant, status='confirmed'
    )

    total_revenue = sum(sale.total_amount() for sale in confirmed_sales)

    sales_this_month = Sale.objects.filter(
        tenant=tenant,
        status='confirmed',
        created_at__date__gte=thirty_days_ago
    )
    revenue_this_month = sum(sale.total_amount() for sale in sales_this_month)

    sales_this_week = Sale.objects.filter(
        tenant=tenant,
        status='confirmed',
        created_at__date__gte=seven_days_ago
    )
    revenue_this_week = sum(sale.total_amount() for sale in sales_this_week)

    total_sales_count = Sale.objects.filter(
        tenant=tenant, status='confirmed'
    ).count()

    # ---- Inventory value ----
    products_qs = Product.objects.filter(tenant=tenant, is_active=True)
    inventory_value = sum(p.stock_value() for p in products_qs)

    # ---- Recent sales ----
    recent_sales = Sale.objects.filter(
        tenant=tenant
    ).order_by('-created_at')[:6]

    # ---- Top selling products ----
    top_products = SaleItem.objects.filter(
        sale__tenant=tenant,
        sale__status='confirmed'
    ).values(
        'product__name'
    ).annotate(
        total_qty=Sum('quantity'),
        total_revenue=Sum('subtotal') if hasattr(SaleItem, 'subtotal_field') else Count('id')
    ).order_by('-total_qty')[:5]

    # ---- Sales chart data — last 7 days ----
    chart_labels = []
    chart_values = []

    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        label = day.strftime('%b %d')
        day_sales = Sale.objects.filter(
            tenant=tenant,
            status='confirmed',
            created_at__date=day
        )
        day_revenue = sum(sale.total_amount() for sale in day_sales)
        chart_labels.append(label)
        chart_values.append(float(day_revenue))

    # ---- Recent stock movements ----
    recent_movements = StockMovement.objects.filter(
        tenant=tenant
    ).select_related('product').order_by('-created_at')[:5]

    return render(request, 'dashboard/home.html', {
        # Counts
        'total_products': total_products,
        'total_categories': total_categories,
        'total_suppliers': total_suppliers,
        'total_staff': total_staff,
        # Revenue
        'total_revenue': total_revenue,
        'revenue_this_month': revenue_this_month,
        'revenue_this_week': revenue_this_week,
        'total_sales_count': total_sales_count,
        # Inventory
        'inventory_value': inventory_value,
        'low_stock': low_stock,
        'out_of_stock': out_of_stock,
        # Lists
        'recent_sales': recent_sales,
        'top_products': top_products,
        'recent_movements': recent_movements,
        # Chart
        'chart_labels': chart_labels,
        'chart_values': chart_values,
    })

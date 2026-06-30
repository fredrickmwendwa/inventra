from django.contrib import admin
from .models import Category, Product, StockMovement

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'tenant', 'created_at']
    search_fields = ['name']
    list_filter = ['tenant']

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = [
        'name', 'sku', 'tenant', 'category',
        'unit_price', 'stock_quantity', 'is_active'
    ]
    search_fields = ['name', 'sku']
    list_filter = ['is_active', 'tenant', 'category']

@admin.register(StockMovement)
class StockMovementAdmin(admin.ModelAdmin):
    list_display = [
        'product', 'movement_type', 'quantity',
        'created_by', 'created_at'
    ]
    list_filter = ['movement_type', 'tenant']
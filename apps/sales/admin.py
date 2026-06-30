from django.contrib import admin
from .models import Sale, SaleItem

class SaleItemInline(admin.TabularInline):
    model = SaleItem
    extra = 0
    readonly_fields = ['subtotal']

    def subtotal(self, obj):
        return obj.subtotal()

@admin.register(Sale)
class SaleAdmin(admin.ModelAdmin):
    list_display = [
        'sale_number', 'customer_name', 'status',
        'created_by', 'created_at'
    ]
    search_fields = ['sale_number', 'customer_name']
    list_filter = ['status', 'tenant']
    inlines = [SaleItemInline]
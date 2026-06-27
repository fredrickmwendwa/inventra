from django import forms
from .models import Category, Product, StockMovement


class CategoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = ['name', 'description']
        widgets = {
            'name': forms.TextInput(attrs={'placeholder': 'Category name'}),
            'description': forms.Textarea(attrs={
                'placeholder': 'Optional description',
                'rows': 3
            }),
        }


class ProductForm(forms.ModelForm):
    class Meta:
        model = Product
        fields = [
            'name', 'sku', 'category', 'description',
            'unit_price', 'cost_price', 'stock_quantity',
            'reorder_level', 'image', 'is_active'
        ]
        widgets = {
            'name': forms.TextInput(attrs={'placeholder': 'Product name'}),
            'sku': forms.TextInput(attrs={'placeholder': 'e.g. PROD-001'}),
            'description': forms.Textarea(attrs={
                'placeholder': 'Product description',
                'rows': 3
            }),
            'unit_price': forms.NumberInput(attrs={'placeholder': '0.00', 'step': '0.01'}),
            'cost_price': forms.NumberInput(attrs={'placeholder': '0.00', 'step': '0.01'}),
            'stock_quantity': forms.NumberInput(attrs={'placeholder': '0'}),
            'reorder_level': forms.NumberInput(attrs={'placeholder': '10'}),
        }

    def __init__(self, tenant=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if tenant:
            self.fields['category'].queryset = Category.objects.filter(tenant=tenant)
        self.fields['category'].empty_label = 'No Category'
        self.fields['category'].required = False


class StockMovementForm(forms.ModelForm):
    class Meta:
        model = StockMovement
        fields = ['product', 'movement_type', 'quantity', 'notes']
        widgets = {
            'quantity': forms.NumberInput(attrs={'placeholder': 'Enter quantity', 'min': '1'}),
            'notes': forms.Textarea(attrs={
                'placeholder': 'Reason for this movement (optional)',
                'rows': 3
            }),
        }

    def __init__(self, tenant=None, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if tenant:
            self.fields['product'].queryset = Product.objects.filter(
                tenant=tenant, is_active=True
            )
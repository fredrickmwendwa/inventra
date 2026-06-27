from django import forms
from .models import Supplier


class SupplierForm(forms.ModelForm):
    class Meta:
        model = Supplier
        fields = ['name', 'email', 'phone', 'address', 'notes', 'is_active']
        widgets = {
            'name': forms.TextInput(attrs={
                'placeholder': 'Supplier or company name'
            }),
            'email': forms.EmailInput(attrs={
                'placeholder': 'supplier@email.com'
            }),
            'phone': forms.TextInput(attrs={
                'placeholder': '+254 700 000 000'
            }),
            'address': forms.Textarea(attrs={
                'placeholder': 'Physical address',
                'rows': 3
            }),
            'notes': forms.Textarea(attrs={
                'placeholder': 'Any extra notes about this supplier',
                'rows': 3
            }),
        }
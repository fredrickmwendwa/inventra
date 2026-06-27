from django import forms
from .models import Sale


class SaleForm(forms.ModelForm):
    class Meta:
        model = Sale
        fields = [
            'customer_name', 'customer_phone',
            'customer_email', 'status', 'notes'
        ]
        widgets = {
            'customer_name': forms.TextInput(attrs={
                'placeholder': 'Customer full name'
            }),
            'customer_phone': forms.TextInput(attrs={
                'placeholder': '+254 700 000 000'
            }),
            'customer_email': forms.EmailInput(attrs={
                'placeholder': 'customer@email.com'
            }),
            'notes': forms.Textarea(attrs={
                'placeholder': 'Any extra notes for this sale',
                'rows': 3
            }),
        }
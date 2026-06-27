from django.urls import path
from . import views

app_name = 'inventory'

urlpatterns = [
    path('products/', views.product_list, name='product_list'),
    path('categories/', views.category_list, name='category_list'),
    path('stock-movements/', views.stock_movements, name='stock_movements'),
]
from django.urls import path
from . import views

app_name = 'suppliers'

urlpatterns = [
    path('', views.supplier_list, name='supplier_list'),
    path('add/', views.add_supplier, name='add_supplier'),
    path('<int:supplier_id>/', views.supplier_detail, name='supplier_detail'),
    path('<int:supplier_id>/edit/', views.edit_supplier, name='edit_supplier'),
    path('<int:supplier_id>/delete/', views.delete_supplier, name='delete_supplier'),
    path('<int:supplier_id>/toggle/', views.toggle_supplier_status, name='toggle_status'),
]
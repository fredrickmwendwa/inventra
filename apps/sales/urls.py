from django.urls import path
from . import views

app_name = 'sales'

urlpatterns = [
    path('', views.sale_list, name='sale_list'),
    path('new/', views.new_sale, name='new_sale'),
    path('<int:sale_id>/', views.sale_detail, name='sale_detail'),
    path('<int:sale_id>/edit/', views.edit_sale, name='edit_sale'),
    path('<int:sale_id>/confirm/', views.confirm_sale, name='confirm_sale'),
    path('<int:sale_id>/cancel/', views.cancel_sale, name='cancel_sale'),
    path('<int:sale_id>/delete/', views.delete_sale, name='delete_sale'),
]
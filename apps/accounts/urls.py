from django.urls import path
from . import views

app_name = 'accounts'

urlpatterns = [
    path('profile/', views.profile, name='profile'),
    path('staff/', views.staff_list, name='staff_list'),
    path('staff/add/', views.add_staff, name='add_staff'),
    path('staff/<int:staff_id>/edit/', views.edit_staff, name='edit_staff'),
    path('staff/<int:staff_id>/remove/', views.remove_staff, name='remove_staff'),
]
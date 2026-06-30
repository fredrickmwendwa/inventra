from django.contrib import admin
from .models import UserProfile

@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'tenant', 'role', 'phone', 'created_at']
    search_fields = ['user__username', 'user__email', 'tenant__name']
    list_filter = ['role', 'tenant']
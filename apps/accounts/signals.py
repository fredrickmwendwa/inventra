from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import UserProfile
from apps.tenants.models import Tenant


@receiver(post_save, sender=User)
def create_profile(sender, instance, created, **kwargs):
    if created:
        tenant = Tenant.objects.first()   # or create/select appropriately

        if tenant:
            UserProfile.objects.create(
                user=instance,
                tenant=tenant,
                role="staff"
            )
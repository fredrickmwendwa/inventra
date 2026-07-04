from apps.inventory.models import Product


def user_profile(request):
    if request.user.is_authenticated:
        try:
            profile = request.user.profile
            tenant  = profile.tenant

            # Compute stock alerts for the sidebar badge on every page
            active_products = Product.objects.filter(
                tenant=tenant, is_active=True
            )
            low_stock  = [p for p in active_products if p.is_low_stock() and not p.is_out_of_stock()]
            out_of_stock = [p for p in active_products if p.is_out_of_stock()]

        except Exception:
            profile      = None
            tenant       = None
            low_stock    = []
            out_of_stock = []

        return {
            'user_profile': profile,
            'tenant':        tenant,
            'low_stock':     low_stock,
            'out_of_stock':  out_of_stock,
        }

    return {
        'user_profile': None,
        'tenant':        None,
        'low_stock':     [],
        'out_of_stock':  [],
    }
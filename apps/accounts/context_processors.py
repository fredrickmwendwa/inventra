def user_profile(request):
    if request.user.is_authenticated:
        try:
            profile = request.user.profile
            tenant = profile.tenant
        except Exception:
            profile = None
            tenant = None
        return {'user_profile': profile, 'tenant': tenant}
    return {'user_profile': None, 'tenant': None}
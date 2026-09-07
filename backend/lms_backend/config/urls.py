from django.contrib import admin
from django.urls import path, include
from django.http import JsonResponse
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import ( SpectacularAPIView, SpectacularSwaggerView,)

def root_view(request):
    return JsonResponse({
        "status": "online",
        "message": "Welcome to the LMS API",
        "endpoints": {
            "admin": "/admin/",
            "users": "/api/users/",
            "assessments": "/api/assessments/"
        }
    })


urlpatterns = [
    path("", root_view, name="api-root"),
    path("admin/", admin.site.urls),
    path("api/users/", include("apps.users.urls")),
    path("api/assessments/", include("apps.assessments.urls")),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui",),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
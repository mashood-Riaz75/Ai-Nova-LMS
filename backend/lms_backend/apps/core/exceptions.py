from django.conf import settings
import traceback
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status

def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is None:
        traceback.print_exc()

        if settings.DEBUG:
            raise exc   # Let Django show the full debug page

        return Response(
            {"error": "Internal Server Error"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )

    return response
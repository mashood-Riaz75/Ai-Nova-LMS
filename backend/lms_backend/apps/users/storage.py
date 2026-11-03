from pathlib import PurePosixPath
from uuid import uuid4

import cloudinary
from cloudinary import uploader
from django.conf import settings
from django.core.exceptions import ImproperlyConfigured
from django.core.files.storage import Storage
from django.utils.deconstruct import deconstructible


@deconstructible
class CloudinaryMediaStorage(Storage):
    def __init__(self):
        credentials = {
            "cloud_name": getattr(settings, "CLOUDINARY_CLOUD_NAME", ""),
            "api_key": getattr(settings, "CLOUDINARY_API_KEY", ""),
            "api_secret": getattr(settings, "CLOUDINARY_API_SECRET", ""),
        }
        if not all(credentials.values()):
            raise ImproperlyConfigured(
                "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and "
                "CLOUDINARY_API_SECRET must be configured for media storage."
            )

        cloudinary.config(**credentials, secure=True)

    def get_available_name(self, name, max_length=None):
        extension = PurePosixPath(name).suffix.lower()
        return f"avatars/{uuid4().hex}{extension}"

    def _save(self, name, content):
        public_id = PurePosixPath(name).with_suffix("").as_posix()
        result = uploader.upload(
            content,
            public_id=public_id,
            resource_type="image",
            overwrite=False,
            unique_filename=False,
        )
        stored_public_id = result.get("public_id")
        image_format = result.get("format")
        if not stored_public_id or not image_format:
            raise OSError("Cloudinary did not return the uploaded image details.")

        return f"{stored_public_id}.{image_format}"

    def url(self, name):
        path = PurePosixPath(name)
        public_id = path.with_suffix("").as_posix()
        image_format = path.suffix.removeprefix(".") or None
        return cloudinary.CloudinaryImage(public_id).build_url(
            format=image_format,
            secure=True,
        )

    def delete(self, name):
        public_id = PurePosixPath(name).with_suffix("").as_posix()
        result = uploader.destroy(public_id, resource_type="image")
        if result.get("result") not in {"ok", "not found"}:
            raise OSError("Cloudinary failed to delete the image.")

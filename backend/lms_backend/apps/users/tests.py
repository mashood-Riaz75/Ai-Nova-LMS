from rest_framework.test import APISimpleTestCase

from .serializers import StudentAdminSerializer


class StudentAdminSerializerTests(APISimpleTestCase):
    def test_rejects_contact_number_longer_than_model_field(self):
        serializer = StudentAdminSerializer(
            data={
                "first_name": "Test",
                "last_name": "Student",
                "contact_number": "1" * 14,
            }
        )

        self.assertFalse(serializer.is_valid())
        self.assertIn("contact_number", serializer.errors)

from rest_framework.permissions import BasePermission

class IsTeacher(BasePermission):
    """Permission check for Teacher role."""
    def has_permission(self, request, view):
        return bool(
            request.user 
            and request.user.is_authenticated 
            and request.user.role == "TEACHER"
        )

class IsStudent(BasePermission):
    """Permission check for Student role."""
    def has_permission(self, request, view):
        return bool(
            request.user 
            and request.user.is_authenticated 
            and request.user.role == "STUDENT"
        )
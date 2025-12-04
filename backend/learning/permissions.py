from rest_framework import permissions


class IsInstructorOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow instructors to edit courses/lessons.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the instructor or staff
        if hasattr(obj, 'instructor'):
            return obj.instructor == request.user or request.user.is_staff
        elif hasattr(obj, 'course'):
            return obj.course.instructor == request.user or request.user.is_staff
        
        return request.user.is_staff


class IsEnrolledOrInstructor(permissions.BasePermission):
    """
    Custom permission to only allow enrolled users or instructors to access content.
    """
    
    def has_object_permission(self, request, view, obj):
        # Staff can access everything
        if request.user.is_staff:
            return True
        
        # Get the course
        if hasattr(obj, 'course'):
            course = obj.course
        else:
            course = obj
        
        # Instructor can access
        if course.instructor == request.user:
            return True
        
        # Check if user is enrolled
        from .models import Enrollment
        return Enrollment.objects.filter(
            user=request.user,
            course=course,
            status__in=['active', 'completed']
        ).exists()


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """
    
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Write permissions are only allowed to the owner
        return obj.user == request.user or request.user.is_staff

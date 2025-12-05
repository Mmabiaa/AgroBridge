"""API views for file storage service."""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import FileResponse, HttpResponse
from django.shortcuts import get_object_or_404

from .models import StoredFile, ChunkedUpload, StorageQuota, FileAccessLog
from .serializers import (
    StoredFileSerializer, FileUploadSerializer, ChunkedUploadSerializer,
    ChunkedUploadInitiateSerializer, ChunkedUploadChunkSerializer,
    StorageQuotaSerializer, FileAccessLogSerializer
)
from .services import FileStorageService, ChunkedUploadService, QuotaService
from .permissions import IsFileOwnerOrPublic


class FileStorageViewSet(viewsets.ModelViewSet):
    """ViewSet for file storage operations."""
    
    serializer_class = StoredFileSerializer
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]
    lookup_field = 'file_key'
    
    def get_queryset(self):
        """Get files for current user."""
        user = self.request.user
        return StoredFile.objects.filter(
            uploaded_by=user,
            status__in=['AVAILABLE', 'PROCESSING']
        ).select_related('uploaded_by').prefetch_related('variants')
    
    def get_permissions(self):
        """Get permissions based on action."""
        if self.action in ['retrieve', 'download']:
            return [IsFileOwnerOrPublic()]
        return super().get_permissions()
    
    def create(self, request):
        """Upload a new file."""
        serializer = FileUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            service = FileStorageService()
            stored_file = service.upload_file(
                file=serializer.validated_data['file'],
                user=request.user,
                is_public=serializer.validated_data.get('is_public', False),
                tags=serializer.validated_data.get('tags', []),
                metadata=serializer.validated_data.get('metadata', {}),
                expires_in_days=serializer.validated_data.get('expires_in_days')
            )
            
            output_serializer = StoredFileSerializer(stored_file, context={'request': request})
            return Response(output_serializer.data, status=status.HTTP_201_CREATED)
        
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
        except Exception as e:
            return Response(
                {'error': 'Failed to upload file'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=True, methods=['get'])
    def download(self, request, file_key=None):
        """Download a file."""
        try:
            service = FileStorageService()
            file_data, filename = service.download_file(
                file_key=file_key,
                user=request.user,
                ip_address=request.META.get('REMOTE_ADDR'),
                user_agent=request.META.get('HTTP_USER_AGENT', '')
            )
            
            response = HttpResponse(file_data)
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
        
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {'error': 'Failed to download file'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def destroy(self, request, file_key=None):
        """Delete a file."""
        try:
            service = FileStorageService()
            success = service.delete_file(file_key, request.user)
            
            if success:
                return Response(status=status.HTTP_204_NO_CONTENT)
            else:
                return Response(
                    {'error': 'File not found'},
                    status=status.HTTP_404_NOT_FOUND
                )
        
        except Exception as e:
            return Response(
                {'error': 'Failed to delete file'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def my_files(self, request):
        """Get all files for current user."""
        queryset = self.get_queryset()
        
        # Filter by file type
        file_type = request.query_params.get('type')
        if file_type:
            queryset = queryset.filter(file_type=file_type.upper())
        
        # Filter by tags
        tags = request.query_params.getlist('tags')
        if tags:
            queryset = queryset.filter(tags__contains=tags)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def public_files(self, request):
        """Get public files."""
        queryset = StoredFile.objects.filter(
            is_public=True,
            status='AVAILABLE'
        ).select_related('uploaded_by')
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class ChunkedUploadViewSet(viewsets.ViewSet):
    """ViewSet for chunked/resumable uploads."""
    
    permission_classes = [IsAuthenticated]
    
    @action(detail=False, methods=['post'])
    def initiate(self, request):
        """Initiate a chunked upload."""
        serializer = ChunkedUploadInitiateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            service = ChunkedUploadService()
            upload = service.initiate_upload(
                user=request.user,
                **serializer.validated_data
            )
            
            output_serializer = ChunkedUploadSerializer(upload)
            return Response(output_serializer.data, status=status.HTTP_201_CREATED)
        
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['post'])
    def upload_chunk(self, request, pk=None):
        """Upload a chunk."""
        serializer = ChunkedUploadChunkSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        try:
            service = ChunkedUploadService()
            upload = service.upload_chunk(
                upload_id=pk,
                chunk_number=serializer.validated_data['chunk_number'],
                chunk_data=serializer.validated_data['chunk_data'].read(),
                user=request.user
            )
            
            output_serializer = ChunkedUploadSerializer(upload)
            return Response(output_serializer.data)
        
        except ChunkedUpload.DoesNotExist:
            return Response(
                {'error': 'Upload not found'},
                status=status.HTTP_404_NOT_FOUND
            )
        except ValueError as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )
    
    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """Get upload status."""
        try:
            upload = ChunkedUpload.objects.get(
                upload_id=pk,
                uploaded_by=request.user
            )
            serializer = ChunkedUploadSerializer(upload)
            return Response(serializer.data)
        
        except ChunkedUpload.DoesNotExist:
            return Response(
                {'error': 'Upload not found'},
                status=status.HTTP_404_NOT_FOUND
            )


class StorageQuotaViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for storage quota."""
    
    serializer_class = StorageQuotaSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get quota for current user."""
        return StorageQuota.objects.filter(user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def my_quota(self, request):
        """Get current user's quota."""
        service = QuotaService()
        quota = service.get_or_create_quota(request.user)
        serializer = self.get_serializer(quota)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def recalculate(self, request):
        """Recalculate storage usage."""
        service = QuotaService()
        quota = service.recalculate_quota(request.user)
        serializer = self.get_serializer(quota)
        return Response(serializer.data)


class FileAccessLogViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for file access logs."""
    
    serializer_class = FileAccessLogSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Get access logs for current user's files."""
        return FileAccessLog.objects.filter(
            file__uploaded_by=self.request.user
        ).select_related('file', 'user').order_by('-accessed_at')
    
    @action(detail=False, methods=['get'])
    def my_files_access(self, request):
        """Get access logs for user's files."""
        queryset = self.get_queryset()
        
        # Filter by file
        file_key = request.query_params.get('file_key')
        if file_key:
            queryset = queryset.filter(file__file_key=file_key)
        
        # Filter by access type
        access_type = request.query_params.get('access_type')
        if access_type:
            queryset = queryset.filter(access_type=access_type.upper())
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = self.get_serializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

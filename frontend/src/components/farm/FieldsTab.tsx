import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { FieldCard } from '@/components/organisms/FieldCard';
import { FieldForm, FieldFormValues } from '@/components/forms/FieldForm';
import farmsService, { Field } from '@/api/services/farmsService';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface FieldsTabProps {
  farmId: string;
}

export function FieldsTab({ farmId }: FieldsTabProps) {
  const queryClient = useQueryClient();
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [deletingFieldId, setDeletingFieldId] = useState<string | null>(null);

  // Fetch fields
  const { data: fields, isLoading } = useQuery({
    queryKey: ['farms', farmId, 'fields'],
    queryFn: () => farmsService.getFields(farmId),
    enabled: !!farmId,
  });

  // Create field mutation
  const createField = useMutation({
    mutationFn: (data: FieldFormValues) => farmsService.createField(farmId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms', farmId, 'fields'] });
      toast.success('Field created successfully');
      setShowFieldForm(false);
    },
    onError: (error: any) => {
      toast.error('Failed to create field', {
        description: error?.message || 'An error occurred',
      });
    },
  });

  // Update field mutation
  const updateField = useMutation({
    mutationFn: ({ fieldId, data }: { fieldId: string; data: FieldFormValues }) =>
      farmsService.updateField(farmId, fieldId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms', farmId, 'fields'] });
      toast.success('Field updated successfully');
      setEditingField(null);
      setShowFieldForm(false);
    },
    onError: (error: any) => {
      toast.error('Failed to update field', {
        description: error?.message || 'An error occurred',
      });
    },
  });

  // Delete field mutation
  const deleteField = useMutation({
    mutationFn: (fieldId: string) => farmsService.deleteField(farmId, fieldId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms', farmId, 'fields'] });
      toast.success('Field deleted successfully');
      setDeletingFieldId(null);
    },
    onError: (error: any) => {
      toast.error('Failed to delete field', {
        description: error?.message || 'An error occurred',
      });
    },
  });

  const handleCreateField = () => {
    setEditingField(null);
    setShowFieldForm(true);
  };

  const handleEditField = (fieldId: string) => {
    const field = fields?.find((f) => f.id === fieldId);
    if (field) {
      setEditingField(field);
      setShowFieldForm(true);
    }
  };

  const handleDeleteField = (fieldId: string) => {
    setDeletingFieldId(fieldId);
  };

  const confirmDelete = () => {
    if (deletingFieldId) {
      deleteField.mutate(deletingFieldId);
    }
  };

  const handleSubmit = (values: FieldFormValues) => {
    if (editingField) {
      updateField.mutate({ fieldId: editingField.id, data: values });
    } else {
      createField.mutate(values);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Fields</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Fields</CardTitle>
          <Button onClick={handleCreateField}>
            <Plus className="h-4 w-4 mr-2" />
            Add Field
          </Button>
        </CardHeader>
        <CardContent>
          {!fields || fields.length === 0 ? (
            <EmptyState
              title="No fields yet"
              description="Add fields to organize your farm into manageable sections"
              action={{
                label: 'Add Field',
                onClick: handleCreateField,
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {fields.map((field) => (
                <FieldCard
                  key={field.id}
                  field={field}
                  onEdit={handleEditField}
                  onDelete={handleDeleteField}
                  showActions={true}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Field Form Dialog */}
      <FieldForm
        open={showFieldForm}
        onOpenChange={setShowFieldForm}
        defaultValues={
          editingField
            ? {
                name: editingField.name,
                size_hectares: editingField.size_hectares,
                soil_type: editingField.soil_type,
                irrigation_type: editingField.irrigation_type,
              }
            : undefined
        }
        onSubmit={handleSubmit}
        isSubmitting={createField.isPending || updateField.isPending}
        title={editingField ? 'Edit Field' : 'Add Field'}
        description={
          editingField
            ? 'Update field information'
            : 'Create a new field for this farm'
        }
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingFieldId}
        onOpenChange={(open) => !open && setDeletingFieldId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this field and all associated crops.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Field
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

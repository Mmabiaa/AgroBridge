import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/molecules/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { CropCard } from '@/components/organisms/CropCard';
import { CropForm, CropFormValues } from '@/components/forms/CropForm';
import { HarvestForm, HarvestFormValues } from '@/components/forms/HarvestForm';
import farmsService, { Crop } from '@/api/services/farmsService';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CropsTabProps {
  farmId: string;
}

export function CropsTab({ farmId }: CropsTabProps) {
  const queryClient = useQueryClient();
  const [showCropForm, setShowCropForm] = useState(false);
  const [showHarvestForm, setShowHarvestForm] = useState(false);
  const [editingCrop, setEditingCrop] = useState<Crop | null>(null);
  const [harvestingCrop, setHarvestingCrop] = useState<Crop | null>(null);
  const [deletingCropId, setDeletingCropId] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string>('');

  // Fetch fields to get field IDs
  const { data: fields } = useQuery({
    queryKey: ['farms', farmId, 'fields'],
    queryFn: () => farmsService.getFields(farmId),
    enabled: !!farmId,
  });

  // Fetch all crops for the farm
  const { data: crops, isLoading } = useQuery({
    queryKey: ['farms', farmId, 'crops'],
    queryFn: () => farmsService.getFarmCrops(farmId),
    enabled: !!farmId,
  });

  // Plant crop mutation
  const plantCrop = useMutation({
    mutationFn: ({ fieldId, data }: { fieldId: string; data: CropFormValues }) =>
      farmsService.plantCrop(farmId, fieldId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms', farmId, 'crops'] });
      toast.success('Crop planted successfully');
      setShowCropForm(false);
      setSelectedFieldId('');
    },
    onError: (error: any) => {
      toast.error('Failed to plant crop', {
        description: error?.message || 'An error occurred',
      });
    },
  });

  // Update crop mutation
  const updateCrop = useMutation({
    mutationFn: ({
      fieldId,
      cropId,
      data,
    }: {
      fieldId: string;
      cropId: string;
      data: CropFormValues;
    }) => farmsService.updateCrop(farmId, fieldId, cropId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms', farmId, 'crops'] });
      toast.success('Crop updated successfully');
      setEditingCrop(null);
      setShowCropForm(false);
    },
    onError: (error: any) => {
      toast.error('Failed to update crop', {
        description: error?.message || 'An error occurred',
      });
    },
  });

  // Record harvest mutation
  const recordHarvest = useMutation({
    mutationFn: ({
      fieldId,
      cropId,
      data,
    }: {
      fieldId: string;
      cropId: string;
      data: HarvestFormValues;
    }) => farmsService.recordHarvest(farmId, fieldId, cropId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms', farmId, 'crops'] });
      toast.success('Harvest recorded successfully');
      setHarvestingCrop(null);
      setShowHarvestForm(false);
    },
    onError: (error: any) => {
      toast.error('Failed to record harvest', {
        description: error?.message || 'An error occurred',
      });
    },
  });

  // Delete crop mutation
  const deleteCrop = useMutation({
    mutationFn: ({ fieldId, cropId }: { fieldId: string; cropId: string }) =>
      farmsService.deleteCrop(farmId, fieldId, cropId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['farms', farmId, 'crops'] });
      toast.success('Crop deleted successfully');
      setDeletingCropId(null);
    },
    onError: (error: any) => {
      toast.error('Failed to delete crop', {
        description: error?.message || 'An error occurred',
      });
    },
  });

  const handlePlantCrop = () => {
    if (!fields || fields.length === 0) {
      toast.error('No fields available', {
        description: 'Please create a field before planting crops',
      });
      return;
    }
    setEditingCrop(null);
    setShowCropForm(true);
  };

  const handleEditCrop = (cropId: string) => {
    const crop = crops?.find((c) => c.id === cropId);
    if (crop) {
      setEditingCrop(crop);
      setSelectedFieldId(crop.field);
      setShowCropForm(true);
    }
  };

  const handleDeleteCrop = (cropId: string) => {
    setDeletingCropId(cropId);
  };

  const handleHarvestCrop = (cropId: string) => {
    const crop = crops?.find((c) => c.id === cropId);
    if (crop) {
      setHarvestingCrop(crop);
      setShowHarvestForm(true);
    }
  };

  const confirmDelete = () => {
    if (deletingCropId) {
      const crop = crops?.find((c) => c.id === deletingCropId);
      if (crop) {
        deleteCrop.mutate({ fieldId: crop.field, cropId: deletingCropId });
      }
    }
  };

  const handleCropSubmit = (values: CropFormValues) => {
    if (!selectedFieldId && !editingCrop) {
      toast.error('Please select a field');
      return;
    }

    if (editingCrop) {
      updateCrop.mutate({
        fieldId: editingCrop.field,
        cropId: editingCrop.id,
        data: values,
      });
    } else {
      plantCrop.mutate({ fieldId: selectedFieldId, data: values });
    }
  };

  const handleHarvestSubmit = (values: HarvestFormValues) => {
    if (harvestingCrop) {
      recordHarvest.mutate({
        fieldId: harvestingCrop.field,
        cropId: harvestingCrop.id,
        data: values,
      });
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Crops</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48" />
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
          <CardTitle>Crops</CardTitle>
          <Button onClick={handlePlantCrop}>
            <Plus className="h-4 w-4 mr-2" />
            Plant Crop
          </Button>
        </CardHeader>
        <CardContent>
          {!crops || crops.length === 0 ? (
            <EmptyState
              title="No crops planted"
              description="Start planting crops to track their growth and harvest"
              action={{
                label: 'Plant Crop',
                onClick: handlePlantCrop,
              }}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {crops.map((crop) => (
                <CropCard
                  key={crop.id}
                  crop={crop}
                  onEdit={handleEditCrop}
                  onDelete={handleDeleteCrop}
                  onHarvest={handleHarvestCrop}
                  showActions={true}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Crop Form Dialog */}
      {showCropForm && (
        <Dialog open={showCropForm} onOpenChange={setShowCropForm}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingCrop ? 'Edit Crop' : 'Plant Crop'}</DialogTitle>
              <DialogDescription>
                {editingCrop
                  ? 'Update crop information'
                  : 'Add a new crop to a field'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {!editingCrop && fields && fields.length > 0 && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Select Field *</label>
                  <Select value={selectedFieldId} onValueChange={setSelectedFieldId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a field" />
                    </SelectTrigger>
                    <SelectContent>
                      {fields.map((field) => (
                        <SelectItem key={field.id} value={field.id}>
                          {field.name} ({field.size_hectares} ha)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <CropForm
                open={showCropForm}
                onOpenChange={setShowCropForm}
                defaultValues={
                  editingCrop
                    ? {
                        crop_type: editingCrop.crop_type,
                        variety: editingCrop.variety,
                        planting_date: editingCrop.planting_date,
                        expected_harvest_date: editingCrop.expected_harvest_date,
                        quantity_planted: editingCrop.quantity_planted,
                        unit: editingCrop.unit,
                        notes: editingCrop.notes,
                      }
                    : undefined
                }
                onSubmit={handleCropSubmit}
                isSubmitting={plantCrop.isPending || updateCrop.isPending}
                title={editingCrop ? 'Edit Crop' : 'Plant Crop'}
                description={
                  editingCrop
                    ? 'Update crop information'
                    : 'Add a new crop to this field'
                }
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Harvest Form Dialog */}
      {harvestingCrop && (
        <HarvestForm
          open={showHarvestForm}
          onOpenChange={setShowHarvestForm}
          onSubmit={handleHarvestSubmit}
          isSubmitting={recordHarvest.isPending}
          cropType={harvestingCrop.crop_type}
          unit={harvestingCrop.unit}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deletingCropId}
        onOpenChange={(open) => !open && setDeletingCropId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this crop record. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Crop
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Import Dialog components
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

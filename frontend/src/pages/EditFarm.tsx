import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { FarmForm, FarmFormValues } from '@/components/forms/FarmForm';
import { useFarm, useUpdateFarm } from '@/api/hooks/useFarms';
import { ErrorState } from '@/components/molecules/ErrorState';
import { toast } from 'sonner';

export default function EditFarm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: farm, isLoading, isError, error, refetch } = useFarm(id || '');
  const updateFarm = useUpdateFarm();

  const handleSubmit = async (values: FarmFormValues) => {
    if (!id) return;

    try {
      // Transform crops string to array
      const cropsArray = values.crops
        ? values.crops.split(',').map((crop) => crop.trim()).filter(Boolean)
        : [];

      const farmData = {
        name: values.name,
        description: values.description || '',
        farm_type: values.farm_type,
        size_hectares: values.size_hectares,
        crops: cropsArray,
        location: values.location,
      };

      await updateFarm.mutateAsync({ id, data: farmData });
      
      toast.success('Farm updated successfully!', {
        description: `${values.name} has been updated.`,
      });

      navigate(`/farms/${id}`);
    } catch (error: any) {
      toast.error('Failed to update farm', {
        description: error?.message || 'An error occurred while updating the farm.',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (isError || !farm) {
    return (
      <div className="container mx-auto px-4 py-6 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/farms')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Farms
        </Button>
        <ErrorState
          title="Failed to load farm"
          message={error?.message || 'The farm could not be found'}
          onRetry={refetch}
        />
      </div>
    );
  }

  // Transform farm data to form values
  const defaultValues: Partial<FarmFormValues> = {
    name: farm.name,
    description: farm.description || '',
    farm_type: farm.farm_type,
    size_hectares: farm.size_hectares,
    crops: farm.crops?.join(', ') || '',
    location: farm.location,
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/farms/${id}`)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Farm Details
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Edit Farm</h1>
        <p className="text-muted-foreground mt-1">
          Update information for {farm.name}
        </p>
      </div>

      {/* Form */}
      <FarmForm
        defaultValues={defaultValues}
        onSubmit={handleSubmit}
        isSubmitting={updateFarm.isPending}
        submitLabel="Update Farm"
      />
    </div>
  );
}

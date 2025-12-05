import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { FarmForm, FarmFormValues } from '@/components/forms/FarmForm';
import { useCreateFarm } from '@/api/hooks/useFarms';
import { toast } from 'sonner';

export default function CreateFarm() {
  const navigate = useNavigate();
  const createFarm = useCreateFarm();

  const handleSubmit = async (values: FarmFormValues) => {
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

      const newFarm = await createFarm.mutateAsync(farmData);
      
      toast.success('Farm created successfully!', {
        description: `${newFarm.name} has been added to your farms.`,
      });

      navigate(`/farms/${newFarm.id}`);
    } catch (error: any) {
      toast.error('Failed to create farm', {
        description: error?.message || 'An error occurred while creating the farm.',
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/farms')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Farms
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create New Farm</h1>
        <p className="text-muted-foreground mt-1">
          Add a new farm to your agricultural operations
        </p>
      </div>

      {/* Form */}
      <FarmForm
        onSubmit={handleSubmit}
        isSubmitting={createFarm.isPending}
        submitLabel="Create Farm"
      />
    </div>
  );
}

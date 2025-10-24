import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCreateProduct } from '@/api/hooks/useMarketplace';
import { ProductCreateData } from '@/types/basicTypes';

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface ProductFormData {
  name: string;
  description: string;
  price_per_unit: number;
  unit_type: string;
  quantity_available: number;
  category: string;
  status?: string;
  quality_grade?: string;
  location?: string;
  delivery_available?: boolean;
  pickup_available?: boolean;
  organic?: boolean;
}

export const CreateProductModal: React.FC<CreateProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<ProductFormData>({
    defaultValues: {
      status: 'active',
      unit_type: 'kg',
      quality_grade: 'A',
      delivery_available: false,
      pickup_available: false,
      organic: false,
    },
  });

  const createProductMutation = useCreateProduct();

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      const productData: ProductCreateData = {
        name: data.name,
        description: data.description,
        price_per_unit: Number(data.price_per_unit),
        unit_type: data.unit_type,
        quantity_available: Number(data.quantity_available),
        category: Number(data.category),
        status: data.status || 'active',
        is_active: true,
        quality_grade: data.quality_grade,
        location: data.location,
        delivery_available: data.delivery_available,
        pickup_available: data.pickup_available,
        organic: data.organic,
      };

      await createProductMutation.mutateAsync(productData);
      
      reset();
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Product creation error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Mock categories - you should replace this with actual categories from your API
  const categories = [
    { id: 1, name: 'Vegetables' },
    { id: 2, name: 'Fruits' },
    { id: 3, name: 'Grains' },
    { id: 4, name: 'Livestock' },
    { id: 5, name: 'Dairy' },
    { id: 6, name: 'Poultry' },
  ];

  const unitTypes = [
    'kg',
    'g',
    'lb',
    'oz',
    'piece',
    'bunch',
    'crate',
    'bag',
    'liter',
    'gallon',
  ];

  const qualityGrades = ['A', 'B', 'C', 'Premium', 'Standard', 'Commercial'];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>List New Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Basic Information</h3>
            
            <div className="grid grid-cols-1 gap-4">
              <div>
                <Label htmlFor="name">Product Name *</Label>
                <Input
                  id="name"
                  {...register('name', { required: 'Product name is required' })}
                  placeholder="Enter product name"
                />
                {errors.name && (
                  <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  {...register('description', { required: 'Description is required' })}
                  placeholder="Describe your product"
                  rows={3}
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="category">Category *</Label>
                <Select 
                  onValueChange={(value) => setValue('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id.toString()}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-red-500 mt-1">Category is required</p>
                )}
              </div>
            </div>
          </div>

          {/* Pricing & Quantity */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Pricing & Quantity</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price_per_unit">Price per Unit *</Label>
                <Input
                  id="price_per_unit"
                  type="number"
                  step="0.01"
                  min="0"
                  {...register('price_per_unit', { 
                    required: 'Price is required',
                    min: { value: 0, message: 'Price must be positive' }
                  })}
                  placeholder="0.00"
                />
                {errors.price_per_unit && (
                  <p className="text-sm text-red-500 mt-1">{errors.price_per_unit.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="unit_type">Unit Type *</Label>
                <Select 
                  onValueChange={(value) => setValue('unit_type', value)} 
                  defaultValue="kg"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {unitTypes.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity_available">Quantity Available *</Label>
                <Input
                  id="quantity_available"
                  type="number"
                  min="0"
                  {...register('quantity_available', { 
                    required: 'Quantity is required',
                    min: { value: 0, message: 'Quantity must be positive' }
                  })}
                  placeholder="0"
                />
                {errors.quantity_available && (
                  <p className="text-sm text-red-500 mt-1">{errors.quantity_available.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Product Details</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quality_grade">Quality Grade</Label>
                <Select 
                  onValueChange={(value) => setValue('quality_grade', value)} 
                  defaultValue="A"
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {qualityGrades.map((grade) => (
                      <SelectItem key={grade} value={grade}>
                        {grade}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  {...register('location')}
                  placeholder="Enter location"
                />
              </div>
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="organic"
                  {...register('organic')}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="organic" className="text-sm">Organic</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="delivery_available"
                  {...register('delivery_available')}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="delivery_available" className="text-sm">Delivery Available</Label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="pickup_available"
                  {...register('pickup_available')}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="pickup_available" className="text-sm">Pickup Available</Label>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Creating...
                </>
              ) : (
                'Create Product'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
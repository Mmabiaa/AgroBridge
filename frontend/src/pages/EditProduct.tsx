import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useProduct, useUpdateProduct, useCategories } from '@/api/hooks/useMarketplace';
import { ProductUpdateData } from '@/types/basicTypes';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';

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
  is_active?: boolean;
}

export default function EditProduct() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch product and categories
  const { data: product, isLoading: productLoading } = useProduct(id || '', !!id);
  const { data: categoriesData } = useCategories();
  const updateProductMutation = useUpdateProduct();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<ProductFormData>();

  // Load product data into form
  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        description: product.description,
        price_per_unit: product.price_per_unit,
        unit_type: product.unit_type,
        quantity_available: product.quantity_available,
        category: typeof product.category === 'number' ? product.category.toString() : '',
        status: product.status,
        quality_grade: product.quality_grade,
        location: typeof product.location === 'string' ? product.location : '',
        delivery_available: product.delivery_available,
        pickup_available: product.pickup_available,
        organic: product.organic,
        is_active: product.is_active,
      });
    }
  }, [product, reset]);

  const categories = Array.isArray(categoriesData) ? categoriesData : [];
  const isActive = watch('is_active');

  const onSubmit = async (data: ProductFormData) => {
    if (!id) return;

    setIsSubmitting(true);
    try {
      const updateData: ProductUpdateData = {
        name: data.name,
        description: data.description,
        price_per_unit: Number(data.price_per_unit),
        unit_type: data.unit_type,
        quantity_available: Number(data.quantity_available),
        category: Number(data.category),
        status: data.status,
        quality_grade: data.quality_grade,
        is_active: data.is_active,
      };

      await updateProductMutation.mutateAsync({ id, data: updateData });
      toast.success('Product updated successfully!');
      navigate(`/marketplace/products/${id}`);
    } catch (error) {
      console.error('Product update error:', error);
      toast.error('Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const unitTypes = [
    { value: 'kg', label: 'Kilogram' },
    { value: 'g', label: 'Gram' },
    { value: 'lb', label: 'Pound' },
    { value: 'ton', label: 'Ton' },
    { value: 'piece', label: 'Piece' },
    { value: 'dozen', label: 'Dozen' },
    { value: 'bag', label: 'Bag' },
    { value: 'box', label: 'Box' },
    { value: 'crate', label: 'Crate' },
    { value: 'liter', label: 'Liter' },
    { value: 'gallon', label: 'Gallon' }
  ];

  const qualityGrades = [
    { value: 'premium', label: 'Premium' },
    { value: 'grade_a', label: 'Grade A' },
    { value: 'grade_b', label: 'Grade B' },
    { value: 'standard', label: 'Standard' },
    { value: 'organic', label: 'Organic Certified' }
  ];

  if (productLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <h3 className="text-lg font-semibold mb-2">Product not found</h3>
          <Button onClick={() => navigate('/marketplace')}>
            Back to Marketplace
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Edit Product</h1>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="is_active">Active</Label>
          <Switch
            id="is_active"
            checked={isActive}
            onCheckedChange={(checked) => setValue('is_active', checked)}
          />
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
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
                rows={4}
              />
              {errors.description && (
                <p className="text-sm text-red-500 mt-1">{errors.description.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="category">Category *</Label>
              <Select 
                value={watch('category')}
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pricing & Quantity</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price_per_unit">Price per Unit *</Label>
                <Input
                  id="price_per_unit"
                  type="number"
                  step="0.01"
                  min="0.01"
                  {...register('price_per_unit', { 
                    required: 'Price is required',
                    min: { value: 0.01, message: 'Price must be at least 0.01' }
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
                  value={watch('unit_type')}
                  onValueChange={(value) => setValue('unit_type', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {unitTypes.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
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
                  step="0.01"
                  min="0"
                  {...register('quantity_available', { 
                    required: 'Quantity is required',
                    min: { value: 0, message: 'Quantity must be at least 0' }
                  })}
                  placeholder="0"
                />
                {errors.quantity_available && (
                  <p className="text-sm text-red-500 mt-1">{errors.quantity_available.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Product Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="quality_grade">Quality Grade</Label>
                <Select 
                  value={watch('quality_grade')}
                  onValueChange={(value) => setValue('quality_grade', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {qualityGrades.map((grade) => (
                      <SelectItem key={grade.value} value={grade.value}>
                        {grade.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={watch('status')}
                  onValueChange={(value) => setValue('status', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="organic"
                  {...register('organic')}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="organic" className="text-sm">Organic Certified</Label>
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
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

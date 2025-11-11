import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useCreateProductWithImages, useCategories } from '@/api/hooks/useMarketplace';
import { ProductCreateData } from '@/types/basicTypes';
import { Upload, X, Image as ImageIcon, Loader2, Folder, FolderOpen } from 'lucide-react';

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
  organic_certified?: boolean;
}

interface Category {
  id: number;
  name: string;
  description?: string;
  parent?: number | null;
  subcategories?: Category[];
  is_expanded?: boolean;
}

export const CreateProductModal: React.FC<CreateProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
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
      quality_grade: 'standard',
      delivery_available: false,
      pickup_available: true,
      organic_certified: false,
    },
  });

  const createProductMutation = useCreateProductWithImages();
  const { data: categoriesData, isLoading: categoriesLoading, error: categoriesError } = useCategories();

  // Fallback categories in case API returns empty
  const fallbackCategories: Category[] = [
    { id: 1, name: 'Fruits', description: 'Fresh fruits' },
    { id: 2, name: 'Vegetables', description: 'Fresh vegetables' },
    { id: 3, name: 'Grains', description: 'Various grains' },
    { id: 4, name: 'Dairy', description: 'Dairy products' },
    { id: 5, name: 'Meat & Poultry', description: 'Meat and poultry products' },
    { id: 6, name: 'Seafood', description: 'Fresh and frozen seafood' },
    { id: 7, name: 'Herbs & Spices', description: 'Fresh and dried herbs and spices' },
    { id: 8, name: 'Nuts & Seeds', description: 'Various nuts and seeds' },
    { id: 9, name: 'Organic Products', description: 'Certified organic products' },
    { id: 10, name: 'Processed Foods', description: 'Processed food items' },
  ];

  // SIMPLIFIED categories processing - FIXED VERSION
  const processedCategories = (() => {
    if (categoriesLoading) {
      console.log('Categories loading...');
      return [];
    }

    if (categoriesError) {
      console.log('Categories error, using fallback');
      return fallbackCategories;
    }

    if (!categoriesData) {
      console.log('No categories data, using fallback');
      return fallbackCategories;
    }

    console.log('Raw categories data:', categoriesData);

    // Your API returns {count, next, previous, results: [...]}
    if (categoriesData.results && Array.isArray(categoriesData.results)) {
      console.log(`✅ Found ${categoriesData.results.length} categories in 'results' array`);
      return categoriesData.results;
    }

    // Fallback to direct array if available
    if (Array.isArray(categoriesData)) {
      console.log(`✅ Found ${categoriesData.length} categories in direct array`);
      return categoriesData;
    }

    console.log('❌ No categories found in expected format, using fallback');
    return fallbackCategories;
  })();

  // Handle category selection
  const handleCategoryChange = (value: string) => {
    console.log('Category selected:', value);
    setSelectedCategory(value);
    setValue('category', value);
  };

  // Handle image upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newImages = Array.from(files).slice(0, 5 - images.length);
    const newImagePreviews = newImages.map(file => URL.createObjectURL(file));

    setImages(prev => [...prev, ...newImages]);
    setImagePreviews(prev => [...prev, ...newImagePreviews]);
  };

  // Remove image
  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const onSubmit = async (data: ProductFormData) => {
    setIsSubmitting(true);
    try {
      const locationJson = data.location ? JSON.stringify({
        address: data.location,
        coordinates: { 
          latitude: 5.6037,
          longitude: -0.1870 
        }
      }) : undefined;

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
        location: locationJson,
        delivery_available: data.delivery_available,
        pickup_available: data.pickup_available,
        organic_certified: data.organic_certified,
      };

      console.log('Submitting product data:', productData);
      console.log('With images:', images.length);

      await createProductMutation.mutateAsync({
        productData,
        images
      });
      
      reset();
      setImages([]);
      setImagePreviews([]);
      setSelectedCategory('');
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
    setImages([]);
    setImagePreviews([]);
    setSelectedCategory('');
    onClose();
  };

  // Use exact unit types from your Django model
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

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>List New Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Image Upload */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Product Images</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <input
                type="file"
                id="images"
                multiple
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <label htmlFor="images" className="cursor-pointer">
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <p className="text-sm text-gray-600">
                  Click to upload images (max 5)
                </p>
                <p className="text-xs text-gray-500">
                  PNG, JPG, JPEG up to 5MB each
                </p>
              </label>
            </div>

            {/* Image Previews */}
            {imagePreviews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-24 object-cover rounded-lg"
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

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
                  value={selectedCategory}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      categoriesLoading ? "Loading categories..." : 
                      processedCategories.length === 0 ? "No categories available" :
                      "Select category"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriesLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Loading categories...
                      </div>
                    ) : processedCategories.length === 0 ? (
                      <div className="text-center p-4 text-gray-500 text-sm">
                        No categories available
                      </div>
                    ) : (
                      processedCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id.toString()}>
                          {category.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {errors.category && (
                  <p className="text-sm text-red-500 mt-1">Category is required</p>
                )}
                {!categoriesLoading && processedCategories.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {processedCategories.length} categories available
                    {categoriesError && " (using fallback)"}
                  </p>
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
                  onValueChange={(value) => setValue('unit_type', value)} 
                  defaultValue="kg"
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
                  min="0.01"
                  {...register('quantity_available', { 
                    required: 'Quantity is required',
                    min: { value: 0.01, message: 'Quantity must be at least 0.01' }
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
                  defaultValue="standard"
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
                <Label htmlFor="location">Location Address</Label>
                <Input
                  id="location"
                  {...register('location')}
                  placeholder="Enter your location address"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This will be converted to coordinates automatically
                </p>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="organic_certified"
                  {...register('organic_certified')}
                  className="rounded border-gray-300"
                />
                <Label htmlFor="organic_certified" className="text-sm">Organic Certified</Label>
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
                  defaultChecked
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
              disabled={isSubmitting || categoriesLoading || !selectedCategory}
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
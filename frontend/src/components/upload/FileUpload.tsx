
import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  File, 
  Image, 
  FileText, 
  X, 
  Check,
  AlertCircle,
  Download,
  Eye
} from 'lucide-react';

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'completed' | 'error';
  progress: number;
  url?: string;
  error?: string;
}

export function FileUpload({ onProductUpload }) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Product form state
  const [form, setForm] = useState({
    name: '',
    farmer: '',
    location: '',
    price: '',
    previousPrice: '',
    unit: 'kg',
    quantity: '',
    rating: 5,
    image: '',
    category: 'Vegetables',
    isOrganic: false,
    harvestDate: '',
    deliveryOptions: []
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const droppedFiles = Array.from(e.dataTransfer.files);
    handleFiles(droppedFiles);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    handleFiles(selectedFiles);
  };

  const handleFiles = (fileList: File[]) => {
    const newFiles: UploadedFile[] = fileList.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0
    }));

    setFiles(prev => [...prev, ...newFiles]);

    // Simulate upload process
    newFiles.forEach(file => {
      simulateUpload(file.id);
    });
  };

  const simulateUpload = (fileId: string) => {
    const interval = setInterval(() => {
      setFiles(prev => prev.map(file => {
        if (file.id === fileId) {
          const newProgress = Math.min(file.progress + Math.random() * 20, 100);
          
          if (newProgress >= 100) {
            clearInterval(interval);
            // Randomly simulate success or error
            const isSuccess = Math.random() > 0.1; // 90% success rate
            
            return {
              ...file,
              progress: 100,
              status: isSuccess ? 'completed' : 'error',
              url: isSuccess ? `/uploads/${file.name}` : undefined,
              error: isSuccess ? undefined : 'Upload failed. Please try again.'
            };
          }
          
          return { ...file, progress: newProgress };
        }
        return file;
      }));
    }, 200);
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(file => file.id !== fileId));
  };

  const retryUpload = (fileId: string) => {
    setFiles(prev => prev.map(file => 
      file.id === fileId 
        ? { ...file, status: 'uploading', progress: 0, error: undefined }
        : file
    ));
    simulateUpload(fileId);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.includes('pdf') || type.includes('document')) return FileText;
    return File;
  };

  // Handle product form field changes
  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox'
        ? (e.target as HTMLInputElement).checked
        : value
    }));
  };

  // Handle delivery options (multi-select)
  const handleDeliveryOption = (option: string) => {
    setForm(prev => {
      const exists = prev.deliveryOptions.includes(option);
      return {
        ...prev,
        deliveryOptions: exists
          ? prev.deliveryOptions.filter(o => o !== option)
          : [...prev.deliveryOptions, option]
      };
    });
  };

  // Handle product submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.farmer || !form.location || !form.price || !form.quantity || !form.harvestDate) return;
    const newProduct = {
      id: Math.random().toString(36).substr(2, 9),
      ...form,
      price: Number(form.price),
      previousPrice: Number(form.previousPrice) || Number(form.price),
      quantity: Number(form.quantity),
      rating: Number(form.rating),
      image: files.find(f => f.status === 'completed')?.url || '/placeholder.svg',
      harvestDate: form.harvestDate,
    };
    if (onProductUpload) {
      onProductUpload(newProduct);
      setSubmitSuccess(true);
      setForm({
        name: '', farmer: '', location: '', price: '', previousPrice: '', unit: 'kg', quantity: '', rating: 5, image: '', category: 'Vegetables', isOrganic: false, harvestDate: '', deliveryOptions: []
      });
      setFiles([]);
      setTimeout(() => setSubmitSuccess(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {onProductUpload && (
        <Card className="shadow-soft mb-6">
          <CardHeader>
            <CardTitle>Sell a Product</CardTitle>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input name="name" value={form.name} onChange={handleFormChange} placeholder="Product Name" className="input input-bordered w-full" required />
                <input name="farmer" value={form.farmer} onChange={handleFormChange} placeholder="Your Name" className="input input-bordered w-full" required />
                <input name="location" value={form.location} onChange={handleFormChange} placeholder="Location" className="input input-bordered w-full" required />
                <input name="price" value={form.price} onChange={handleFormChange} placeholder="Price (₵)" type="number" min="0" className="input input-bordered w-full" required />
                <input name="previousPrice" value={form.previousPrice} onChange={handleFormChange} placeholder="Previous Price (₵)" type="number" min="0" className="input input-bordered w-full" />
                <input name="quantity" value={form.quantity} onChange={handleFormChange} placeholder="Quantity" type="number" min="1" className="input input-bordered w-full" required />
                <input name="harvestDate" value={form.harvestDate} onChange={handleFormChange} placeholder="Harvest Date" type="date" className="input input-bordered w-full" required />
                <select name="category" value={form.category} onChange={handleFormChange} className="input input-bordered w-full">
                  <option value="Vegetables">Vegetables</option>
                  <option value="Fruits">Fruits</option>
                  <option value="Grains">Grains</option>
                  <option value="Livestock">Livestock</option>
                </select>
                <label className="flex items-center gap-2">
                  <input type="checkbox" name="isOrganic" checked={form.isOrganic} onChange={handleFormChange} /> Organic
                </label>
                <select name="unit" value={form.unit} onChange={handleFormChange} className="input input-bordered w-full">
                  <option value="kg">kg</option>
                  <option value="bag">bag</option>
                  <option value="crate">crate</option>
                  <option value="litre">litre</option>
                </select>
              </div>
              <div className="flex flex-wrap gap-2">
                {['Pickup', 'Local Delivery', 'Regional Shipping', 'Nationwide Shipping'].map(opt => (
                  <label key={opt} className="flex items-center gap-1">
                    <input type="checkbox" checked={form.deliveryOptions.includes(opt)} onChange={() => handleDeliveryOption(opt)} />
                    {opt}
                  </label>
                ))}
              </div>
              <div>
                <label className="block mb-2 font-medium">Product Image</label>
                {/* Use file upload area for image */}
                {/* Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 ${
                    isDragging 
                      ? 'border-primary bg-primary/10' 
                      : 'border-primary/30 hover:border-primary/50'
                  }`}
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                >
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 rounded-full bg-primary/10">
                      <Upload className="h-8 w-8 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-2">
                        Drop image here or click to upload
                      </h3>
                      <p className="text-xs text-muted-foreground">
                        Maximum file size: 10MB • Supported formats: PNG, JPG, JPEG
                      </p>
                    </div>
                    <Button onClick={() => document.getElementById('file-input')?.click()}>
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Image
                    </Button>
                  </div>
                  <input
                    id="file-input"
                    type="file"
                    multiple={false}
                    onChange={handleFileSelect}
                    className="hidden"
                    accept=".png,.jpg,.jpeg"
                  />
                </div>
                {/* Show uploaded image preview */}
                {files.length > 0 && files[0].status === 'completed' && (
                  <div className="mt-4 flex flex-col items-center">
                    <img src={files[0].url} alt="Product" className="h-32 rounded-lg object-cover" />
                  </div>
                )}
              </div>
              <Button type="submit" className="w-full mt-4">Post Product</Button>
              {submitSuccess && <div className="text-green-600 mt-2">Product posted successfully!</div>}
            </form>
          </CardContent>
        </Card>
      )}

      {/* File List */}
      {files.length > 0 && (
        <Card className="shadow-soft">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Uploaded Files ({files.length})</CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFiles(files.filter(f => f.status === 'completed'))}
                >
                  Clear Failed
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFiles([])}
                >
                  Clear All
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {files.map((file) => {
                const FileIcon = getFileIcon(file.type);
                
                return (
                  <div key={file.id} className="flex items-center gap-4 p-4 bg-muted/30 rounded-lg">
                    <div className="flex-shrink-0">
                      <FileIcon className="h-8 w-8 text-primary" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium truncate">{file.name}</h4>
                        <div className="flex items-center gap-2">
                          <Badge variant={
                            file.status === 'completed' ? 'default' :
                            file.status === 'error' ? 'destructive' : 'secondary'
                          }>
                            {file.status === 'completed' && <Check className="h-3 w-3 mr-1" />}
                            {file.status === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
                            {file.status}
                          </Badge>
                          
                          {file.status === 'completed' && (
                            <div className="flex gap-1">
                              <Button size="sm" variant="ghost">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button size="sm" variant="ghost">
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                          
                          {file.status === 'error' && (
                            <Button size="sm" variant="ghost" onClick={() => retryUpload(file.id)}>
                              <Upload className="h-4 w-4" />
                            </Button>
                          )}
                          
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFile(file.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{formatFileSize(file.size)}</span>
                        {file.status === 'uploading' && (
                          <span>{Math.round(file.progress)}%</span>
                        )}
                        {file.error && (
                          <span className="text-destructive">{file.error}</span>
                        )}
                      </div>
                      
                      {file.status === 'uploading' && (
                        <Progress value={file.progress} className="mt-2" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

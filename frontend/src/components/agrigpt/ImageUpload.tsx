
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Image, Camera, Upload } from 'lucide-react';

export function ImageUpload() {
  return (
    <Card className="shadow-soft hover:shadow-strong transition-all duration-300">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Image className="h-5 w-5 text-primary" />
          Crop Diagnosis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Upload a photo of your crop or livestock for AI-powered analysis
        </p>
        
        <div className="border-2 border-dashed border-primary/30 rounded-xl p-8 text-center bg-gradient-to-br from-muted/20 to-transparent hover:border-primary/50 transition-all duration-300 group">
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
              <Upload className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium mb-1">
                Drag & drop or click to upload
              </p>
              <p className="text-xs text-muted-foreground">
                PNG, JPG up to 10MB
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <Camera className="h-4 w-4 mr-2" />
            Take Photo
          </Button>
          <Button variant="outline" size="sm" className="flex-1">
            <Upload className="h-4 w-4 mr-2" />
            Upload
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

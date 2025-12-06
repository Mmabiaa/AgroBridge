/**
 * Certificate Issuance Form Component
 * Allows users to issue new blockchain certificates for their products
 */
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useIssueCertificate } from '@/api/hooks/useBlockchain';
import { Loader2, FileCheck, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const certificateSchema = z.object({
  product_id: z.string().min(1, 'Product ID is required'),
  certificate_type: z.enum(['origin', 'quality', 'organic', 'export'], {
    required_error: 'Certificate type is required',
  }),
  farm_name: z.string().optional(),
  harvest_date: z.string().optional(),
  quality_grade: z.string().optional(),
  certifications: z.string().optional(),
  expires_at: z.string().optional(),
  additional_metadata: z.string().optional(),
});

type CertificateFormData = z.infer<typeof certificateSchema>;

interface CertificateIssuanceFormProps {
  onSuccess?: () => void;
  defaultProductId?: string;
}

export default function CertificateIssuanceForm({
  onSuccess,
  defaultProductId,
}: CertificateIssuanceFormProps) {
  const [showPreview, setShowPreview] = useState(false);
  const issueCertificate = useIssueCertificate();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CertificateFormData>({
    resolver: zodResolver(certificateSchema),
    defaultValues: {
      product_id: defaultProductId || '',
    },
  });

  const certificateType = watch('certificate_type');
  const formData = watch();

  const onSubmit = async (data: CertificateFormData) => {
    try {
      // Parse certifications if provided
      const certificationsArray = data.certifications
        ? data.certifications.split(',').map((cert) => cert.trim())
        : [];

      // Parse additional metadata if provided
      let additionalMetadata = {};
      if (data.additional_metadata) {
        try {
          additionalMetadata = JSON.parse(data.additional_metadata);
        } catch (e) {
          // Ignore JSON parse errors
        }
      }

      const payload = {
        product_id: data.product_id,
        certificate_type: data.certificate_type,
        metadata: {
          farm_name: data.farm_name,
          harvest_date: data.harvest_date,
          quality_grade: data.quality_grade,
          certifications: certificationsArray,
          ...additionalMetadata,
        },
        expires_at: data.expires_at,
      };

      await issueCertificate.mutateAsync(payload);
      onSuccess?.();
    } catch (error) {
      // Error handled by mutation
    }
  };

  const getCertificateTypeDescription = (type: string) => {
    switch (type) {
      case 'origin':
        return 'Certifies the origin and authenticity of the product';
      case 'quality':
        return 'Certifies the quality standards and grading';
      case 'organic':
        return 'Certifies organic farming practices and standards';
      case 'export':
        return 'Certifies compliance with export regulations';
      default:
        return '';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileCheck className="h-5 w-5" />
          Issue Blockchain Certificate
        </CardTitle>
        <CardDescription>
          Create a new blockchain-verified certificate for your product
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Product ID */}
          <div className="space-y-2">
            <Label htmlFor="product_id">
              Product ID <span className="text-destructive">*</span>
            </Label>
            <Input
              id="product_id"
              placeholder="Enter product ID"
              {...register('product_id')}
              disabled={!!defaultProductId}
            />
            {errors.product_id && (
              <p className="text-sm text-destructive">{errors.product_id.message}</p>
            )}
          </div>

          {/* Certificate Type */}
          <div className="space-y-2">
            <Label htmlFor="certificate_type">
              Certificate Type <span className="text-destructive">*</span>
            </Label>
            <Select
              onValueChange={(value) =>
                setValue('certificate_type', value as any, { shouldValidate: true })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select certificate type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="origin">Origin Certificate</SelectItem>
                <SelectItem value="quality">Quality Certificate</SelectItem>
                <SelectItem value="organic">Organic Certificate</SelectItem>
                <SelectItem value="export">Export Certificate</SelectItem>
              </SelectContent>
            </Select>
            {certificateType && (
              <p className="text-sm text-muted-foreground">
                {getCertificateTypeDescription(certificateType)}
              </p>
            )}
            {errors.certificate_type && (
              <p className="text-sm text-destructive">{errors.certificate_type.message}</p>
            )}
          </div>

          {/* Product Metadata */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="farm_name">Farm Name</Label>
              <Input id="farm_name" placeholder="Enter farm name" {...register('farm_name')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="harvest_date">Harvest Date</Label>
              <Input id="harvest_date" type="date" {...register('harvest_date')} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="quality_grade">Quality Grade</Label>
              <Input
                id="quality_grade"
                placeholder="e.g., Grade A, Premium"
                {...register('quality_grade')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires_at">Expiry Date</Label>
              <Input id="expires_at" type="date" {...register('expires_at')} />
            </div>
          </div>

          {/* Certifications */}
          <div className="space-y-2">
            <Label htmlFor="certifications">Certifications (comma-separated)</Label>
            <Input
              id="certifications"
              placeholder="e.g., ISO 9001, USDA Organic, Fair Trade"
              {...register('certifications')}
            />
            <p className="text-sm text-muted-foreground">
              Enter multiple certifications separated by commas
            </p>
          </div>

          {/* Additional Metadata (JSON) */}
          <div className="space-y-2">
            <Label htmlFor="additional_metadata">Additional Metadata (JSON)</Label>
            <Textarea
              id="additional_metadata"
              placeholder='{"field": "value"}'
              rows={3}
              {...register('additional_metadata')}
            />
            <p className="text-sm text-muted-foreground">
              Optional: Add custom metadata in JSON format
            </p>
            {errors.additional_metadata && (
              <p className="text-sm text-destructive">{errors.additional_metadata.message}</p>
            )}
          </div>

          {/* Preview Section */}
          {showPreview && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2 mt-2">
                  <p className="font-semibold">Certificate Preview:</p>
                  <div className="text-sm space-y-1">
                    <p>
                      <strong>Product ID:</strong> {formData.product_id || 'Not specified'}
                    </p>
                    <p>
                      <strong>Type:</strong> {formData.certificate_type || 'Not selected'}
                    </p>
                    {formData.farm_name && (
                      <p>
                        <strong>Farm:</strong> {formData.farm_name}
                      </p>
                    )}
                    {formData.harvest_date && (
                      <p>
                        <strong>Harvest Date:</strong> {formData.harvest_date}
                      </p>
                    )}
                    {formData.quality_grade && (
                      <p>
                        <strong>Quality:</strong> {formData.quality_grade}
                      </p>
                    )}
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowPreview(!showPreview)}
              className="flex-1"
            >
              {showPreview ? 'Hide Preview' : 'Show Preview'}
            </Button>
            <Button
              type="submit"
              disabled={issueCertificate.isPending}
              className="flex-1"
            >
              {issueCertificate.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Issuing...
                </>
              ) : (
                <>
                  <FileCheck className="mr-2 h-4 w-4" />
                  Issue Certificate
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

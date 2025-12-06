/**
 * Certificate Viewer Component
 * Displays detailed certificate information with QR code and blockchain details
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useCertificate, useDownloadCertificate } from '@/api/hooks/useBlockchain';
import { Certificate } from '@/api/services/blockchain.service';
import {
  Shield,
  Download,
  Share2,
  ExternalLink,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  FileCheck,
  Calendar,
  MapPin,
  Award,
  Loader2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface CertificateViewerProps {
  certificateId: string;
  certificate?: Certificate;
}

export default function CertificateViewer({ certificateId, certificate: propCertificate }: CertificateViewerProps) {
  const { data: fetchedCertificate, isLoading, isError, error } = useCertificate(certificateId);
  const downloadCertificate = useDownloadCertificate();
  const qrCodeRef = useRef<HTMLCanvasElement>(null);

  const certificate = propCertificate || fetchedCertificate;

  // Generate QR code
  useEffect(() => {
    if (certificate && qrCodeRef.current) {
      const qrValue = certificate.qr_code_url || `${window.location.origin}/certificates/${certificate.id}`;
      QRCode.toCanvas(qrCodeRef.current, qrValue, {
        width: 200,
        margin: 2,
        errorCorrectionLevel: 'H',
      });
    }
  }, [certificate]);

  const handleDownload = async () => {
    try {
      await downloadCertificate.mutateAsync(certificateId);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/certificates/${certificateId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Certificate: ${certificate?.product_name}`,
          text: `View blockchain certificate #${certificate?.certificate_number}`,
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(shareUrl);
      alert('Certificate link copied to clipboard!');
    }
  };

  const getStatusIcon = (status: Certificate['status']) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'issued':
        return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'revoked':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-600" />;
    }
  };

  const getStatusColor = (status: Certificate['status']) => {
    switch (status) {
      case 'verified':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'issued':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'revoked':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load certificate: {error?.message || 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!certificate) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>Certificate not found</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle className="flex items-center gap-2 text-2xl">
                <Shield className="h-6 w-6 text-primary" />
                {certificate.product_name}
              </CardTitle>
              <CardDescription>
                Certificate #{certificate.certificate_number}
              </CardDescription>
            </div>
            <Badge variant="outline" className={`${getStatusColor(certificate.status)} text-base px-3 py-1`}>
              {getStatusIcon(certificate.status)}
              <span className="ml-2 capitalize">{certificate.status}</span>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6">
            {/* QR Code */}
            <div className="flex flex-col items-center space-y-3">
              <div className="bg-white p-4 rounded-lg border-2 border-primary/20">
                <canvas ref={qrCodeRef} />
              </div>
              <p className="text-xs text-muted-foreground text-center">
                Scan to verify certificate
              </p>
            </div>

            {/* Certificate Details */}
            <div className="flex-1 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <FileCheck className="h-4 w-4" />
                    Certificate Type
                  </p>
                  <p className="font-semibold capitalize">{certificate.certificate_type}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Issued Date
                  </p>
                  <p className="font-semibold">
                    {new Date(certificate.issued_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>

                {certificate.expires_at && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Expiry Date
                    </p>
                    <p className="font-semibold">
                      {new Date(certificate.expires_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                )}

                {certificate.metadata.farm_name && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Farm Name
                    </p>
                    <p className="font-semibold">{certificate.metadata.farm_name}</p>
                  </div>
                )}

                {certificate.metadata.harvest_date && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Harvest Date</p>
                    <p className="font-semibold">{certificate.metadata.harvest_date}</p>
                  </div>
                )}

                {certificate.metadata.quality_grade && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <Award className="h-4 w-4" />
                      Quality Grade
                    </p>
                    <p className="font-semibold">{certificate.metadata.quality_grade}</p>
                  </div>
                )}
              </div>

              {/* Certifications */}
              {certificate.metadata.certifications && certificate.metadata.certifications.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">Certifications</p>
                  <div className="flex flex-wrap gap-2">
                    {certificate.metadata.certifications.map((cert, idx) => (
                      <Badge key={idx} variant="secondary">
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator className="my-6" />

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleDownload} disabled={downloadCertificate.isPending}>
              {downloadCertificate.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Downloading...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download PDF
                </>
              )}
            </Button>
            <Button variant="outline" onClick={handleShare}>
              <Share2 className="mr-2 h-4 w-4" />
              Share Certificate
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Blockchain Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Blockchain Verification
          </CardTitle>
          <CardDescription>
            Immutable proof of authenticity stored on the blockchain
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground mb-1">Blockchain Hash</p>
              <div className="bg-muted p-3 rounded-md">
                <p className="font-mono text-sm break-all">{certificate.blockchain_hash}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-muted-foreground mb-1">Transaction ID</p>
              <div className="bg-muted p-3 rounded-md">
                <p className="font-mono text-sm break-all">{certificate.transaction_id}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Blockchain Network</p>
                <p className="font-semibold capitalize">{certificate.blockchain_network}</p>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Created At</p>
                <p className="font-semibold">
                  {new Date(certificate.created_at).toLocaleString()}
                </p>
              </div>
            </div>
          </div>

          <Button variant="outline" className="w-full" asChild>
            <a
              href={`https://etherscan.io/tx/${certificate.transaction_id}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View on Blockchain Explorer
            </a>
          </Button>
        </CardContent>
      </Card>

      {/* Additional Metadata */}
      {Object.keys(certificate.metadata).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Additional Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(certificate.metadata).map(([key, value]) => {
                // Skip already displayed fields
                if (['farm_name', 'harvest_date', 'quality_grade', 'certifications'].includes(key)) {
                  return null;
                }
                return (
                  <div key={key} className="space-y-1">
                    <p className="text-sm text-muted-foreground capitalize">
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p className="font-medium">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </p>
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

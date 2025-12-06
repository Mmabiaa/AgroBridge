import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  ArrowLeft,
  Award,
  Download,
  Calendar,
  CheckCircle,
  AlertCircle,
  Loader2,
  QrCode,
  Search,
} from 'lucide-react';
import { useCertificates, useDownloadCertificate, useVerifyCertificate } from '@/api/hooks/useLearning';
import { toast } from 'sonner';
import QRCode from 'qrcode';

export default function Certificates() {
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);
  const [verifying, setVerifying] = useState(false);

  // Fetch user certificates
  const { data: certificates, isLoading, isError } = useCertificates();

  // Download mutation
  const downloadMutation = useDownloadCertificate();

  // Verify mutation
  const verifyMutation = useVerifyCertificate();

  // Handle download certificate
  const handleDownload = async (certificateId: string, courseTitle: string) => {
    try {
      await downloadMutation.mutateAsync(certificateId);
      toast.success('Certificate downloaded', {
        description: `${courseTitle} certificate has been downloaded.`,
      });
    } catch (error: any) {
      toast.error('Download failed', {
        description: error?.message || 'Please try again later.',
      });
    }
  };

  // Handle verify certificate
  const handleVerify = async () => {
    if (!verificationCode.trim()) {
      toast.error('Verification code required', {
        description: 'Please enter a verification code.',
      });
      return;
    }

    setVerifying(true);
    setVerificationResult(null);

    try {
      const result = await verifyMutation.mutateAsync(verificationCode);
      setVerificationResult(result);

      if (result.valid) {
        toast.success('Certificate verified', {
          description: 'This certificate is authentic.',
        });
      } else {
        toast.error('Certificate not found', {
          description: result.message || 'Invalid verification code.',
        });
      }
    } catch (error: any) {
      toast.error('Verification failed', {
        description: error?.message || 'Please try again later.',
      });
      setVerificationResult({ valid: false, message: 'Verification failed' });
    } finally {
      setVerifying(false);
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-4 md:py-8">
      <div className="container mx-auto max-w-6xl space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Link to="/learning">
              <Button variant="ghost" size="sm" className="mb-2">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Learning
              </Button>
            </Link>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-3">
              <Award className="h-8 w-8 text-primary" />
              My Certificates
            </h1>
            <p className="text-muted-foreground mt-1">
              View and download your earned certificates
            </p>
          </div>

          {/* Verify Certificate Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Search className="h-4 w-4 mr-2" />
                Verify Certificate
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Verify Certificate</DialogTitle>
                <DialogDescription>
                  Enter a verification code to check if a certificate is authentic.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="verification-code">Verification Code</Label>
                  <Input
                    id="verification-code"
                    placeholder="Enter verification code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                  />
                </div>

                <Button
                  onClick={handleVerify}
                  disabled={verifying || !verificationCode.trim()}
                  className="w-full"
                >
                  {verifying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Verify Certificate'
                  )}
                </Button>

                {/* Verification Result */}
                {verificationResult && (
                  <Alert variant={verificationResult.valid ? 'default' : 'destructive'}>
                    {verificationResult.valid ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <AlertCircle className="h-4 w-4" />
                    )}
                    <AlertDescription>
                      {verificationResult.valid ? (
                        <div>
                          <p className="font-semibold">Certificate is authentic!</p>
                          {verificationResult.certificate && (
                            <div className="mt-2 text-sm">
                              <p>Course: {verificationResult.certificate.course_title}</p>
                              <p>Issued: {formatDate(verificationResult.certificate.issued_at)}</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p>{verificationResult.message || 'Certificate not found'}</p>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="shadow-soft">
                <CardHeader>
                  <Skeleton className="h-6 w-3/4 mb-2" />
                  <Skeleton className="h-4 w-1/2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-32 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Failed to load certificates. Please try again later.
            </AlertDescription>
          </Alert>
        )}

        {/* Empty State */}
        {!isLoading && !isError && certificates && certificates.length === 0 && (
          <Card className="shadow-soft">
            <CardContent className="p-12 text-center">
              <Award className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">No certificates yet</h3>
              <p className="text-muted-foreground mb-6">
                Complete courses to earn certificates and showcase your achievements.
              </p>
              <Link to="/learning">
                <Button variant="farmer">
                  Browse Courses
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Certificates Grid */}
        {!isLoading && !isError && certificates && certificates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {certificates.map((certificate) => (
              <CertificateCard
                key={certificate.id}
                certificate={certificate}
                onDownload={handleDownload}
                isDownloading={downloadMutation.isPending}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Certificate Card Component
interface CertificateCardProps {
  certificate: any;
  onDownload: (id: string, title: string) => void;
  isDownloading: boolean;
}

function CertificateCard({ certificate, onDownload, isDownloading }: CertificateCardProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [showQR, setShowQR] = useState(false);

  // Generate QR code
  useEffect(() => {
    if (showQR && certificate.verification_code) {
      QRCode.toDataURL(certificate.verification_code, {
        width: 200,
        margin: 2,
      })
        .then(setQrCodeUrl)
        .catch(console.error);
    }
  }, [showQR, certificate.verification_code]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <Card className="shadow-soft hover:shadow-strong transition-all duration-300">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">{certificate.course_title}</CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <Calendar className="h-3 w-3" />
              Issued on {formatDate(certificate.issued_at)}
            </CardDescription>
          </div>
          <Badge className="bg-green-500 flex-shrink-0">
            <CheckCircle className="h-3 w-3 mr-1" />
            Earned
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Certificate Preview */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-primary/10 to-accent/10 rounded-lg border-2 border-primary/20 p-6 flex flex-col items-center justify-center text-center">
          <Award className="h-12 w-12 text-primary mb-3" />
          <h3 className="font-serif text-xl font-bold mb-2">Certificate of Completion</h3>
          <p className="text-sm text-muted-foreground mb-1">This certifies that</p>
          <p className="font-semibold mb-1">You</p>
          <p className="text-sm text-muted-foreground mb-1">have successfully completed</p>
          <p className="font-semibold text-sm line-clamp-2">{certificate.course_title}</p>
        </div>

        {/* Verification Code */}
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground mb-1">Verification Code</p>
          <p className="font-mono text-sm font-semibold">{certificate.verification_code}</p>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="farmer"
            className="flex-1"
            onClick={() => onDownload(certificate.id, certificate.course_title)}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Downloading...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Download
              </>
            )}
          </Button>

          <Dialog open={showQR} onOpenChange={setShowQR}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <QrCode className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Certificate QR Code</DialogTitle>
                <DialogDescription>
                  Scan this QR code to verify the certificate
                </DialogDescription>
              </DialogHeader>
              <div className="flex flex-col items-center space-y-4">
                {qrCodeUrl && (
                  <img src={qrCodeUrl} alt="QR Code" className="w-48 h-48" />
                )}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">Verification Code</p>
                  <p className="font-mono text-sm font-semibold">{certificate.verification_code}</p>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
}

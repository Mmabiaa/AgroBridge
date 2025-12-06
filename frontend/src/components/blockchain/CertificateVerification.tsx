/**
 * Certificate Verification Component
 * Allows users to verify certificate authenticity using certificate number, hash, or QR code
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useVerifyCertificate } from '@/api/hooks/useBlockchain';
import {
  Shield,
  CheckCircle,
  XCircle,
  Loader2,
  QrCode,
  Hash,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import CertificateViewer from './CertificateViewer';

export default function CertificateVerification() {
  const [verificationMethod, setVerificationMethod] = useState<'number' | 'hash' | 'qr'>('number');
  const [certificateNumber, setCertificateNumber] = useState('');
  const [blockchainHash, setBlockchainHash] = useState('');
  const [qrCodeData, setQrCodeData] = useState('');
  const [verificationResult, setVerificationResult] = useState<any>(null);

  const verifyCertificate = useVerifyCertificate();

  const handleVerify = async () => {
    setVerificationResult(null);

    const data: any = {};
    if (verificationMethod === 'number') {
      data.certificate_number = certificateNumber;
    } else if (verificationMethod === 'hash') {
      data.blockchain_hash = blockchainHash;
    } else if (verificationMethod === 'qr') {
      data.qr_code_data = qrCodeData;
    }

    try {
      const result = await verifyCertificate.mutateAsync(data);
      setVerificationResult(result);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleQRScan = () => {
    // In a real implementation, this would open the device camera
    // For now, we'll just show an alert
    alert('QR Scanner would open here. This requires camera permissions and a QR scanning library.');
  };

  const resetVerification = () => {
    setVerificationResult(null);
    setCertificateNumber('');
    setBlockchainHash('');
    setQrCodeData('');
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Verify Certificate Authenticity
          </CardTitle>
          <CardDescription>
            Verify the authenticity of a blockchain certificate using different methods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={verificationMethod} onValueChange={(v) => setVerificationMethod(v as any)}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="number">
                <FileText className="h-4 w-4 mr-2" />
                Certificate Number
              </TabsTrigger>
              <TabsTrigger value="hash">
                <Hash className="h-4 w-4 mr-2" />
                Blockchain Hash
              </TabsTrigger>
              <TabsTrigger value="qr">
                <QrCode className="h-4 w-4 mr-2" />
                QR Code
              </TabsTrigger>
            </TabsList>

            <TabsContent value="number" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="certificate-number">Certificate Number</Label>
                <Input
                  id="certificate-number"
                  placeholder="e.g., CERT-2024-001"
                  value={certificateNumber}
                  onChange={(e) => setCertificateNumber(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Enter the certificate number found on the certificate document
                </p>
              </div>
            </TabsContent>

            <TabsContent value="hash" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="blockchain-hash">Blockchain Hash</Label>
                <Input
                  id="blockchain-hash"
                  placeholder="e.g., 0x1a2b3c4d..."
                  value={blockchainHash}
                  onChange={(e) => setBlockchainHash(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Enter the blockchain transaction hash
                </p>
              </div>
            </TabsContent>

            <TabsContent value="qr" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="qr-data">QR Code Data</Label>
                  <Input
                    id="qr-data"
                    placeholder="Paste QR code data or scan below"
                    value={qrCodeData}
                    onChange={(e) => setQrCodeData(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleQRScan}
                  className="w-full"
                >
                  <QrCode className="mr-2 h-4 w-4" />
                  Scan QR Code with Camera
                </Button>
                <p className="text-sm text-muted-foreground">
                  Scan the QR code on the certificate or paste the data manually
                </p>
              </div>
            </TabsContent>
          </Tabs>

          <div className="mt-6 flex gap-3">
            <Button
              onClick={handleVerify}
              disabled={
                verifyCertificate.isPending ||
                (verificationMethod === 'number' && !certificateNumber) ||
                (verificationMethod === 'hash' && !blockchainHash) ||
                (verificationMethod === 'qr' && !qrCodeData)
              }
              className="flex-1"
            >
              {verifyCertificate.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                <>
                  <Shield className="mr-2 h-4 w-4" />
                  Verify Certificate
                </>
              )}
            </Button>
            {verificationResult && (
              <Button variant="outline" onClick={resetVerification}>
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Verification Result */}
      {verificationResult && (
        <div className="space-y-6">
          {verificationResult.valid ? (
            <Alert className="border-green-200 bg-green-50">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <AlertTitle className="text-green-900">Certificate Verified ✓</AlertTitle>
              <AlertDescription className="text-green-800">
                {verificationResult.message}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="destructive">
              <XCircle className="h-5 w-5" />
              <AlertTitle>Verification Failed</AlertTitle>
              <AlertDescription>{verificationResult.message}</AlertDescription>
            </Alert>
          )}

          {/* Blockchain Verification Status */}
          {verificationResult.blockchain_verified !== undefined && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Blockchain Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-3">
                  {verificationResult.blockchain_verified ? (
                    <>
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      <div>
                        <p className="font-semibold text-green-900">
                          Blockchain Verified
                        </p>
                        <p className="text-sm text-muted-foreground">
                          This certificate is recorded on the blockchain and has not been tampered with
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-6 w-6 text-yellow-600" />
                      <div>
                        <p className="font-semibold text-yellow-900">
                          Blockchain Verification Pending
                        </p>
                        <p className="text-sm text-muted-foreground">
                          The blockchain transaction is still being confirmed
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Certificate Details */}
          {verificationResult.certificate && (
            <div>
              <h3 className="text-lg font-semibold mb-4">Certificate Details</h3>
              <CertificateViewer
                certificateId={verificationResult.certificate.id}
                certificate={verificationResult.certificate}
              />
            </div>
          )}
        </div>
      )}

      {/* Information Card */}
      {!verificationResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">How Verification Works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex gap-3">
              <Shield className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground mb-1">Blockchain Security</p>
                <p>
                  All certificates are stored on the blockchain, making them immutable and
                  tamper-proof.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground mb-1">Instant Verification</p>
                <p>
                  Verify certificates in seconds using the certificate number, blockchain hash, or
                  QR code.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <FileText className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground mb-1">Complete Transparency</p>
                <p>
                  View all certificate details including product information, issuer, and blockchain
                  transaction.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

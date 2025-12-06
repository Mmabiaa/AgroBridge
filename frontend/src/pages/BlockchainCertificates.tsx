import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  Shield, 
  Award, 
  FileCheck, 
  Truck, 
  Plus,
  Eye,
  CheckCircle2,
} from 'lucide-react';
import {
  CertificateIssuanceForm,
  CertificatesList,
  CertificateViewer,
  CertificateVerification,
  SupplyChainTracker,
} from '@/components/blockchain';
import { useStatistics, useDownloadCertificate } from '@/api/hooks/useBlockchain';
import { Certificate } from '@/api/services/blockchain.service';
import { Skeleton } from '@/components/ui/skeleton';

export default function BlockchainCertificates() {
  const [activeTab, setActiveTab] = useState('certificates');
  const [showIssuanceForm, setShowIssuanceForm] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState<Certificate | null>(null);
  const [showCertificateViewer, setShowCertificateViewer] = useState(false);
  const [supplyChainProductId, setSupplyChainProductId] = useState<string>('');

  const { data: statistics, isLoading: statsLoading } = useStatistics();
  const downloadCertificate = useDownloadCertificate();

  const handleViewCertificate = (certificate: Certificate) => {
    setSelectedCertificate(certificate);
    setShowCertificateViewer(true);
  };

  const handleDownloadCertificate = async (certificateId: string) => {
    try {
      await downloadCertificate.mutateAsync(certificateId);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleIssuanceSuccess = () => {
    setShowIssuanceForm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-8 px-4">
      <div className="container mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold flex items-center gap-3">
              <Shield className="h-8 w-8 text-primary" />
              Blockchain Certificates
            </h1>
            <p className="text-muted-foreground text-lg mt-2">
              Secure, transparent, and immutable certifications powered by blockchain
            </p>
          </div>
          <Button onClick={() => setShowIssuanceForm(true)} size="lg">
            <Plus className="h-5 w-5 mr-2" />
            Issue Certificate
          </Button>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <Award className="h-8 w-8 text-primary mx-auto mb-2" />
              {statsLoading ? (
                <Skeleton className="h-8 w-16 mx-auto" />
              ) : (
                <div className="text-2xl font-bold">{statistics?.total_certificates || 0}</div>
              )}
              <p className="text-sm text-muted-foreground">Total Certificates</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-500 mx-auto mb-2" />
              {statsLoading ? (
                <Skeleton className="h-8 w-16 mx-auto" />
              ) : (
                <div className="text-2xl font-bold">{statistics?.verified_certificates || 0}</div>
              )}
              <p className="text-sm text-muted-foreground">Verified</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <FileCheck className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              {statsLoading ? (
                <Skeleton className="h-8 w-16 mx-auto" />
              ) : (
                <div className="text-2xl font-bold">{statistics?.issued_certificates || 0}</div>
              )}
              <p className="text-sm text-muted-foreground">Issued</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6 text-center">
              <Shield className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">100%</div>
              <p className="text-sm text-muted-foreground">Blockchain Verified</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="certificates">
              <Award className="h-4 w-4 mr-2" />
              My Certificates
            </TabsTrigger>
            <TabsTrigger value="verify">
              <Shield className="h-4 w-4 mr-2" />
              Verify Certificate
            </TabsTrigger>
            <TabsTrigger value="supply-chain">
              <Truck className="h-4 w-4 mr-2" />
              Supply Chain
            </TabsTrigger>
          </TabsList>

          <TabsContent value="certificates" className="mt-6">
            <CertificatesList
              onViewCertificate={handleViewCertificate}
              onDownloadCertificate={handleDownloadCertificate}
            />
          </TabsContent>

          <TabsContent value="verify" className="mt-6">
            <CertificateVerification />
          </TabsContent>

          <TabsContent value="supply-chain" className="mt-6">
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Track Product Supply Chain</CardTitle>
                <CardDescription>
                  Enter a product ID to view its complete supply chain journey
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-3">
                  <input
                    type="text"
                    placeholder="Enter product ID..."
                    value={supplyChainProductId}
                    onChange={(e) => setSupplyChainProductId(e.target.value)}
                    className="flex-1 px-4 py-2 border rounded-md"
                  />
                  <Button disabled={!supplyChainProductId}>
                    <Eye className="h-4 w-4 mr-2" />
                    Track
                  </Button>
                </div>
              </CardContent>
            </Card>

            {supplyChainProductId && (
              <SupplyChainTracker productId={supplyChainProductId} />
            )}
          </TabsContent>
        </Tabs>

        {/* Certificate Issuance Dialog */}
        <Dialog open={showIssuanceForm} onOpenChange={setShowIssuanceForm}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Issue New Certificate</DialogTitle>
              <DialogDescription>
                Create a new blockchain-verified certificate for your product
              </DialogDescription>
            </DialogHeader>
            <CertificateIssuanceForm onSuccess={handleIssuanceSuccess} />
          </DialogContent>
        </Dialog>

        {/* Certificate Viewer Dialog */}
        <Dialog open={showCertificateViewer} onOpenChange={setShowCertificateViewer}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Certificate Details</DialogTitle>
              <DialogDescription>
                View complete certificate information and blockchain verification
              </DialogDescription>
            </DialogHeader>
            {selectedCertificate && (
              <CertificateViewer
                certificateId={selectedCertificate.id}
                certificate={selectedCertificate}
              />
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}


import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  Award, 
  FileCheck, 
  Truck, 
  Leaf, 
  QrCode,
  Download,
  Share,
  Eye,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

const certificates = [
  {
    id: 'CERT-2024-001',
    title: 'Organic Farming Certificate',
    status: 'verified',
    issueDate: '2024-01-15',
    expiryDate: '2025-01-15',
    blockchainHash: '0x1a2b3c4d...ef56',
    cropType: 'Tomatoes',
    fieldArea: '5.2 hectares',
    verificationLevel: 'Premium',
    carbonCredits: 12.5
  },
  {
    id: 'CERT-2024-002',
    title: 'Sustainable Agriculture Badge',
    status: 'pending',
    issueDate: '2024-07-10',
    expiryDate: '2025-07-10',
    blockchainHash: 'Pending...',
    cropType: 'Maize',
    fieldArea: '8.1 hectares',
    verificationLevel: 'Standard',
    carbonCredits: 18.7
  },
  {
    id: 'CERT-2024-003',
    title: 'Fair Trade Certification',
    status: 'verified',
    issueDate: '2024-03-20',
    expiryDate: '2025-03-20',
    blockchainHash: '0x9f8e7d6c...ba21',
    cropType: 'Coffee Beans',
    fieldArea: '3.5 hectares',
    verificationLevel: 'Premium',
    carbonCredits: 8.2
  }
];

const supplyChainData = [
  { stage: 'Farm Origin', location: 'Northern Region Farm #42', timestamp: '2024-07-15 08:00', verified: true },
  { stage: 'Quality Inspection', location: 'Regional Testing Center', timestamp: '2024-07-15 14:30', verified: true },
  { stage: 'Processing', location: 'AgriProcess Ltd.', timestamp: '2024-07-16 10:15', verified: true },
  { stage: 'Distribution Hub', location: 'Central Warehouse', timestamp: '2024-07-17 09:45', verified: false },
  { stage: 'Retail Delivery', location: 'Pending', timestamp: 'Pending', verified: false }
];

export default function BlockchainCertificates() {
  const [selectedCert, setSelectedCert] = useState(certificates[0]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'verified': return 'text-green-600 bg-green-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'expired': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'expired': return <AlertCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-8 px-4">
      <div className="container mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <Shield className="h-8 w-8 text-primary" />
            Blockchain Farm Certificates
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Secure, transparent, and immutable farming certifications powered by blockchain technology
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-6 text-center">
              <Award className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">12</div>
              <p className="text-sm text-muted-foreground">Active Certificates</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-6 text-center">
              <Leaf className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">39.2</div>
              <p className="text-sm text-muted-foreground">Carbon Credits</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-6 text-center">
              <Truck className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">156</div>
              <p className="text-sm text-muted-foreground">Supply Chain Records</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-6 text-center">
              <Shield className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">100%</div>
              <p className="text-sm text-muted-foreground">Blockchain Verified</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Certificates List */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Your Blockchain Certificates</CardTitle>
                <CardDescription>Verified farming credentials stored on the blockchain</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {certificates.map((cert) => (
                  <div 
                    key={cert.id} 
                    className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                      selectedCert.id === cert.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                    }`}
                    onClick={() => setSelectedCert(cert)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-semibold text-sm md:text-base">{cert.title}</h3>
                        <p className="text-xs text-muted-foreground">ID: {cert.id}</p>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(cert.status)}`}>
                        {getStatusIcon(cert.status)}
                        <span className="capitalize">{cert.status}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs mb-3">
                      <div>
                        <p className="text-muted-foreground">Crop Type</p>
                        <p className="font-medium">{cert.cropType}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Field Area</p>
                        <p className="font-medium">{cert.fieldArea}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Carbon Credits</p>
                        <p className="font-medium text-green-600">{cert.carbonCredits} tons</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs">
                        <span className="text-muted-foreground">Expires: </span>
                        <span className="font-medium">{cert.expiryDate}</span>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">
                          <QrCode className="h-3 w-3 mr-1" />
                          QR
                        </Button>
                        <Button variant="outline" size="sm">
                          <Download className="h-3 w-3 mr-1" />
                          Export
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Supply Chain Tracking */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Truck className="h-5 w-5" />
                  Supply Chain Transparency
                </CardTitle>
                <CardDescription>Track your produce from farm to consumer</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {supplyChainData.map((stage, idx) => (
                    <div key={idx} className="flex items-center gap-4">
                      <div className={`w-4 h-4 rounded-full flex-shrink-0 ${
                        stage.verified ? 'bg-green-500' : 'bg-gray-300'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">{stage.stage}</h4>
                          {stage.verified && <CheckCircle className="h-4 w-4 text-green-500" />}
                        </div>
                        <p className="text-xs text-muted-foreground">{stage.location}</p>
                        <p className="text-xs text-muted-foreground">{stage.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Certificate Details */}
          <div className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Certificate Details</CardTitle>
                <CardDescription>Blockchain verification information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Certificate Title</p>
                    <p className="font-medium">{selectedCert.title}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Blockchain Hash</p>
                    <p className="font-mono text-xs break-all bg-muted p-2 rounded">
                      {selectedCert.blockchainHash}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Verification Level</p>
                    <Badge variant="outline">{selectedCert.verificationLevel}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Issue Date</p>
                    <p className="font-medium">{selectedCert.issueDate}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button className="w-full justify-start">
                  <FileCheck className="h-4 w-4 mr-2" />
                  Verify on Blockchain
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Share className="h-4 w-4 mr-2" />
                  Share Certificate
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <QrCode className="h-4 w-4 mr-2" />
                  Generate QR Code
                </Button>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Carbon Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-green-600">
                    {selectedCert.carbonCredits} tons
                  </div>
                  <p className="text-sm text-muted-foreground">CO₂ Offset This Year</p>
                  <Progress value={75} className="h-2" />
                  <p className="text-xs text-muted-foreground">75% of annual target</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

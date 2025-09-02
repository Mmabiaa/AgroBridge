
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  Download, 
  CheckCircle, 
  Clock, 
  Globe, 
  Truck, 
  Shield,
  Award,
  Printer,
  Share,
  QrCode,
  Calendar,
  AlertTriangle
} from 'lucide-react';

const exportDocuments = [
  {
    id: 'EXP-2024-001',
    type: 'Phytosanitary Certificate',
    crop: 'Organic Tomatoes',
    destination: 'European Union',
    quantity: '2,500 kg',
    status: 'approved',
    issueDate: '2024-07-10',
    expiryDate: '2024-08-10',
    authority: 'NAQS Nigeria',
    referenceNo: 'PHY-NG-2024-001',
    documentUrl: '/docs/phyto-cert-001.pdf'
  },
  {
    id: 'EXP-2024-002',
    type: 'Certificate of Origin',
    crop: 'Cocoa Beans',
    destination: 'United States',
    quantity: '5,000 kg',
    status: 'processing',
    issueDate: '2024-07-12',
    expiryDate: '2024-08-12',
    authority: 'NAFDAC',
    referenceNo: 'COO-NG-2024-002',
    documentUrl: null
  },
  {
    id: 'EXP-2024-003',
    type: 'Quality Assurance Report',
    crop: 'Sesame Seeds',
    destination: 'Japan',
    quantity: '1,800 kg',
    status: 'pending',
    issueDate: '2024-07-14',
    expiryDate: '2024-09-14',
    authority: 'SON Nigeria',
    referenceNo: 'QAR-NG-2024-003',
    documentUrl: null
  },
  {
    id: 'EXP-2024-004',
    type: 'Organic Certification',
    crop: 'Ginger',
    destination: 'Canada',
    quantity: '3,200 kg',
    status: 'approved',
    issueDate: '2024-06-28',
    expiryDate: '2025-06-28',
    authority: 'Organic Certification Body',
    referenceNo: 'ORG-NG-2024-004',
    documentUrl: '/docs/organic-cert-004.pdf'
  }
];

const documentTemplates = [
  {
    name: 'Phytosanitary Certificate',
    description: 'Plant health certification for international trade',
    authority: 'NAQS',
    requiredFields: ['Crop type', 'Quantity', 'Origin', 'Destination', 'Treatment records'],
    processingTime: '5-7 days',
    fee: '₦25,000'
  },
  {
    name: 'Certificate of Origin',
    description: 'Document certifying the country of origin',
    authority: 'NAFDAC',
    requiredFields: ['Product details', 'Manufacturer info', 'Country of origin'],
    processingTime: '3-5 days',
    fee: '₦15,000'
  },
  {
    name: 'Quality Report',
    description: 'Laboratory analysis and quality assurance',
    authority: 'SON',
    requiredFields: ['Sample analysis', 'Quality parameters', 'Test results'],
    processingTime: '7-10 days',
    fee: '₦35,000'
  },
  {
    name: 'Organic Certificate',
    description: 'Certification for organic farming practices',
    authority: 'Organic Body',
    requiredFields: ['Farm inspection', 'Organic practices', 'Compliance records'],
    processingTime: '14-21 days',
    fee: '₦50,000'
  }
];

const exportDestinations = [
  { country: 'European Union', flag: '🇪🇺', requirements: 4, activeExports: 12 },
  { country: 'United States', flag: '🇺🇸', requirements: 3, activeExports: 8 },
  { country: 'United Kingdom', flag: '🇬🇧', requirements: 3, activeExports: 6 },
  { country: 'Japan', flag: '🇯🇵', requirements: 5, activeExports: 4 },
  { country: 'Canada', flag: '🇨🇦', requirements: 3, activeExports: 3 },
  { country: 'Australia', flag: '🇦🇺', requirements: 4, activeExports: 2 }
];

const complianceChecklist = [
  { item: 'Farm registration with NAQS', completed: true, required: true },
  { item: 'Organic certification valid', completed: true, required: false },
  { item: 'Pesticide residue testing', completed: false, required: true },
  { item: 'Quality assurance documentation', completed: true, required: true },
  { item: 'Traceability records updated', completed: false, required: true },
  { item: 'Export license renewal', completed: true, required: true }
];

export default function ExportDocumentation() {
  const [activeTab, setActiveTab] = useState('documents');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'text-green-600 bg-green-50';
      case 'processing': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-yellow-600 bg-yellow-50';
      case 'rejected': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'processing': return <Clock className="h-4 w-4" />;
      case 'pending': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-8 px-4">
      <div className="container mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <Globe className="h-8 w-8 text-primary" />
            Export Documentation System
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Automated generation and management of international trade certificates and documentation
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="shadow-soft">
            <CardContent className="p-6 text-center">
              <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
              <div className="text-2xl font-bold">47</div>
              <p className="text-sm text-muted-foreground">Total Documents</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-6 text-center">
              <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">35</div>
              <p className="text-sm text-muted-foreground">Approved Exports</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-6 text-center">
              <Truck className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">6</div>
              <p className="text-sm text-muted-foreground">Active Shipments</p>
            </CardContent>
          </Card>
          <Card className="shadow-soft">
            <CardContent className="p-6 text-center">
              <Globe className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">12</div>
              <p className="text-sm text-muted-foreground">Export Countries</p>
            </CardContent>
          </Card>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b">
          {['documents', 'templates', 'destinations', 'compliance'].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "ghost"}
              onClick={() => setActiveTab(tab)}
              className="capitalize"
            >
              {tab}
            </Button>
          ))}
        </div>

        {/* Export Documents */}
        {activeTab === 'documents' && (
          <div className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Export Documents</CardTitle>
                    <CardDescription>Manage your international trade documentation</CardDescription>
                  </div>
                  <Button>
                    <FileText className="h-4 w-4 mr-2" />
                    New Document
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {exportDocuments.map((doc) => (
                  <div key={doc.id} className="border rounded-lg p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-sm md:text-base">{doc.type}</h3>
                        <p className="text-xs text-muted-foreground">
                          {doc.crop} • {doc.quantity} to {doc.destination}
                        </p>
                      </div>
                      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(doc.status)}`}>
                        {getStatusIcon(doc.status)}
                        <span className="capitalize">{doc.status}</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                      <div>
                        <p className="text-muted-foreground">Reference No.</p>
                        <p className="font-medium">{doc.referenceNo}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Authority</p>
                        <p className="font-medium">{doc.authority}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Issue Date</p>
                        <p className="font-medium">{doc.issueDate}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Expiry Date</p>
                        <p className="font-medium">{doc.expiryDate}</p>
                      </div>
                    </div>
                    
                    <div className="flex gap-2 flex-wrap">
                      {doc.documentUrl && (
                        <>
                          <Button size="sm" variant="outline">
                            <Download className="h-3 w-3 mr-1" />
                            Download
                          </Button>
                          <Button size="sm" variant="outline">
                            <Printer className="h-3 w-3 mr-1" />
                            Print
                          </Button>
                        </>
                      )}
                      <Button size="sm" variant="outline">
                        <Share className="h-3 w-3 mr-1" />
                        Share
                      </Button>
                      <Button size="sm" variant="outline">
                        <QrCode className="h-3 w-3 mr-1" />
                        QR Code
                      </Button>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Document Templates */}
        {activeTab === 'templates' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {documentTemplates.map((template, idx) => (
              <Card key={idx} className="shadow-soft">
                <CardHeader>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Authority</p>
                      <p className="font-medium">{template.authority}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Processing Time</p>
                      <p className="font-medium">{template.processingTime}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Fee</p>
                      <p className="font-medium text-primary">{template.fee}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Required Fields</p>
                      <p className="font-medium">{template.requiredFields.length} items</p>
                    </div>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium mb-2">Required Information:</p>
                    <div className="space-y-1">
                      {template.requiredFields.map((field, fieldIdx) => (
                        <div key={fieldIdx} className="flex items-center gap-2 text-xs">
                          <CheckCircle className="h-3 w-3 text-green-500" />
                          <span>{field}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Button className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Document
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Export Destinations */}
        {activeTab === 'destinations' && (
          <div className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Export Destinations</CardTitle>
                <CardDescription>Markets and their specific requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {exportDestinations.map((destination, idx) => (
                    <div key={idx} className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-2xl">{destination.flag}</span>
                        <div>
                          <h3 className="font-semibold">{destination.country}</h3>
                          <p className="text-sm text-muted-foreground">
                            {destination.activeExports} active exports
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Required Documents</span>
                          <span className="font-medium">{destination.requirements}</span>
                        </div>
                        <Progress value={(destination.activeExports / 15) * 100} className="h-2" />
                      </div>
                      
                      <Button size="sm" variant="outline" className="w-full mt-3">
                        View Requirements
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Compliance Checklist */}
        {activeTab === 'compliance' && (
          <div className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  Export Compliance Checklist
                </CardTitle>
                <CardDescription>Ensure all requirements are met for international trade</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {complianceChecklist.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${
                        item.completed ? 'bg-green-500 text-white' : 'bg-gray-300'
                      }`}>
                        {item.completed && <CheckCircle className="h-3 w-3" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{item.item}</p>
                        {item.required && (
                          <Badge variant="destructive" className="text-xs mt-1">Required</Badge>
                        )}
                      </div>
                    </div>
                    {!item.completed && (
                      <Button size="sm" variant="outline">
                        Complete
                      </Button>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Compliance Score</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">83%</div>
                  <p className="text-muted-foreground mb-4">Export Ready Score</p>
                  <Progress value={83} className="h-3 mb-4" />
                  <p className="text-sm text-muted-foreground">
                    Complete 2 more items to reach 100% compliance
                  </p>
                </CardContent>
              </Card>

              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Inspection
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Award className="h-4 w-4 mr-2" />
                    Renew Certifications
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Update Documentation
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Download className="h-4 w-4 mr-2" />
                    Export Report
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

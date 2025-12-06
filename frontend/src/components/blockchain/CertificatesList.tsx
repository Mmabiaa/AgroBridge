/**
 * Certificates List Component
 * Displays user's blockchain certificates with filtering and search
 */
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCertificates } from '@/api/hooks/useBlockchain';
import { Certificate } from '@/api/services/blockchain.service';
import {
  Shield,
  Search,
  Filter,
  Eye,
  Download,
  QrCode,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface CertificatesListProps {
  onViewCertificate?: (certificate: Certificate) => void;
  onDownloadCertificate?: (certificateId: string) => void;
}

export default function CertificatesList({
  onViewCertificate,
  onDownloadCertificate,
}: CertificatesListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const { data, isLoading, isError, error } = useCertificates({
    page: currentPage,
    page_size: 10,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    certificate_type: typeFilter !== 'all' ? typeFilter : undefined,
  });

  const getStatusIcon = (status: Certificate['status']) => {
    switch (status) {
      case 'verified':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'issued':
        return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'revoked':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />;
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

  const getCertificateTypeLabel = (type: Certificate['certificate_type']) => {
    switch (type) {
      case 'origin':
        return 'Origin';
      case 'quality':
        return 'Quality';
      case 'organic':
        return 'Organic';
      case 'export':
        return 'Export';
      default:
        return type;
    }
  };

  const filteredCertificates = data?.results.filter((cert) =>
    searchQuery
      ? cert.product_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cert.certificate_number.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load certificates: {error?.message || 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Your Blockchain Certificates
          </CardTitle>
          <CardDescription>
            Manage and view your blockchain-verified certificates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by product name or certificate number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="issued">Issued</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="revoked">Revoked</SelectItem>
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="origin">Origin</SelectItem>
                <SelectItem value="quality">Quality</SelectItem>
                <SelectItem value="organic">Organic</SelectItem>
                <SelectItem value="export">Export</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Certificates List */}
      {filteredCertificates && filteredCertificates.length > 0 ? (
        <div className="space-y-4">
          {filteredCertificates.map((certificate) => (
            <Card key={certificate.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  {/* Certificate Info */}
                  <div className="flex-1 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-lg">{certificate.product_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Certificate #{certificate.certificate_number}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant="outline" className={getStatusColor(certificate.status)}>
                          {getStatusIcon(certificate.status)}
                          <span className="ml-1 capitalize">{certificate.status}</span>
                        </Badge>
                        <Badge variant="secondary">
                          {getCertificateTypeLabel(certificate.certificate_type)}
                        </Badge>
                      </div>
                    </div>

                    {/* Metadata */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      {certificate.metadata.farm_name && (
                        <div>
                          <p className="text-muted-foreground">Farm</p>
                          <p className="font-medium">{certificate.metadata.farm_name}</p>
                        </div>
                      )}
                      {certificate.metadata.harvest_date && (
                        <div>
                          <p className="text-muted-foreground">Harvest Date</p>
                          <p className="font-medium">{certificate.metadata.harvest_date}</p>
                        </div>
                      )}
                      {certificate.metadata.quality_grade && (
                        <div>
                          <p className="text-muted-foreground">Quality</p>
                          <p className="font-medium">{certificate.metadata.quality_grade}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground">Issued</p>
                        <p className="font-medium">
                          {new Date(certificate.issued_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* Blockchain Hash */}
                    <div className="bg-muted p-3 rounded-md">
                      <p className="text-xs text-muted-foreground mb-1">Blockchain Hash</p>
                      <p className="font-mono text-xs break-all">{certificate.blockchain_hash}</p>
                    </div>

                    {/* Certifications */}
                    {certificate.metadata.certifications &&
                      certificate.metadata.certifications.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {certificate.metadata.certifications.map((cert, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">
                              {cert}
                            </Badge>
                          ))}
                        </div>
                      )}
                  </div>

                  {/* Actions */}
                  <div className="flex md:flex-col gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewCertificate?.(certificate)}
                      className="flex-1 md:flex-none"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDownloadCertificate?.(certificate.id)}
                      className="flex-1 md:flex-none"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      PDF
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewCertificate?.(certificate)}
                      className="flex-1 md:flex-none"
                    >
                      <QrCode className="h-4 w-4 mr-2" />
                      QR
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No certificates found</h3>
            <p className="text-muted-foreground">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Issue your first blockchain certificate to get started'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Pagination */}
      {data && data.count > 10 && (
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={!data.previous}
          >
            Previous
          </Button>
          <div className="flex items-center px-4">
            Page {currentPage} of {Math.ceil(data.count / 10)}
          </div>
          <Button
            variant="outline"
            onClick={() => setCurrentPage((p) => p + 1)}
            disabled={!data.next}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}

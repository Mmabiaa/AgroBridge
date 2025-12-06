import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Battery, 
  AlertTriangle,
  CheckCircle,
  Radio,
  Plus,
  Activity,
  MapPin,
  Loader2,
  Filter,
  Search
} from 'lucide-react';
import { useDevices } from '@/api/hooks/useIoT';
import { formatDistanceToNow } from 'date-fns';
import type { IoTDevice } from '@/api/services/iot.service';
import DeviceRegistrationForm from '@/components/iot/DeviceRegistrationForm';
import SensorDataChart from '@/components/iot/SensorDataChart';
import AlertsList from '@/components/iot/AlertsList';
import DeviceManagementActions from '@/components/iot/DeviceManagementActions';

export default function IoTSensorNetwork() {
  const [selectedDevice, setSelectedDevice] = useState<IoTDevice | null>(null);
  const [deviceTypeFilter, setDeviceTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [showSensorData, setShowSensorData] = useState(false);
  const [showAlerts, setShowAlerts] = useState(false);

  // Fetch devices from API
  const { data: devicesData, isLoading, isError, error } = useDevices({
    device_type: deviceTypeFilter !== 'all' ? deviceTypeFilter : undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
  });

  const devices = devicesData?.results || [];

  // Filter devices by search query
  const filteredDevices = useMemo(() => {
    if (!searchQuery) return devices;
    const query = searchQuery.toLowerCase();
    return devices.filter(device => 
      device.name.toLowerCase().includes(query) ||
      device.id.toLowerCase().includes(query)
    );
  }, [devices, searchQuery]);

  // Calculate network statistics
  const networkStats = useMemo(() => {
    const totalDevices = devices.length;
    const activeDevices = devices.filter(d => d.status === 'online').length;
    const avgBattery = devices.length > 0
      ? devices.reduce((sum, d) => sum + (d.battery_level || 0), 0) / devices.length
      : 0;
    
    return [
      { label: 'Active Sensors', value: activeDevices, total: totalDevices, unit: 'devices' },
      { label: 'Total Devices', value: totalDevices, total: totalDevices, unit: 'devices' },
      { label: 'Network Uptime', value: 98.7, total: 100, unit: '%' },
      { label: 'Battery Average', value: Math.round(avgBattery), total: 100, unit: '%' }
    ];
  }, [devices]);

  // Set first device as selected when data loads
  useState(() => {
    if (devices.length > 0 && !selectedDevice) {
      setSelectedDevice(devices[0]);
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'text-green-600 bg-green-50';
      case 'error': return 'text-yellow-600 bg-yellow-50';
      case 'offline': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return <CheckCircle className="h-4 w-4" />;
      case 'error': return <AlertTriangle className="h-4 w-4" />;
      case 'offline': return <Radio className="h-4 w-4" />;
      default: return <Radio className="h-4 w-4" />;
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 60) return 'text-green-600';
    if (level > 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const formatLastSeen = (lastSeen: string) => {
    try {
      return formatDistanceToNow(new Date(lastSeen), { addSuffix: true });
    } catch {
      return 'Unknown';
    }
  };

  const getDeviceTypeLabel = (type: string) => {
    switch (type) {
      case 'sensor': return 'Sensor';
      case 'actuator': return 'Actuator';
      case 'camera': return 'Camera';
      default: return type;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-8 px-4">
        <div className="container mx-auto flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Loading IoT devices...</p>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-8 px-4">
        <div className="container mx-auto">
          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-8 text-center space-y-4">
              <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
              <h2 className="text-2xl font-bold">Error Loading Devices</h2>
              <p className="text-muted-foreground">
                {error instanceof Error ? error.message : 'Failed to load IoT devices'}
              </p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-8 px-4">
      <div className="container mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <Radio className="h-8 w-8 text-primary" />
            IoT Sensor Network
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Real-time monitoring with smart sensors for precision agriculture
          </p>
        </div>

        {/* Network Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {networkStats.map((stat, idx) => (
            <Card key={idx} className="shadow-soft">
              <CardContent className="p-6 text-center">
                <div className="text-2xl font-bold mb-2">{stat.value}{stat.unit === '%' ? '%' : ''}</div>
                <p className="text-sm text-muted-foreground mb-2">{stat.label}</p>
                <Progress value={(stat.value / stat.total) * 100} className="h-2" />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="shadow-soft">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search devices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={deviceTypeFilter} onValueChange={setDeviceTypeFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Device Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="sensor">Sensor</SelectItem>
                  <SelectItem value="actuator">Actuator</SelectItem>
                  <SelectItem value="camera">Camera</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Device List */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Device Network Status</CardTitle>
                    <CardDescription>
                      {filteredDevices.length} device{filteredDevices.length !== 1 ? 's' : ''} found
                    </CardDescription>
                  </div>
                  <Button size="sm" onClick={() => setShowRegistrationForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Device
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {filteredDevices.length === 0 ? (
                  <div className="text-center py-12">
                    <Radio className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No devices found</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      {searchQuery || deviceTypeFilter !== 'all' || statusFilter !== 'all'
                        ? 'Try adjusting your filters'
                        : 'Add your first IoT device to get started'}
                    </p>
                  </div>
                ) : (
                  filteredDevices.map((device) => (
                    <div 
                      key={device.id} 
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedDevice?.id === device.id ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                      }`}
                      onClick={() => setSelectedDevice(device)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-sm md:text-base">{device.name}</h3>
                          <p className="text-xs text-muted-foreground">
                            {getDeviceTypeLabel(device.device_type)}
                            {device.location && ` • ${device.location.latitude.toFixed(4)}, ${device.location.longitude.toFixed(4)}`}
                          </p>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${getStatusColor(device.status)}`}>
                          {getStatusIcon(device.status)}
                          <span className="capitalize">{device.status}</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                        {device.battery_level !== undefined && device.battery_level !== null && (
                          <div className="flex items-center gap-2">
                            <Battery className={`h-3 w-3 ${getBatteryColor(device.battery_level)}`} />
                            <span>{device.battery_level}%</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2">
                          <Activity className="h-3 w-3" />
                          <span>{formatLastSeen(device.last_seen)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          <span className="truncate">ID: {device.id.slice(0, 8)}</span>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Device Details */}
            {selectedDevice && !showSensorData && !showAlerts && (
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Device Details
                  </CardTitle>
                  <CardDescription>{selectedDevice.name}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Device ID</p>
                        <p className="font-medium">{selectedDevice.id}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Type</p>
                        <p className="font-medium capitalize">{selectedDevice.device_type}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Status</p>
                        <p className="font-medium capitalize">{selectedDevice.status}</p>
                      </div>
                      {selectedDevice.battery_level !== undefined && (
                        <div>
                          <p className="text-muted-foreground">Battery</p>
                          <p className="font-medium">{selectedDevice.battery_level}%</p>
                        </div>
                      )}
                      <div>
                        <p className="text-muted-foreground">Last Seen</p>
                        <p className="font-medium">{formatLastSeen(selectedDevice.last_seen)}</p>
                      </div>
                      {selectedDevice.location && (
                        <div>
                          <p className="text-muted-foreground">Location</p>
                          <p className="font-medium text-xs">
                            {selectedDevice.location.latitude.toFixed(4)}, {selectedDevice.location.longitude.toFixed(4)}
                          </p>
                        </div>
                      )}
                    </div>
                    {selectedDevice.metadata && Object.keys(selectedDevice.metadata).length > 0 && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-2">Metadata</p>
                        <div className="bg-muted/50 rounded-lg p-3 text-xs">
                          <pre className="whitespace-pre-wrap">
                            {JSON.stringify(selectedDevice.metadata, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sensor Data Chart */}
            {selectedDevice && showSensorData && !showAlerts && (
              <SensorDataChart
                deviceId={selectedDevice.id}
                deviceName={selectedDevice.name}
              />
            )}

            {/* Alerts List */}
            {selectedDevice && showAlerts && !showSensorData && (
              <AlertsList
                deviceId={selectedDevice.id}
                deviceName={selectedDevice.name}
              />
            )}
          </div>

          {/* Controls & Info */}
          <div className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Device Controls</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  size="sm"
                  disabled={!selectedDevice}
                  onClick={() => {
                    setShowSensorData(!showSensorData);
                    setShowAlerts(false);
                  }}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  {showSensorData ? 'Hide' : 'View'} Sensor Data
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start" 
                  size="sm"
                  disabled={!selectedDevice}
                  onClick={() => {
                    setShowAlerts(!showAlerts);
                    setShowSensorData(false);
                  }}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  {showAlerts ? 'Hide' : 'View'} Alerts
                </Button>
              </CardContent>
            </Card>

            {/* Device Management Actions */}
            {selectedDevice && (
              <DeviceManagementActions device={selectedDevice} />
            )}

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle>Network Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary mb-1">24/7</div>
                  <p className="text-sm text-muted-foreground">Continuous Monitoring</p>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span>Total Devices</span>
                    <span>{devices.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Online Devices</span>
                    <span>{devices.filter(d => d.status === 'online').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Offline Devices</span>
                    <span>{devices.filter(d => d.status === 'offline').length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Error Devices</span>
                    <span>{devices.filter(d => d.status === 'error').length}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {devices.length === 0 && (
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Getting Started</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-muted-foreground">
                  <p>Add your first IoT device to start monitoring your farm in real-time.</p>
                  <Button className="w-full" onClick={() => setShowRegistrationForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Register Device
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Device Registration Form */}
      <DeviceRegistrationForm
        open={showRegistrationForm}
        onOpenChange={setShowRegistrationForm}
      />
    </div>
  );
}

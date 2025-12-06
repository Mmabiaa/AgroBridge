import { useState, useEffect, useCallback, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Activity, Loader2, RefreshCw, Thermometer, Droplets, Zap } from 'lucide-react';
import { useSensorData } from '@/api/hooks/useIoT';
import { format } from 'date-fns';
import type { SensorData } from '@/api/services/iot.service';
import { toast } from 'sonner';

interface SensorDataChartProps {
  deviceId: string;
  deviceName: string;
}

interface WebSocketMessage {
  type: string;
  data?: SensorData;
  [key: string]: any;
}

export default function SensorDataChart({ deviceId, deviceName }: SensorDataChartProps) {
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | '7d'>('6h');
  const [realtimeData, setRealtimeData] = useState<SensorData[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Fetch historical data
  const { data: historicalData, isLoading, refetch } = useSensorData(deviceId, {
    limit: timeRange === '1h' ? 12 : timeRange === '6h' ? 36 : timeRange === '24h' ? 48 : 168,
  });

  // Combine historical and realtime data
  const allData = useMemo(() => {
    const historical = historicalData || [];
    const combined = [...historical, ...realtimeData];
    
    // Remove duplicates and sort by timestamp
    const unique = combined.filter(
      (item, index, self) => index === self.findIndex((t) => t.id === item.id)
    );
    
    return unique.sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [historicalData, realtimeData]);

  // Format data for charts
  const chartData = useMemo(() => {
    return allData.map((reading) => ({
      time: format(new Date(reading.timestamp), 'HH:mm'),
      temperature: reading.temperature || null,
      humidity: reading.humidity || null,
      soil_moisture: reading.soil_moisture || null,
      light_intensity: reading.light_intensity ? reading.light_intensity / 1000 : null,
      ph_level: reading.ph_level || null,
      ec_level: reading.ec_level || null,
    }));
  }, [allData]);

  // Get latest reading
  const latestReading = allData.length > 0 ? allData[allData.length - 1] : null;

  // WebSocket connection
  const connectWebSocket = useCallback(() => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      console.log('No auth token available for WebSocket');
      return;
    }

    const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';
    const wsUrl = `${WS_BASE_URL}/ws/devices/${deviceId}/?token=${token}`;

    try {
      const websocket = new WebSocket(wsUrl);

      websocket.onopen = () => {
        console.log('WebSocket connected for device:', deviceId);
        setIsConnected(true);
        toast.success('Real-time monitoring active', {
          description: 'Connected to device sensor stream',
        });
      };

      websocket.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          if (message.type === 'sensor_data' && message.data) {
            setRealtimeData((prev) => {
              const newData = [...prev, message.data!];
              // Keep only last 50 realtime readings
              return newData.slice(-50);
            });
          }
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      websocket.onerror = (error) => {
        console.error('WebSocket error:', error);
        toast.error('Connection error', {
          description: 'Failed to connect to real-time sensor stream',
        });
      };

      websocket.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt reconnection after 5 seconds
        setTimeout(() => {
          if (deviceId) {
            connectWebSocket();
          }
        }, 5000);
      };

      setWs(websocket);
    } catch (error) {
      console.error('Error creating WebSocket:', error);
    }
  }, [deviceId]);

  // Connect on mount and cleanup on unmount
  useEffect(() => {
    connectWebSocket();

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [deviceId]);

  const handleRefresh = () => {
    refetch();
    setRealtimeData([]);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Sensor Data
            </CardTitle>
            <CardDescription>
              {deviceName} • {isConnected ? 'Live' : 'Historical'} data
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">Last Hour</SelectItem>
                <SelectItem value="6h">Last 6 Hours</SelectItem>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={handleRefresh}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="temperature">Temperature</TabsTrigger>
            <TabsTrigger value="moisture">Moisture</TabsTrigger>
            <TabsTrigger value="other">Other</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Latest Readings */}
            {latestReading && (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {latestReading.temperature !== undefined && latestReading.temperature !== null && (
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Thermometer className="h-6 w-6 text-red-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{latestReading.temperature}°C</div>
                    <p className="text-xs text-muted-foreground">Temperature</p>
                  </div>
                )}
                {latestReading.humidity !== undefined && latestReading.humidity !== null && (
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Droplets className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{latestReading.humidity}%</div>
                    <p className="text-xs text-muted-foreground">Humidity</p>
                  </div>
                )}
                {latestReading.soil_moisture !== undefined && latestReading.soil_moisture !== null && (
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Droplets className="h-6 w-6 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{latestReading.soil_moisture}%</div>
                    <p className="text-xs text-muted-foreground">Soil Moisture</p>
                  </div>
                )}
                {latestReading.light_intensity !== undefined && latestReading.light_intensity !== null && (
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Zap className="h-6 w-6 text-yellow-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{(latestReading.light_intensity / 1000).toFixed(1)}k</div>
                    <p className="text-xs text-muted-foreground">Light (lux)</p>
                  </div>
                )}
                {latestReading.ph_level !== undefined && latestReading.ph_level !== null && (
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Zap className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{latestReading.ph_level}</div>
                    <p className="text-xs text-muted-foreground">pH Level</p>
                  </div>
                )}
                {latestReading.ec_level !== undefined && latestReading.ec_level !== null && (
                  <div className="text-center p-4 bg-muted/50 rounded-lg">
                    <Zap className="h-6 w-6 text-orange-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{latestReading.ec_level}</div>
                    <p className="text-xs text-muted-foreground">EC Level</p>
                  </div>
                )}
              </div>
            )}

            {/* Multi-line Chart */}
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {chartData.some((d) => d.temperature !== null) && (
                    <Line
                      type="monotone"
                      dataKey="temperature"
                      stroke="#ef4444"
                      name="Temperature (°C)"
                      dot={false}
                    />
                  )}
                  {chartData.some((d) => d.humidity !== null) && (
                    <Line
                      type="monotone"
                      dataKey="humidity"
                      stroke="#3b82f6"
                      name="Humidity (%)"
                      dot={false}
                    />
                  )}
                  {chartData.some((d) => d.soil_moisture !== null) && (
                    <Line
                      type="monotone"
                      dataKey="soil_moisture"
                      stroke="#10b981"
                      name="Soil Moisture (%)"
                      dot={false}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No sensor data available
              </div>
            )}
          </TabsContent>

          <TabsContent value="temperature">
            {chartData.length > 0 && chartData.some((d) => d.temperature !== null) ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="temperature"
                    stroke="#ef4444"
                    name="Temperature (°C)"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No temperature data available
              </div>
            )}
          </TabsContent>

          <TabsContent value="moisture">
            {chartData.length > 0 &&
            (chartData.some((d) => d.humidity !== null) ||
              chartData.some((d) => d.soil_moisture !== null)) ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {chartData.some((d) => d.humidity !== null) && (
                    <Line
                      type="monotone"
                      dataKey="humidity"
                      stroke="#3b82f6"
                      name="Humidity (%)"
                      strokeWidth={2}
                    />
                  )}
                  {chartData.some((d) => d.soil_moisture !== null) && (
                    <Line
                      type="monotone"
                      dataKey="soil_moisture"
                      stroke="#10b981"
                      name="Soil Moisture (%)"
                      strokeWidth={2}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No moisture data available
              </div>
            )}
          </TabsContent>

          <TabsContent value="other">
            {chartData.length > 0 &&
            (chartData.some((d) => d.light_intensity !== null) ||
              chartData.some((d) => d.ph_level !== null) ||
              chartData.some((d) => d.ec_level !== null)) ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {chartData.some((d) => d.light_intensity !== null) && (
                    <Line
                      type="monotone"
                      dataKey="light_intensity"
                      stroke="#eab308"
                      name="Light (k lux)"
                      strokeWidth={2}
                    />
                  )}
                  {chartData.some((d) => d.ph_level !== null) && (
                    <Line
                      type="monotone"
                      dataKey="ph_level"
                      stroke="#a855f7"
                      name="pH Level"
                      strokeWidth={2}
                    />
                  )}
                  {chartData.some((d) => d.ec_level !== null) && (
                    <Line
                      type="monotone"
                      dataKey="ec_level"
                      stroke="#f97316"
                      name="EC Level"
                      strokeWidth={2}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                No additional sensor data available
              </div>
            )}
          </TabsContent>
        </Tabs>

        {isConnected && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Live data streaming</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

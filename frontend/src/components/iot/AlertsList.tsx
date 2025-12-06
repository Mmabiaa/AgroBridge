import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useDeviceAlerts, useAcknowledgeAlert } from '@/api/hooks/useIoT';
import { formatDistanceToNow } from 'date-fns';
import type { DeviceAlert } from '@/api/services/iot.service';
import { toast } from 'sonner';

interface AlertsListProps {
  deviceId: string;
  deviceName: string;
}

export default function AlertsList({ deviceId, deviceName }: AlertsListProps) {
  const { data: alerts, isLoading, isError } = useDeviceAlerts(deviceId);
  const acknowledgeAlert = useAcknowledgeAlert();

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
      case 'high':
        return <XCircle className="h-5 w-5" />;
      case 'medium':
        return <AlertTriangle className="h-5 w-5" />;
      case 'low':
        return <AlertTriangle className="h-5 w-5" />;
      default:
        return <AlertTriangle className="h-5 w-5" />;
    }
  };

  const getAlertTypeLabel = (type: string) => {
    switch (type) {
      case 'low_battery':
        return 'Low Battery';
      case 'offline':
        return 'Device Offline';
      case 'threshold_exceeded':
        return 'Threshold Exceeded';
      case 'malfunction':
        return 'Malfunction';
      default:
        return type;
    }
  };

  const handleAcknowledge = async (alertId: string) => {
    try {
      await acknowledgeAlert.mutateAsync({ deviceId, alertId });
      toast.success('Alert acknowledged', {
        description: 'The alert has been marked as acknowledged',
      });
    } catch (error: any) {
      toast.error('Failed to acknowledge alert', {
        description: error.message || 'Please try again',
      });
    }
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

  if (isError) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-muted-foreground">Failed to load alerts</p>
        </CardContent>
      </Card>
    );
  }

  const unacknowledgedAlerts = alerts?.filter((alert) => !alert.is_acknowledged) || [];
  const acknowledgedAlerts = alerts?.filter((alert) => alert.is_acknowledged) || [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Device Alerts
        </CardTitle>
        <CardDescription>
          {deviceName} • {unacknowledgedAlerts.length} unacknowledged alert
          {unacknowledgedAlerts.length !== 1 ? 's' : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {alerts && alerts.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground">No alerts for this device</p>
            <p className="text-sm text-muted-foreground mt-2">
              All systems operating normally
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Unacknowledged Alerts */}
            {unacknowledgedAlerts.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Active Alerts
                </h3>
                {unacknowledgedAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onAcknowledge={handleAcknowledge}
                    isAcknowledging={acknowledgeAlert.isPending}
                    getSeverityColor={getSeverityColor}
                    getSeverityIcon={getSeverityIcon}
                    getAlertTypeLabel={getAlertTypeLabel}
                  />
                ))}
              </div>
            )}

            {/* Acknowledged Alerts */}
            {acknowledgedAlerts.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Acknowledged Alerts
                </h3>
                {acknowledgedAlerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onAcknowledge={handleAcknowledge}
                    isAcknowledging={false}
                    getSeverityColor={getSeverityColor}
                    getSeverityIcon={getSeverityIcon}
                    getAlertTypeLabel={getAlertTypeLabel}
                    isAcknowledged
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface AlertCardProps {
  alert: DeviceAlert;
  onAcknowledge: (alertId: string) => void;
  isAcknowledging: boolean;
  getSeverityColor: (severity: string) => string;
  getSeverityIcon: (severity: string) => JSX.Element;
  getAlertTypeLabel: (type: string) => string;
  isAcknowledged?: boolean;
}

function AlertCard({
  alert,
  onAcknowledge,
  isAcknowledging,
  getSeverityColor,
  getSeverityIcon,
  getAlertTypeLabel,
  isAcknowledged = false,
}: AlertCardProps) {
  return (
    <div
      className={`border rounded-lg p-4 ${
        isAcknowledged ? 'opacity-60' : ''
      } ${getSeverityColor(alert.severity)}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-0.5">{getSeverityIcon(alert.severity)}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="text-xs">
                {getAlertTypeLabel(alert.alert_type)}
              </Badge>
              <Badge variant="outline" className="text-xs capitalize">
                {alert.severity}
              </Badge>
            </div>
            <p className="text-sm font-medium mb-1">{alert.message}</p>
            <p className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true })}
              {alert.acknowledged_at && (
                <span>
                  {' '}
                  • Acknowledged{' '}
                  {formatDistanceToNow(new Date(alert.acknowledged_at), {
                    addSuffix: true,
                  })}
                </span>
              )}
            </p>
          </div>
        </div>
        {!isAcknowledged && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onAcknowledge(alert.id)}
            disabled={isAcknowledging}
          >
            {isAcknowledging ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              'Acknowledge'
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

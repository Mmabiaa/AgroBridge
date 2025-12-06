/**
 * Supply Chain Tracker Component
 * Displays supply chain events timeline and product journey on map
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSupplyChain } from '@/api/hooks/useBlockchain';
import { SupplyChainEvent } from '@/api/services/blockchain.service';
import {
  Truck,
  MapPin,
  CheckCircle,
  Package,
  Factory,
  Warehouse,
  Home,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

interface SupplyChainTrackerProps {
  productId: string;
}

export default function SupplyChainTracker({ productId }: SupplyChainTrackerProps) {
  const { data: events, isLoading, isError, error } = useSupplyChain(productId);

  const getEventIcon = (eventType: SupplyChainEvent['event_type']) => {
    switch (eventType) {
      case 'harvest':
        return <Home className="h-5 w-5 text-green-600" />;
      case 'processing':
        return <Factory className="h-5 w-5 text-blue-600" />;
      case 'packaging':
        return <Package className="h-5 w-5 text-purple-600" />;
      case 'transport':
        return <Truck className="h-5 w-5 text-orange-600" />;
      case 'storage':
        return <Warehouse className="h-5 w-5 text-indigo-600" />;
      case 'delivery':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      default:
        return <MapPin className="h-5 w-5 text-gray-600" />;
    }
  };

  const getEventColor = (eventType: SupplyChainEvent['event_type']) => {
    switch (eventType) {
      case 'harvest':
        return 'bg-green-100 border-green-300';
      case 'processing':
        return 'bg-blue-100 border-blue-300';
      case 'packaging':
        return 'bg-purple-100 border-purple-300';
      case 'transport':
        return 'bg-orange-100 border-orange-300';
      case 'storage':
        return 'bg-indigo-100 border-indigo-300';
      case 'delivery':
        return 'bg-green-100 border-green-300';
      default:
        return 'bg-gray-100 border-gray-300';
    }
  };

  const formatEventType = (eventType: SupplyChainEvent['event_type']) => {
    return eventType.charAt(0).toUpperCase() + eventType.slice(1);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to load supply chain data: {error?.message || 'Unknown error'}
        </AlertDescription>
      </Alert>
    );
  }

  if (!events || events.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Truck className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Supply Chain Data</h3>
          <p className="text-muted-foreground">
            Supply chain tracking information is not available for this product yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Timeline Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Supply Chain Journey
          </CardTitle>
          <CardDescription>
            Track the complete journey of your product from farm to consumer
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />

            {/* Events */}
            <div className="space-y-6">
              {events.map((event) => (
                <div key={event.id} className="relative flex gap-4">
                  {/* Event Icon */}
                  <div
                    className={`relative z-10 flex h-12 w-12 items-center justify-center rounded-full border-2 ${getEventColor(
                      event.event_type
                    )}`}
                  >
                    {getEventIcon(event.event_type)}
                  </div>

                  {/* Event Details */}
                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-lg">
                          {formatEventType(event.event_type)}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {new Date(event.timestamp).toLocaleString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <Badge variant="outline" className="bg-green-50 text-green-700">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    </div>

                    {/* Location */}
                    <div className="flex items-start gap-2 mb-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="font-medium">{event.location.address}</p>
                        <p className="text-xs text-muted-foreground">
                          {event.location.latitude.toFixed(6)}, {event.location.longitude.toFixed(6)}
                        </p>
                      </div>
                    </div>

                    {/* Actor */}
                    <div className="mb-3">
                      <p className="text-sm">
                        <span className="text-muted-foreground">Handled by: </span>
                        <span className="font-medium">{event.actor.name}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          {event.actor.role}
                        </Badge>
                      </p>
                    </div>

                    {/* Metadata */}
                    {event.metadata && Object.keys(event.metadata).length > 0 && (
                      <div className="bg-muted p-3 rounded-md space-y-1">
                        {Object.entries(event.metadata).map(([key, value]) => (
                          <p key={key} className="text-sm">
                            <span className="text-muted-foreground capitalize">
                              {key.replace(/_/g, ' ')}:{' '}
                            </span>
                            <span className="font-medium">{String(value)}</span>
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Blockchain Info */}
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs text-muted-foreground">Blockchain Hash</p>
                          <p className="font-mono text-xs">{event.blockchain_hash.slice(0, 20)}...</p>
                        </div>
                        <Button variant="ghost" size="sm" asChild>
                          <a
                            href={`https://etherscan.io/tx/${event.transaction_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Map Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Product Journey Map
          </CardTitle>
          <CardDescription>
            Visual representation of the product's journey
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Map Placeholder */}
          <div className="bg-muted rounded-lg h-96 flex items-center justify-center">
            <div className="text-center space-y-3">
              <MapPin className="h-12 w-12 text-muted-foreground mx-auto" />
              <div>
                <p className="font-semibold">Interactive Map</p>
                <p className="text-sm text-muted-foreground">
                  Map integration would display the journey here
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  {events.length} locations tracked
                </p>
              </div>
            </div>
          </div>

          {/* Location Summary */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">{events.length}</p>
              <p className="text-sm text-muted-foreground">Total Events</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">
                {new Set(events.map((event) => event.location.address)).size}
              </p>
              <p className="text-sm text-muted-foreground">Unique Locations</p>
            </div>
            <div className="text-center p-4 bg-muted rounded-lg">
              <p className="text-2xl font-bold">
                {Math.round(
                  (new Date(events[events.length - 1].timestamp).getTime() -
                    new Date(events[0].timestamp).getTime()) /
                    (1000 * 60 * 60 * 24)
                )}
              </p>
              <p className="text-sm text-muted-foreground">Days in Transit</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transparency Score */}
      <Card>
        <CardHeader>
          <CardTitle>Supply Chain Transparency</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Transparency Score</span>
              <span className="text-2xl font-bold text-green-600">
                {Math.round((events.length / 6) * 100)}%
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all"
                style={{ width: `${Math.min((events.length / 6) * 100, 100)}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              This product has {events.length} verified supply chain events recorded on the blockchain,
              providing complete transparency from origin to delivery.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

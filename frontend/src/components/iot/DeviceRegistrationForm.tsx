import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Loader2, MapPin } from 'lucide-react';
import { useRegisterDevice } from '@/api/hooks/useIoT';
import { toast } from 'sonner';

const deviceSchema = z.object({
  farm: z.string().min(1, 'Farm is required'),
  name: z.string().min(3, 'Name must be at least 3 characters'),
  device_type: z.enum(['sensor', 'actuator', 'camera'], {
    required_error: 'Device type is required',
  }),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

type DeviceFormData = z.infer<typeof deviceSchema>;

interface DeviceRegistrationFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  farmId?: string;
}

export default function DeviceRegistrationForm({
  open,
  onOpenChange,
  farmId,
}: DeviceRegistrationFormProps) {
  const [useLocation, setUseLocation] = useState(false);
  const registerDevice = useRegisterDevice();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    reset,
  } = useForm<DeviceFormData>({
    resolver: zodResolver(deviceSchema),
    defaultValues: {
      farm: farmId || '',
      device_type: 'sensor',
    },
  });

  const deviceType = watch('device_type');

  const onSubmit = async (data: DeviceFormData) => {
    try {
      const payload: any = {
        farm: data.farm,
        name: data.name,
        device_type: data.device_type,
      };

      // Add location if provided
      if (useLocation && data.latitude && data.longitude) {
        const lat = parseFloat(data.latitude);
        const lng = parseFloat(data.longitude);
        
        if (!isNaN(lat) && !isNaN(lng)) {
          payload.location = {
            latitude: lat,
            longitude: lng,
          };
        }
      }

      await registerDevice.mutateAsync(payload);
      
      toast.success('Device registered successfully', {
        description: `${data.name} has been added to your network`,
      });
      
      reset();
      onOpenChange(false);
    } catch (error: any) {
      toast.error('Failed to register device', {
        description: error.message || 'Please try again',
      });
    }
  };

  const handleGetCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setValue('latitude', position.coords.latitude.toString());
          setValue('longitude', position.coords.longitude.toString());
          toast.success('Location obtained', {
            description: 'Current location has been set',
          });
        },
        (error) => {
          toast.error('Failed to get location', {
            description: error.message,
          });
        }
      );
    } else {
      toast.error('Geolocation not supported', {
        description: 'Your browser does not support geolocation',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Register New Device</DialogTitle>
          <DialogDescription>
            Add a new IoT device to your farm network
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="farm">Farm ID</Label>
            <Input
              id="farm"
              placeholder="Enter farm ID"
              {...register('farm')}
              disabled={!!farmId}
            />
            {errors.farm && (
              <p className="text-sm text-destructive">{errors.farm.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="name">Device Name</Label>
            <Input
              id="name"
              placeholder="e.g., Field A Soil Sensor"
              {...register('name')}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="device_type">Device Type</Label>
            <Select
              value={deviceType}
              onValueChange={(value) => setValue('device_type', value as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select device type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sensor">Sensor</SelectItem>
                <SelectItem value="actuator">Actuator</SelectItem>
                <SelectItem value="camera">Camera</SelectItem>
              </SelectContent>
            </Select>
            {errors.device_type && (
              <p className="text-sm text-destructive">
                {errors.device_type.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Location (Optional)</Label>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setUseLocation(!useLocation)}
              >
                {useLocation ? 'Remove' : 'Add'} Location
              </Button>
            </div>

            {useLocation && (
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      type="number"
                      step="any"
                      placeholder="0.0000"
                      {...register('latitude')}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      type="number"
                      step="any"
                      placeholder="0.0000"
                      {...register('longitude')}
                    />
                  </div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={handleGetCurrentLocation}
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Use Current Location
                </Button>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={registerDevice.isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={registerDevice.isPending}>
              {registerDevice.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Register Device
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

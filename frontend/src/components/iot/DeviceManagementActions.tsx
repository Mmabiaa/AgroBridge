import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Edit, Loader2, MapPin, Trash2, Zap } from 'lucide-react';
import { useUpdateDevice, useDeleteDevice, useUpdateFirmware } from '@/api/hooks/useIoT';
import type { IoTDevice } from '@/api/services/iot.service';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const updateDeviceSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
});

type UpdateDeviceFormData = z.infer<typeof updateDeviceSchema>;

interface DeviceManagementActionsProps {
  device: IoTDevice;
}

export default function DeviceManagementActions({ device }: DeviceManagementActionsProps) {
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showFirmwareDialog, setShowFirmwareDialog] = useState(false);
  const [useLocation, setUseLocation] = useState(!!device.location);
  const [firmwareVersion, setFirmwareVersion] = useState('');

  const navigate = useNavigate();
  const updateDevice = useUpdateDevice();
  const deleteDevice = useDeleteDevice();
  const updateFirmware = useUpdateFirmware();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm<UpdateDeviceFormData>({
    resolver: zodResolver(updateDeviceSchema),
    defaultValues: {
      name: device.name,
      latitude: device.location?.latitude.toString() || '',
      longitude: device.location?.longitude.toString() || '',
    },
  });

  const onSubmitEdit = async (data: UpdateDeviceFormData) => {
    try {
      const payload: any = {
        name: data.name,
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

      await updateDevice.mutateAsync({ deviceId: device.id, data: payload });
      
      toast.success('Device updated successfully', {
        description: `${data.name} has been updated`,
      });
      
      setShowEditDialog(false);
    } catch (error: any) {
      toast.error('Failed to update device', {
        description: error.message || 'Please try again',
      });
    }
  };

  const handleDelete = async () => {
    try {
      await deleteDevice.mutateAsync(device.id);
      
      toast.success('Device deleted successfully', {
        description: `${device.name} has been removed from your network`,
      });
      
      setShowDeleteDialog(false);
      navigate('/iot-sensors');
    } catch (error: any) {
      toast.error('Failed to delete device', {
        description: error.message || 'Please try again',
      });
    }
  };

  const handleFirmwareUpdate = async () => {
    if (!firmwareVersion.trim()) {
      toast.error('Version required', {
        description: 'Please enter a firmware version',
      });
      return;
    }

    try {
      await updateFirmware.mutateAsync({
        deviceId: device.id,
        version: firmwareVersion,
      });
      
      toast.success('Firmware update initiated', {
        description: 'The device will update to the specified version',
      });
      
      setShowFirmwareDialog(false);
      setFirmwareVersion('');
    } catch (error: any) {
      toast.error('Failed to update firmware', {
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
    <>
      <Card>
        <CardHeader>
          <CardTitle>Device Management</CardTitle>
          <CardDescription>Edit, update, or remove this device</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => {
              reset({
                name: device.name,
                latitude: device.location?.latitude.toString() || '',
                longitude: device.location?.longitude.toString() || '',
              });
              setShowEditDialog(true);
            }}
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit Device
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={() => setShowFirmwareDialog(true)}
          >
            <Zap className="h-4 w-4 mr-2" />
            Update Firmware
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start text-destructive hover:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Device
          </Button>
        </CardContent>
      </Card>

      {/* Edit Device Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Device</DialogTitle>
            <DialogDescription>Update device information</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit(onSubmitEdit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Device Name</Label>
              <Input
                id="edit-name"
                placeholder="e.g., Field A Soil Sensor"
                {...register('name')}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Location</Label>
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
                      <Label htmlFor="edit-latitude">Latitude</Label>
                      <Input
                        id="edit-latitude"
                        type="number"
                        step="any"
                        placeholder="0.0000"
                        {...register('latitude')}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="edit-longitude">Longitude</Label>
                      <Input
                        id="edit-longitude"
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
                onClick={() => setShowEditDialog(false)}
                disabled={updateDevice.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={updateDevice.isPending}>
                {updateDevice.isPending && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Device Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Device</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete <strong>{device.name}</strong>? This action
              cannot be undone and all associated data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteDevice.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteDevice.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteDevice.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Delete Device
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Firmware Update Dialog */}
      <Dialog open={showFirmwareDialog} onOpenChange={setShowFirmwareDialog}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Update Firmware</DialogTitle>
            <DialogDescription>
              Update the firmware version for {device.name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="firmware-version">Firmware Version</Label>
              <Input
                id="firmware-version"
                placeholder="e.g., 2.1.0"
                value={firmwareVersion}
                onChange={(e) => setFirmwareVersion(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Enter the target firmware version to update to
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowFirmwareDialog(false);
                setFirmwareVersion('');
              }}
              disabled={updateFirmware.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleFirmwareUpdate}
              disabled={updateFirmware.isPending || !firmwareVersion.trim()}
            >
              {updateFirmware.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Update Firmware
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

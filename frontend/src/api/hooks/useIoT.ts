/**
 * React Query hooks for IoT service
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import iotService from '../services/iot.service';
import type {
  CreateDeviceRequest,
  UpdateDeviceRequest,
  DeviceListParams,
  SensorDataParams,
} from '../services/iot.service';

export const iotKeys = {
  all: ['iot'] as const,
  devices: () => [...iotKeys.all, 'devices'] as const,
  devicesList: (params?: DeviceListParams) => [...iotKeys.devices(), 'list', params] as const,
  device: (id: string) => [...iotKeys.devices(), id] as const,
  sensorData: (id: string, params?: SensorDataParams) => [...iotKeys.device(id), 'data', params] as const,
  alerts: (id: string) => [...iotKeys.device(id), 'alerts'] as const,
};

export const useDevices = (params?: DeviceListParams) => {
  return useQuery({
    queryKey: iotKeys.devicesList(params),
    queryFn: () => iotService.getDevices(params),
    staleTime: 2 * 60 * 1000,
  });
};

export const useDevice = (deviceId: string) => {
  return useQuery({
    queryKey: iotKeys.device(deviceId),
    queryFn: () => iotService.getDevice(deviceId),
    enabled: !!deviceId,
    staleTime: 1 * 60 * 1000,
  });
};

export const useSensorData = (deviceId: string, params?: SensorDataParams) => {
  return useQuery({
    queryKey: iotKeys.sensorData(deviceId, params),
    queryFn: () => iotService.getSensorData(deviceId, params),
    enabled: !!deviceId,
    staleTime: 30 * 1000, // 30 seconds for real-time data
    refetchInterval: 60 * 1000, // Refetch every minute
  });
};

export const useDeviceAlerts = (deviceId: string) => {
  return useQuery({
    queryKey: iotKeys.alerts(deviceId),
    queryFn: () => iotService.getDeviceAlerts(deviceId),
    enabled: !!deviceId,
    staleTime: 1 * 60 * 1000,
  });
};

export const useRegisterDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDeviceRequest) => iotService.registerDevice(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: iotKeys.devices() });
    },
  });
};

export const useUpdateDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deviceId, data }: { deviceId: string; data: UpdateDeviceRequest }) =>
      iotService.updateDevice(deviceId, data),
    onSuccess: (_, { deviceId }) => {
      queryClient.invalidateQueries({ queryKey: iotKeys.device(deviceId) });
      queryClient.invalidateQueries({ queryKey: iotKeys.devices() });
    },
  });
};

export const useDeleteDevice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (deviceId: string) => iotService.deleteDevice(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: iotKeys.devices() });
    },
  });
};

export const useAcknowledgeAlert = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deviceId, alertId }: { deviceId: string; alertId: string }) =>
      iotService.acknowledgeAlert(deviceId, alertId),
    onSuccess: (_, { deviceId }) => {
      queryClient.invalidateQueries({ queryKey: iotKeys.alerts(deviceId) });
    },
  });
};

export const useUpdateFirmware = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ deviceId, version }: { deviceId: string; version: string }) =>
      iotService.updateFirmware(deviceId, version),
    onSuccess: (_, { deviceId }) => {
      queryClient.invalidateQueries({ queryKey: iotKeys.device(deviceId) });
    },
  });
};

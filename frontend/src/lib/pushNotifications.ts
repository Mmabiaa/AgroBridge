/**
 * Push Notifications Service
 * Handles browser push notification registration and management
 */

import notificationsService from '@/api/services/notifications.service';

// Check if push notifications are supported
export const isPushNotificationSupported = (): boolean => {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
};

// Check current notification permission
export const getNotificationPermission = (): NotificationPermission => {
    if (!('Notification' in window)) {
        return 'denied';
    }
    return Notification.permission;
};

// Request notification permission
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
    if (!('Notification' in window)) {
        console.warn('Notifications not supported');
        return 'denied';
    }

    try {
        const permission = await Notification.requestPermission();
        return permission;
    } catch (error) {
        console.error('Error requesting notification permission:', error);
        return 'denied';
    }
};

// Convert base64 string to Uint8Array (for VAPID key)
const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
};

// Register service worker
export const registerServiceWorker = async (): Promise<ServiceWorkerRegistration | null> => {
    if (!('serviceWorker' in navigator)) {
        console.warn('Service workers not supported');
        return null;
    }

    try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
            scope: '/',
        });
        console.log('Service Worker registered:', registration);
        return registration;
    } catch (error) {
        console.error('Service Worker registration failed:', error);
        return null;
    }
};

// Subscribe to push notifications
export const subscribeToPushNotifications = async (
    vapidPublicKey?: string
): Promise<PushSubscription | null> => {
    if (!isPushNotificationSupported()) {
        console.warn('Push notifications not supported');
        return null;
    }

    try {
        // Get service worker registration
        const registration = await navigator.serviceWorker.ready;

        // Check if already subscribed
        let subscription = await registration.pushManager.getSubscription();

        if (!subscription) {
            // Subscribe to push notifications
            const applicationServerKey = vapidPublicKey
                ? urlBase64ToUint8Array(vapidPublicKey)
                : undefined;

            subscription = await registration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey as BufferSource,
            });

            console.log('Push subscription created:', subscription);
        } else {
            console.log('Already subscribed to push notifications');
        }

        return subscription;
    } catch (error) {
        console.error('Error subscribing to push notifications:', error);
        return null;
    }
};

// Unsubscribe from push notifications
export const unsubscribeFromPushNotifications = async (): Promise<boolean> => {
    if (!isPushNotificationSupported()) {
        return false;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        if (subscription) {
            const successful = await subscription.unsubscribe();
            console.log('Push subscription removed:', successful);
            return successful;
        }

        return true;
    } catch (error) {
        console.error('Error unsubscribing from push notifications:', error);
        return false;
    }
};

// Register device with backend
export const registerDeviceWithBackend = async (
    subscription: PushSubscription
): Promise<string | null> => {
    try {
        const subscriptionJSON = subscription.toJSON();

        if (!subscriptionJSON.endpoint || !subscriptionJSON.keys) {
            throw new Error('Invalid subscription object');
        }

        const response = await notificationsService.registerDevice({
            endpoint: subscriptionJSON.endpoint,
            keys: {
                p256dh: subscriptionJSON.keys.p256dh || '',
                auth: subscriptionJSON.keys.auth || '',
            },
        });

        console.log('Device registered with backend:', response);
        return response.device_id;
    } catch (error) {
        console.error('Error registering device with backend:', error);
        return null;
    }
};

// Unregister device from backend
export const unregisterDeviceFromBackend = async (deviceId: string): Promise<boolean> => {
    try {
        await notificationsService.unregisterDevice(deviceId);
        console.log('Device unregistered from backend');
        return true;
    } catch (error) {
        console.error('Error unregistering device from backend:', error);
        return false;
    }
};

// Complete push notification setup
export const setupPushNotifications = async (vapidPublicKey?: string): Promise<{
    success: boolean;
    deviceId?: string;
    error?: string;
}> => {
    try {
        // Check support
        if (!isPushNotificationSupported()) {
            return {
                success: false,
                error: 'Push notifications are not supported in this browser',
            };
        }

        // Request permission
        const permission = await requestNotificationPermission();
        if (permission !== 'granted') {
            return {
                success: false,
                error: 'Notification permission denied',
            };
        }

        // Register service worker
        const registration = await registerServiceWorker();
        if (!registration) {
            return {
                success: false,
                error: 'Failed to register service worker',
            };
        }

        // Wait for service worker to be ready
        await navigator.serviceWorker.ready;

        // Subscribe to push notifications
        const subscription = await subscribeToPushNotifications(vapidPublicKey);
        if (!subscription) {
            return {
                success: false,
                error: 'Failed to subscribe to push notifications',
            };
        }

        // Register device with backend
        const deviceId = await registerDeviceWithBackend(subscription);
        if (!deviceId) {
            return {
                success: false,
                error: 'Failed to register device with backend',
            };
        }

        // Store device ID in localStorage
        localStorage.setItem('push_device_id', deviceId);

        return {
            success: true,
            deviceId,
        };
    } catch (error) {
        console.error('Error setting up push notifications:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
};

// Disable push notifications
export const disablePushNotifications = async (): Promise<boolean> => {
    try {
        // Get stored device ID
        const deviceId = localStorage.getItem('push_device_id');

        // Unsubscribe from push notifications
        const unsubscribed = await unsubscribeFromPushNotifications();

        // Unregister device from backend
        if (deviceId) {
            await unregisterDeviceFromBackend(deviceId);
            localStorage.removeItem('push_device_id');
        }

        return unsubscribed;
    } catch (error) {
        console.error('Error disabling push notifications:', error);
        return false;
    }
};

// Check if push notifications are enabled
export const isPushNotificationsEnabled = async (): Promise<boolean> => {
    if (!isPushNotificationSupported()) {
        return false;
    }

    try {
        const permission = getNotificationPermission();
        if (permission !== 'granted') {
            return false;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();

        return subscription !== null;
    } catch (error) {
        console.error('Error checking push notification status:', error);
        return false;
    }
};

// Show a test notification
export const showTestNotification = async (
    title: string = 'Test Notification',
    body: string = 'This is a test notification from AgroBridge'
): Promise<void> => {
    if (!isPushNotificationSupported()) {
        console.warn('Push notifications not supported');
        return;
    }

    const permission = getNotificationPermission();
    if (permission !== 'granted') {
        console.warn('Notification permission not granted');
        return;
    }

    try {
        const registration = await navigator.serviceWorker.ready;
        await registration.showNotification(title, {
            body,
            icon: '/logo.png',
            badge: '/badge.png',
            tag: 'test-notification',
            requireInteraction: false,
        });
    } catch (error) {
        console.error('Error showing test notification:', error);
    }
};

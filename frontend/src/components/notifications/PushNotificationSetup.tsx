/**
 * Push Notification Setup Component
 * Allows users to enable/disable browser push notifications
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
    Bell, 
    BellOff, 
    CheckCircle, 
    XCircle, 
    AlertTriangle,
    Loader2,
    Info
} from 'lucide-react';
import {
    isPushNotificationSupported,
    getNotificationPermission,
    setupPushNotifications,
    disablePushNotifications,
    isPushNotificationsEnabled,
    showTestNotification,
} from '@/lib/pushNotifications';
import { toast } from 'sonner';

export const PushNotificationSetup: React.FC = () => {
    const [isSupported, setIsSupported] = useState(false);
    const [permission, setPermission] = useState<NotificationPermission>('default');
    const [isEnabled, setIsEnabled] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);

    // Check support and status on mount
    useEffect(() => {
        const checkStatus = async () => {
            setIsLoading(true);
            
            const supported = isPushNotificationSupported();
            setIsSupported(supported);

            if (supported) {
                const perm = getNotificationPermission();
                setPermission(perm);

                const enabled = await isPushNotificationsEnabled();
                setIsEnabled(enabled);
            }

            setIsLoading(false);
        };

        checkStatus();
    }, []);

    const handleEnable = async () => {
        setIsProcessing(true);

        try {
            const result = await setupPushNotifications();

            if (result.success) {
                setIsEnabled(true);
                setPermission('granted');
                toast.success('Push notifications enabled', {
                    description: 'You will now receive push notifications from AgroBridge.',
                });
            } else {
                toast.error('Failed to enable push notifications', {
                    description: result.error || 'Please try again later.',
                });
            }
        } catch (error) {
            console.error('Error enabling push notifications:', error);
            toast.error('Failed to enable push notifications', {
                description: 'An unexpected error occurred.',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDisable = async () => {
        setIsProcessing(true);

        try {
            const success = await disablePushNotifications();

            if (success) {
                setIsEnabled(false);
                toast.success('Push notifications disabled', {
                    description: 'You will no longer receive push notifications.',
                });
            } else {
                toast.error('Failed to disable push notifications', {
                    description: 'Please try again later.',
                });
            }
        } catch (error) {
            console.error('Error disabling push notifications:', error);
            toast.error('Failed to disable push notifications', {
                description: 'An unexpected error occurred.',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const handleTest = async () => {
        try {
            await showTestNotification();
            toast.success('Test notification sent', {
                description: 'Check your notifications to see if it appeared.',
            });
        } catch (error) {
            console.error('Error sending test notification:', error);
            toast.error('Failed to send test notification', {
                description: 'Please make sure notifications are enabled.',
            });
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (!isSupported) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <BellOff className="h-5 w-5" />
                        Push Notifications
                    </CardTitle>
                    <CardDescription>
                        Browser push notifications for real-time updates
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Push notifications are not supported in your browser. Please use a modern browser like Chrome, Firefox, or Edge.
                        </AlertDescription>
                    </Alert>
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
                            <Bell className="h-5 w-5" />
                            Push Notifications
                        </CardTitle>
                        <CardDescription>
                            Receive notifications even when the app is closed
                        </CardDescription>
                    </div>
                    {isEnabled && (
                        <Badge variant="default" className="flex items-center gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Enabled
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Status Information */}
                <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                        <p className="font-medium mb-1">How it works</p>
                        <p className="text-muted-foreground">
                            Push notifications allow you to receive important updates from AgroBridge even when you're not actively using the app. 
                            You'll get notified about orders, farm alerts, and other important events.
                        </p>
                    </div>
                </div>

                {/* Permission Status */}
                <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                        {permission === 'granted' ? (
                            <CheckCircle className="h-5 w-5 text-green-500" />
                        ) : permission === 'denied' ? (
                            <XCircle className="h-5 w-5 text-red-500" />
                        ) : (
                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                        )}
                        <div>
                            <p className="text-sm font-medium">Browser Permission</p>
                            <p className="text-xs text-muted-foreground capitalize">
                                {permission === 'default' ? 'Not requested' : permission}
                            </p>
                        </div>
                    </div>
                    <Badge 
                        variant={permission === 'granted' ? 'default' : permission === 'denied' ? 'destructive' : 'secondary'}
                        className="capitalize"
                    >
                        {permission}
                    </Badge>
                </div>

                {/* Permission Denied Alert */}
                {permission === 'denied' && (
                    <Alert variant="destructive">
                        <XCircle className="h-4 w-4" />
                        <AlertDescription>
                            You have blocked notifications for this site. To enable them, please update your browser settings and allow notifications for AgroBridge.
                        </AlertDescription>
                    </Alert>
                )}

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-2">
                    {!isEnabled ? (
                        <Button
                            onClick={handleEnable}
                            disabled={isProcessing || permission === 'denied'}
                            className="flex-1"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Enabling...
                                </>
                            ) : (
                                <>
                                    <Bell className="h-4 w-4 mr-2" />
                                    Enable Push Notifications
                                </>
                            )}
                        </Button>
                    ) : (
                        <>
                            <Button
                                variant="outline"
                                onClick={handleTest}
                                disabled={isProcessing}
                                className="flex-1"
                            >
                                <Bell className="h-4 w-4 mr-2" />
                                Send Test Notification
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={handleDisable}
                                disabled={isProcessing}
                                className="flex-1"
                            >
                                {isProcessing ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Disabling...
                                    </>
                                ) : (
                                    <>
                                        <BellOff className="h-4 w-4 mr-2" />
                                        Disable Push Notifications
                                    </>
                                )}
                            </Button>
                        </>
                    )}
                </div>

                {/* Additional Info */}
                {isEnabled && (
                    <p className="text-xs text-muted-foreground">
                        Push notifications are active. You can disable them at any time from this page or your browser settings.
                    </p>
                )}
            </CardContent>
        </Card>
    );
};

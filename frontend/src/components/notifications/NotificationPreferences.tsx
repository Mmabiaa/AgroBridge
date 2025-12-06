/**
 * Notification Preferences Component
 * Allows users to configure notification settings
 */
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { useNotificationPreferences, useUpdatePreferences } from '@/api/hooks/useNotifications';
import { toast } from 'sonner';
import { 
    Bell, 
    Mail, 
    MessageSquare, 
    Smartphone,
    Clock,
    Save,
    Loader2
} from 'lucide-react';
import type { NotificationPreferences as NotificationPreferencesType } from '@/api/services/notifications.service';

export const NotificationPreferences: React.FC = () => {
    const { data: preferences, isLoading, error } = useNotificationPreferences();
    const updatePreferences = useUpdatePreferences();

    const [localPreferences, setLocalPreferences] = useState<NotificationPreferencesType | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    // Initialize local state when preferences are loaded
    useEffect(() => {
        if (preferences) {
            setLocalPreferences(preferences);
        }
    }, [preferences]);

    const handleChannelToggle = (channel: keyof Pick<NotificationPreferencesType, 'email_notifications' | 'sms_notifications' | 'push_notifications' | 'in_app_notifications'>) => {
        if (!localPreferences) return;
        
        setLocalPreferences({
            ...localPreferences,
            [channel]: !localPreferences[channel],
        });
        setHasChanges(true);
    };

    const handleCategoryToggle = (category: keyof NotificationPreferencesType['notification_categories']) => {
        if (!localPreferences) return;
        
        setLocalPreferences({
            ...localPreferences,
            notification_categories: {
                ...localPreferences.notification_categories,
                [category]: !localPreferences.notification_categories[category],
            },
        });
        setHasChanges(true);
    };

    const handleQuietHoursToggle = () => {
        if (!localPreferences) return;
        
        setLocalPreferences({
            ...localPreferences,
            quiet_hours: {
                ...localPreferences.quiet_hours,
                enabled: !localPreferences.quiet_hours.enabled,
            },
        });
        setHasChanges(true);
    };

    const handleQuietHoursChange = (field: 'start_time' | 'end_time', value: string) => {
        if (!localPreferences) return;
        
        setLocalPreferences({
            ...localPreferences,
            quiet_hours: {
                ...localPreferences.quiet_hours,
                [field]: value,
            },
        });
        setHasChanges(true);
    };

    const handleSave = async () => {
        if (!localPreferences) return;

        try {
            await updatePreferences.mutateAsync(localPreferences);
            setHasChanges(false);
            toast.success('Preferences saved', {
                description: 'Your notification preferences have been updated successfully.',
            });
        } catch (error) {
            console.error('Error saving preferences:', error);
            toast.error('Failed to save preferences', {
                description: 'Please try again later.',
            });
        }
    };

    const handleReset = () => {
        if (preferences) {
            setLocalPreferences(preferences);
            setHasChanges(false);
        }
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardContent className="py-12">
                    <div className="text-center text-muted-foreground">
                        <p className="font-medium">Failed to load preferences</p>
                        <p className="text-sm mt-1">Please try again later</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!localPreferences) {
        return null;
    }

    return (
        <div className="space-y-6">
            {/* Notification Channels */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Bell className="h-5 w-5" />
                        Notification Channels
                    </CardTitle>
                    <CardDescription>
                        Choose how you want to receive notifications
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Bell className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <Label htmlFor="in-app">In-App Notifications</Label>
                                <p className="text-sm text-muted-foreground">
                                    Receive notifications within the application
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="in-app"
                            checked={localPreferences.in_app_notifications}
                            onCheckedChange={() => handleChannelToggle('in_app_notifications')}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Smartphone className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <Label htmlFor="push">Push Notifications</Label>
                                <p className="text-sm text-muted-foreground">
                                    Receive push notifications on your device
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="push"
                            checked={localPreferences.push_notifications}
                            onCheckedChange={() => handleChannelToggle('push_notifications')}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Mail className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <Label htmlFor="email">Email Notifications</Label>
                                <p className="text-sm text-muted-foreground">
                                    Receive notifications via email
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="email"
                            checked={localPreferences.email_notifications}
                            onCheckedChange={() => handleChannelToggle('email_notifications')}
                        />
                    </div>

                    <Separator />

                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <MessageSquare className="h-5 w-5 text-muted-foreground" />
                            <div>
                                <Label htmlFor="sms">SMS Notifications</Label>
                                <p className="text-sm text-muted-foreground">
                                    Receive notifications via SMS
                                </p>
                            </div>
                        </div>
                        <Switch
                            id="sms"
                            checked={localPreferences.sms_notifications}
                            onCheckedChange={() => handleChannelToggle('sms_notifications')}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Notification Categories */}
            <Card>
                <CardHeader>
                    <CardTitle>Notification Categories</CardTitle>
                    <CardDescription>
                        Choose which types of notifications you want to receive
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {Object.entries(localPreferences.notification_categories).map(([category, enabled]) => (
                        <div key={category}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor={category} className="capitalize">
                                        {category.replace('_', ' ')} Notifications
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        {getCategoryDescription(category)}
                                    </p>
                                </div>
                                <Switch
                                    id={category}
                                    checked={enabled}
                                    onCheckedChange={() => handleCategoryToggle(category as keyof NotificationPreferencesType['notification_categories'])}
                                />
                            </div>
                            {category !== 'financial' && <Separator className="mt-4" />}
                        </div>
                    ))}
                </CardContent>
            </Card>

            {/* Quiet Hours */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Quiet Hours
                    </CardTitle>
                    <CardDescription>
                        Set a time range when you don't want to receive notifications
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="quiet-hours">Enable Quiet Hours</Label>
                        <Switch
                            id="quiet-hours"
                            checked={localPreferences.quiet_hours.enabled}
                            onCheckedChange={handleQuietHoursToggle}
                        />
                    </div>

                    {localPreferences.quiet_hours.enabled && (
                        <>
                            <Separator />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start-time">Start Time</Label>
                                    <Input
                                        id="start-time"
                                        type="time"
                                        value={localPreferences.quiet_hours.start_time}
                                        onChange={(e) => handleQuietHoursChange('start_time', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end-time">End Time</Label>
                                    <Input
                                        id="end-time"
                                        type="time"
                                        value={localPreferences.quiet_hours.end_time}
                                        onChange={(e) => handleQuietHoursChange('end_time', e.target.value)}
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Save/Reset Buttons */}
            {hasChanges && (
                <div className="flex items-center justify-end gap-2">
                    <Button
                        variant="outline"
                        onClick={handleReset}
                        disabled={updatePreferences.isPending}
                    >
                        Reset
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={updatePreferences.isPending}
                    >
                        {updatePreferences.isPending ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Saving...
                            </>
                        ) : (
                            <>
                                <Save className="h-4 w-4 mr-2" />
                                Save Changes
                            </>
                        )}
                    </Button>
                </div>
            )}
        </div>
    );
};

// Helper function to get category descriptions
function getCategoryDescription(category: string): string {
    const descriptions: Record<string, string> = {
        system: 'System updates and maintenance notifications',
        farm: 'Farm management and crop-related notifications',
        marketplace: 'Product listings and order notifications',
        ai: 'AI assistant recommendations and insights',
        iot: 'IoT device alerts and sensor data notifications',
        community: 'Community posts and social interactions',
        financial: 'Financial records and budget notifications',
    };
    return descriptions[category] || 'Notifications for this category';
}

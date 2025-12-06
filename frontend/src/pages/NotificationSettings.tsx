/**
 * Notification Settings Page
 * Dedicated page for managing notification preferences
 */
import React from 'react';
import { Button } from '@/components/ui/button';
import { Bell, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { NotificationPreferences } from '@/components/notifications/NotificationPreferences';
import { PushNotificationSetup } from '@/components/notifications/PushNotificationSetup';

const NotificationSettings: React.FC = () => {
    const navigate = useNavigate();

    return (
        <div className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Header */}
            <div className="mb-6">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate('/settings')}
                    className="mb-4"
                >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Settings
                </Button>
                
                <div className="flex items-center gap-3 mb-2">
                    <Bell className="h-8 w-8 text-primary" />
                    <h1 className="text-3xl font-bold">Notification Settings</h1>
                </div>
                <p className="text-muted-foreground">
                    Manage how and when you receive notifications from AgroBridge
                </p>
            </div>

            <div className="space-y-6">
                {/* Push Notification Setup */}
                <PushNotificationSetup />

                {/* Notification Preferences Component */}
                <NotificationPreferences />
            </div>
        </div>
    );
};

export default NotificationSettings;


import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Settings as SettingsIcon, 
  User, 
  Bell, 
  Shield, 
  Download, 
  MapPin,
  Smartphone,
  Globe,
  Save,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

// Mock user data
const mockUserData = {
  id: 'user123',
  fullName: 'Kwame Addo',
  email: 'kwame.addo@email.com',
  phone: '+233 24 123 4567',
  location: 'Kumasi, Ashanti Region',
  farmSize: 'Medium (1-5 acres)',
  experience: 'intermediate',
  crops: ['Tomatoes', 'Maize', 'Yam'],
  language: 'en',
  timezone: 'Africa/Accra'
};

// Mock settings data
const mockSettings = {
  notifications: {
    push: true,
    email: true,
    sms: false,
    weather: true,
    market: true,
    disease: true
  },
  app: {
    offlineMode: false,
    autoSync: true,
    locationServices: true,
    darkMode: false
  },
  privacy: {
    shareData: true,
    analytics: true,
    marketing: false
  }
};

export default function Settings() {
  const [userData, setUserData] = useState(mockUserData);
  const [settings, setSettings] = useState(mockSettings);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Simulate loading user data
  useEffect(() => {
    const loadUserData = async () => {
      setIsLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIsLoading(false);
    };
    loadUserData();
  }, []);

  const handleSaveProfile = async () => {
    setSaveStatus('saving');
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const handleSaveSettings = async () => {
    setSaveStatus('saving');
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaveStatus('saved');
    setTimeout(() => setSaveStatus('idle'), 3000);
  };

  const exportData = async (format: 'csv' | 'pdf') => {
    setIsLoading(true);
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsLoading(false);
    
    // Simulate file download
    const link = document.createElement('a');
    link.href = `data:text/${format === 'csv' ? 'csv' : 'pdf'};charset=utf-8,${encodeURIComponent('Mock farm data export')}`;
    link.download = `agrobridge-data.${format}`;
    link.click();
  };

  const getSaveButtonContent = () => {
    switch (saveStatus) {
      case 'saving':
        return (
          <>
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Saving...
          </>
        );
      case 'saved':
        return (
          <>
            <CheckCircle className="h-4 w-4 mr-2" />
            Saved!
          </>
        );
      case 'error':
        return (
          <>
            <AlertCircle className="h-4 w-4 mr-2" />
            Error
          </>
        );
      default:
        return (
          <>
            <Save className="h-4 w-4 mr-2" />
            Save Changes
          </>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-8 px-4">
      <div className="container mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
            <SettingsIcon className="h-8 w-8 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        {/* Profile Settings */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  value={userData.fullName}
                  onChange={(e) => setUserData(prev => ({ ...prev, fullName: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={userData.email}
                  onChange={(e) => setUserData(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={userData.phone}
                  onChange={(e) => setUserData(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="farmSize">Farm Size</Label>
                <Select value={userData.farmSize} onValueChange={(value) => setUserData(prev => ({ ...prev, farmSize: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Small (< 1 acre)">Small (&lt; 1 acre)</SelectItem>
                    <SelectItem value="Medium (1-5 acres)">Medium (1-5 acres)</SelectItem>
                    <SelectItem value="Large (5+ acres)">Large (5+ acres)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="location"
                  value={userData.location}
                  onChange={(e) => setUserData(prev => ({ ...prev, location: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Label>Crops:</Label>
              <div className="flex flex-wrap gap-1">
                {userData.crops.map((crop) => (
                  <Badge key={crop} variant="secondary" className="text-xs">
                    {crop}
                  </Badge>
                ))}
              </div>
            </div>

            <Button 
              onClick={handleSaveProfile}
              disabled={saveStatus === 'saving'}
              className="w-full md:w-auto"
            >
              {getSaveButtonContent()}
            </Button>
          </CardContent>
        </Card>

        {/* App Settings */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-5 w-5" />
              App Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="offline-mode">Offline Mode</Label>
                <p className="text-sm text-muted-foreground">Use app without internet connection</p>
              </div>
              <Switch
                id="offline-mode"
                checked={settings.app.offlineMode}
                onCheckedChange={(checked) => setSettings(prev => ({ 
                  ...prev, 
                  app: { ...prev.app, offlineMode: checked } 
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="auto-sync">Auto Sync</Label>
                <p className="text-sm text-muted-foreground">Automatically sync data when online</p>
              </div>
              <Switch
                id="auto-sync"
                checked={settings.app.autoSync}
                onCheckedChange={(checked) => setSettings(prev => ({ 
                  ...prev, 
                  app: { ...prev.app, autoSync: checked } 
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="location-services">Location Services</Label>
                <p className="text-sm text-muted-foreground">Use your location for weather and market data</p>
              </div>
              <Switch
                id="location-services"
                checked={settings.app.locationServices}
                onCheckedChange={(checked) => setSettings(prev => ({ 
                  ...prev, 
                  app: { ...prev.app, locationServices: checked } 
                }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select value={userData.language} onValueChange={(value) => setUserData(prev => ({ ...prev, language: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="tw">Twi</SelectItem>
                  <SelectItem value="ha">Hausa</SelectItem>
                  <SelectItem value="yo">Yoruba</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notifications
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="push-notifications">Push Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive notifications on your device</p>
              </div>
              <Switch
                id="push-notifications"
                checked={settings.notifications.push}
                onCheckedChange={(checked) => setSettings(prev => ({ 
                  ...prev, 
                  notifications: { ...prev.notifications, push: checked } 
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-notifications">Email Notifications</Label>
                <p className="text-sm text-muted-foreground">Receive updates via email</p>
              </div>
              <Switch
                id="email-notifications"
                checked={settings.notifications.email}
                onCheckedChange={(checked) => setSettings(prev => ({ 
                  ...prev, 
                  notifications: { ...prev.notifications, email: checked } 
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="weather-alerts">Weather Alerts</Label>
                <p className="text-sm text-muted-foreground">Get notified about weather changes</p>
              </div>
              <Switch
                id="weather-alerts"
                checked={settings.notifications.weather}
                onCheckedChange={(checked) => setSettings(prev => ({ 
                  ...prev, 
                  notifications: { ...prev.notifications, weather: checked } 
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="market-updates">Market Updates</Label>
                <p className="text-sm text-muted-foreground">Receive crop price notifications</p>
              </div>
              <Switch
                id="market-updates"
                checked={settings.notifications.market}
                onCheckedChange={(checked) => setSettings(prev => ({ 
                  ...prev, 
                  notifications: { ...prev.notifications, market: checked } 
                }))}
              />
            </div>

            <Button 
              onClick={handleSaveSettings}
              disabled={saveStatus === 'saving'}
              className="w-full md:w-auto"
            >
              {getSaveButtonContent()}
            </Button>
          </CardContent>
        </Card>

        {/* Data Management */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Export Your Data</h4>
              <p className="text-muted-foreground text-sm mb-4">Download your farm data for backup or analysis</p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => exportData('csv')}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export as CSV
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => exportData('pdf')}
                  disabled={isLoading}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export as PDF
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Security
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="share-data">Share Data for Research</Label>
                <p className="text-sm text-muted-foreground">Help improve farming practices (anonymous)</p>
              </div>
              <Switch
                id="share-data"
                checked={settings.privacy.shareData}
                onCheckedChange={(checked) => setSettings(prev => ({ 
                  ...prev, 
                  privacy: { ...prev.privacy, shareData: checked } 
                }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="analytics">Analytics</Label>
                <p className="text-sm text-muted-foreground">Help us improve the app</p>
              </div>
              <Switch
                id="analytics"
                checked={settings.privacy.analytics}
                onCheckedChange={(checked) => setSettings(prev => ({ 
                  ...prev, 
                  privacy: { ...prev.privacy, analytics: checked } 
                }))}
              />
            </div>

            <div className="pt-4 border-t">
              <Button variant="outline" className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
                Delete Account
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

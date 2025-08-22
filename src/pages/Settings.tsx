
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
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
  AlertCircle,
  Mic,
  Key,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  RefreshCw,
  Trash2,
  Plus,
  X,
  Info
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

// Enhanced user data interface
interface EnhancedUserData {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  location: string;
  farmSize?: string;
  experience?: string;
  crops?: string[];
  language: string;
  timezone: string;
  bio?: string;
  organization?: string;
  role: string;
}

// Enhanced settings interface
interface EnhancedSettings {
  notifications: {
    push: boolean;
    email: boolean;
    sms: boolean;
    weather: boolean;
    market: boolean;
    disease: boolean;
    voice: boolean;
    community: boolean;
  };
  app: {
    offlineMode: boolean;
    autoSync: boolean;
    locationServices: boolean;
    darkMode: boolean;
    voiceCommands: boolean;
    accessibility: boolean;
  };
  privacy: {
    shareData: boolean;
    analytics: boolean;
    marketing: boolean;
    profileVisibility: 'public' | 'private' | 'community';
  };
  voice: {
    enabled: boolean;
    language: string;
    sensitivity: 'low' | 'medium' | 'high';
    wakeWord: string;
    autoListen: boolean;
    feedback: boolean;
  };
}

export default function Settings() {
  const { user, hasPermission, updateUserProfile, updateUserRole } = useAuth();
  const [userData, setUserData] = useState<EnhancedUserData | null>(null);
  const [settings, setSettings] = useState<EnhancedSettings | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [showPassword, setShowPassword] = useState(false);
  const [newCrop, setNewCrop] = useState('');

  // Initialize user data and settings based on current user
  useEffect(() => {
    if (user) {
      const enhancedUserData: EnhancedUserData = {
        id: user.id,
        fullName: user.name,
        email: user.email,
        phone: '+233 24 123 4567', // Default phone
        location: 'Kumasi, Ashanti Region', // Default location
        farmSize: user.role === 'farmer' || user.role === 'poultry_keeper' ? 'Medium (1-5 acres)' : undefined,
        experience: user.role === 'farmer' || user.role === 'poultry_keeper' ? 'intermediate' : undefined,
        crops: user.role === 'farmer' || user.role === 'poultry_keeper' ? ['Tomatoes', 'Maize', 'Yam'] : undefined,
        language: 'en',
        timezone: 'Africa/Accra',
        bio: user.role === 'ngo' ? 'Community development and agricultural support organization' : undefined,
        organization: user.role === 'ngo' ? 'AgroBridge NGO' : undefined,
        role: user.role
      };

      const enhancedSettings: EnhancedSettings = {
        notifications: {
          push: true,
          email: true,
          sms: false,
          weather: true,
          market: true,
          disease: user.role === 'farmer' || user.role === 'poultry_keeper',
          voice: hasPermission('use_voice_commands'),
          community: true
        },
        app: {
          offlineMode: false,
          autoSync: true,
          locationServices: true,
          darkMode: false,
          voiceCommands: hasPermission('use_voice_commands'),
          accessibility: true
        },
        privacy: {
          shareData: true,
          analytics: true,
          marketing: false,
          profileVisibility: 'community'
        },
        voice: {
          enabled: hasPermission('use_voice_commands'),
          language: 'en',
          sensitivity: 'medium',
          wakeWord: 'Hey Agro',
          autoListen: false,
          feedback: true
        }
      };

      setUserData(enhancedUserData);
      setSettings(enhancedSettings);
    }
  }, [user, hasPermission]);

  const handleSaveProfile = async () => {
    if (!userData) return;
    
    setSaveStatus('saving');
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Update user profile in context
      updateUserProfile({
        fullName: userData.fullName,
        phone: userData.phone,
        location: userData.location,
        farmSize: userData.farmSize,
        experience: userData.experience,
        crops: userData.crops,
        bio: userData.bio,
        organization: userData.organization
      });
      
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleSaveSettings = async () => {
    if (!settings) return;
    
    setSaveStatus('saving');
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleSaveVoiceSettings = async () => {
    if (!settings) return;
    
    setSaveStatus('saving');
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
    } catch (error) {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const addCrop = () => {
    if (newCrop.trim() && userData) {
      setUserData(prev => ({
        ...prev!,
        crops: [...(prev!.crops || []), newCrop.trim()]
      }));
      setNewCrop('');
    }
  };

  const removeCrop = (cropToRemove: string) => {
    if (userData) {
      setUserData(prev => ({
        ...prev!,
        crops: prev!.crops?.filter(crop => crop !== cropToRemove) || []
      }));
    }
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

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      farmer: 'Farmer',
      buyer: 'Buyer',
      ngo: 'NGO Representative',
      poultry_keeper: 'Poultry Keeper',
      admin: 'Administrator'
    };
    return roleNames[role] || role;
  };

  if (!user || !userData || !settings) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
        <div className="container mx-auto p-4 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
        <div className="container mx-auto p-4 max-w-7xl">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
      <div className="container mx-auto p-4 max-w-7xl">
        {/* Header */}
        <div className="text-center space-y-4 mb-6">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <SettingsIcon className="h-8 w-8 text-primary" />
            Settings
          </h1>
          <p className="text-muted-foreground text-lg">Manage your account and preferences</p>
          <div className="flex items-center justify-center gap-2">
            <Badge variant="outline" className="capitalize">
              {getRoleDisplayName(user.role)} Role
            </Badge>
            <Badge variant="secondary">
              {user.permissions.length} Permissions
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Settings Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Profile Settings */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
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
                      onChange={(e) => setUserData(prev => ({ ...prev!, fullName: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={userData.email}
                      disabled
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={userData.phone}
                      onChange={(e) => setUserData(prev => ({ ...prev!, phone: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="location">Location</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="location"
                        value={userData.location}
                        onChange={(e) => setUserData(prev => ({ ...prev!, location: e.target.value }))}
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>

                {/* Role-specific fields */}
                {(user.role === 'farmer' || user.role === 'poultry_keeper') && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="farmSize">Farm Size</Label>
                        <Select value={userData.farmSize} onValueChange={(value) => setUserData(prev => ({ ...prev!, farmSize: value }))}>
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
                      <div className="space-y-2">
                        <Label htmlFor="experience">Experience Level</Label>
                        <Select value={userData.experience} onValueChange={(value) => setUserData(prev => ({ ...prev!, experience: value }))}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="beginner">Beginner</SelectItem>
                            <SelectItem value="intermediate">Intermediate</SelectItem>
                            <SelectItem value="advanced">Advanced</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Crops</Label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {userData.crops?.map((crop) => (
                          <Badge key={crop} variant="secondary" className="text-xs flex items-center gap-1">
                            {crop}
                            <button
                              onClick={() => removeCrop(crop)}
                              className="ml-1 hover:text-destructive"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add new crop"
                          value={newCrop}
                          onChange={(e) => setNewCrop(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addCrop()}
                        />
                        <Button onClick={addCrop} size="sm">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                )}

                {user.role === 'ngo' && (
                  <div className="space-y-2">
                    <Label htmlFor="organization">Organization</Label>
                    <Input
                      id="organization"
                      value={userData.organization || ''}
                      onChange={(e) => setUserData(prev => ({ ...prev!, organization: e.target.value }))}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell us about yourself..."
                    value={userData.bio || ''}
                    onChange={(e) => setUserData(prev => ({ ...prev!, bio: e.target.value }))}
                    rows={3}
                  />
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

            {/* Voice Commands Settings - Only for users with permission */}
            {hasPermission('use_voice_commands') && (
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Mic className="h-5 w-5" />
                    Voice Commands Settings
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Configure your voice control preferences and settings
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="voice-enabled">Enable Voice Commands</Label>
                      <p className="text-sm text-muted-foreground">Use voice to control the application</p>
                    </div>
                    <Switch
                      id="voice-enabled"
                      checked={settings.voice.enabled}
                      onCheckedChange={(checked) => setSettings(prev => ({ 
                        ...prev!, 
                        voice: { ...prev!.voice, enabled: checked } 
                      }))}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="voice-language">Voice Language</Label>
                      <Select value={settings.voice.language} onValueChange={(value) => setSettings(prev => ({ 
                        ...prev!, 
                        voice: { ...prev!.voice, language: value } 
                      }))}>
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
                    <div className="space-y-2">
                      <Label htmlFor="voice-sensitivity">Voice Sensitivity</Label>
                      <Select value={settings.voice.sensitivity} onValueChange={(value: 'low' | 'medium' | 'high') => setSettings(prev => ({ 
                        ...prev!, 
                        voice: { ...prev!.voice, sensitivity: value } 
                      }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="wake-word">Wake Word</Label>
                    <Input
                      id="wake-word"
                      placeholder="e.g., Hey Agro"
                      value={settings.voice.wakeWord}
                      onChange={(e) => setSettings(prev => ({ 
                        ...prev!, 
                        voice: { ...prev!.voice, wakeWord: e.target.value } 
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="auto-listen">Auto-Listen Mode</Label>
                      <p className="text-sm text-muted-foreground">Automatically start listening for commands</p>
                    </div>
                    <Switch
                      id="auto-listen"
                      checked={settings.voice.autoListen}
                      onCheckedChange={(checked) => setSettings(prev => ({ 
                        ...prev!, 
                        voice: { ...prev!.voice, autoListen: checked } 
                      }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="voice-feedback">Voice Feedback</Label>
                      <p className="text-sm text-muted-foreground">Get spoken confirmation of actions</p>
                    </div>
                    <Switch
                      id="voice-feedback"
                      checked={settings.voice.feedback}
                      onCheckedChange={(checked) => setSettings(prev => ({ 
                        ...prev!, 
                        voice: { ...prev!.voice, feedback: checked } 
                      }))}
                    />
                  </div>

                  <Button 
                    onClick={handleSaveVoiceSettings}
                    disabled={saveStatus === 'saving'}
                    className="w-full md:w-auto"
                  >
                    {getSaveButtonContent()}
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* App Settings */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
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
                      ...prev!, 
                      app: { ...prev!.app, offlineMode: checked } 
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
                      ...prev!, 
                      app: { ...prev!.app, autoSync: checked } 
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
                      ...prev!, 
                      app: { ...prev!.app, locationServices: checked } 
                    }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="voice-commands">Voice Commands</Label>
                    <p className="text-sm text-muted-foreground">Enable voice control features</p>
                  </div>
                  <Switch
                    id="voice-commands"
                    checked={settings.app.voiceCommands}
                    disabled={!hasPermission('use_voice_commands')}
                    onCheckedChange={(checked) => setSettings(prev => ({ 
                      ...prev!, 
                      app: { ...prev!.app, voiceCommands: checked } 
                    }))}
                  />
                  {!hasPermission('use_voice_commands') && (
                    <p className="text-xs text-muted-foreground">Requires voice commands permission</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Interface Language</Label>
                  <Select value={userData.language} onValueChange={(value) => setUserData(prev => ({ ...prev!, language: value }))}>
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

            {/* Notifications Settings */}
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Bell className="h-5 w-5" />
                  Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="push-notifications">Push Notifications</Label>
                      <p className="text-sm text-muted-foreground">In-app notifications</p>
                    </div>
                    <Switch
                      id="push-notifications"
                      checked={settings.notifications.push}
                      onCheckedChange={(checked) => setSettings(prev => ({ 
                        ...prev!, 
                        notifications: { ...prev!.notifications, push: checked } 
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="email-notifications">Email Notifications</Label>
                      <p className="text-sm text-muted-foreground">Email alerts</p>
                    </div>
                    <Switch
                      id="email-notifications"
                      checked={settings.notifications.email}
                      onCheckedChange={(checked) => setSettings(prev => ({ 
                        ...prev!, 
                        notifications: { ...prev!.notifications, email: checked } 
                      }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="weather-notifications">Weather Alerts</Label>
                      <p className="text-sm text-muted-foreground">Weather updates</p>
                    </div>
                    <Switch
                      id="weather-notifications"
                      checked={settings.notifications.weather}
                      onCheckedChange={(checked) => setSettings(prev => ({ 
                        ...prev!, 
                        notifications: { ...prev!.notifications, weather: checked } 
                      }))}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="market-notifications">Market Updates</Label>
                      <p className="text-sm text-muted-foreground">Price changes</p>
                    </div>
                    <Switch
                      id="market-notifications"
                      checked={settings.notifications.market}
                      onCheckedChange={(checked) => setSettings(prev => ({ 
                        ...prev!, 
                        notifications: { ...prev!.notifications, market: checked } 
                      }))}
                    />
                  </div>
                </div>

                {(user.role === 'farmer' || user.role === 'poultry_keeper') && (
                  <div className="flex items-center justify-between">
                    <div>
                      <Label htmlFor="disease-notifications">Disease Alerts</Label>
                      <p className="text-sm text-muted-foreground">Crop disease warnings</p>
                    </div>
                    <Switch
                      id="disease-notifications"
                      checked={settings.notifications.disease}
                      onCheckedChange={(checked) => setSettings(prev => ({ 
                        ...prev!, 
                        notifications: { ...prev!.notifications, disease: checked } 
                      }))}
                    />
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="voice-notifications">Voice Notifications</Label>
                    <p className="text-sm text-muted-foreground">Spoken alerts</p>
                  </div>
                  <Switch
                    id="voice-notifications"
                    checked={settings.notifications.voice}
                    disabled={!hasPermission('use_voice_commands')}
                    onCheckedChange={(checked) => setSettings(prev => ({ 
                      ...prev!, 
                      notifications: { ...prev!.notifications, voice: checked } 
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
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Download className="h-5 w-5" />
                  Data Management
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Export Your Data</h4>
                  <p className="text-muted-foreground text-sm mb-4">Download your data for backup or analysis</p>
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
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Shield className="h-5 w-5" />
                  Privacy & Security
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="profile-visibility">Profile Visibility</Label>
                  <Select value={settings.privacy.profileVisibility} onValueChange={(value: 'public' | 'private' | 'community') => setSettings(prev => ({ 
                    ...prev!, 
                    privacy: { ...prev!.privacy, profileVisibility: value } 
                  }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="public">Public</SelectItem>
                      <SelectItem value="community">Community Only</SelectItem>
                      <SelectItem value="private">Private</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label htmlFor="share-data">Share Data for Research</Label>
                    <p className="text-sm text-muted-foreground">Help improve farming practices (anonymous)</p>
                  </div>
                  <Switch
                    id="share-data"
                    checked={settings.privacy.shareData}
                    onCheckedChange={(checked) => setSettings(prev => ({ 
                      ...prev!, 
                      privacy: { ...prev!.privacy, shareData: checked } 
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
                      ...prev!, 
                      privacy: { ...prev!.privacy, analytics: checked } 
                    }))}
                  />
                </div>
                
                <Separator />
                
                <div className="pt-4">
                  <Button variant="outline" className="w-full text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 h-[calc(100vh-200px)]">
            <div className="space-y-6">
              {/* User Info */}
              <Card className="shadow-soft w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <User className="h-5 w-5" />
                    Account Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Role</span>
                      <Badge variant="secondary" className="capitalize">
                        {getRoleDisplayName(user.role)}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        Active
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Member Since</span>
                      <span className="text-sm">Jan 2024</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Last Login</span>
                      <span className="text-sm">Today</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Permissions */}
              <Card className="shadow-soft w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <Key className="h-5 w-5" />
                    Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Total Permissions</span>
                      <Badge variant="outline">{user.permissions.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {user.permissions.slice(0, 5).map((permission) => (
                        <Badge key={permission} variant="secondary" className="text-xs w-full justify-center">
                          {permission.replace(/_/g, ' ')}
                        </Badge>
                      ))}
                      {user.permissions.length > 5 && (
                        <p className="text-xs text-muted-foreground text-center">
                          +{user.permissions.length - 5} more
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="shadow-soft w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <RefreshCw className="h-5 w-5" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                      onClick={() => exportData('csv')}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Data
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                    >
                      <Globe className="h-4 w-4 mr-2" />
                      Change Language
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start"
                    >
                      <MapPin className="h-4 w-4 mr-2" />
                      Update Location
                    </Button>
                    {hasPermission('use_voice_commands') && (
                      <Button 
                        variant="outline" 
                        className="w-full justify-start"
                      >
                        <Mic className="h-4 w-4 mr-2" />
                        Test Voice Commands
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* System Info */}
              <Card className="shadow-soft w-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-xl">
                    <SettingsIcon className="h-5 w-5" />
                    System Info
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Version</span>
                      <span>1.2.0</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Build</span>
                      <span>2024.01.15</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platform</span>
                      <span>Web</span>
                    </div>
                    <div className="pt-3 border-t">
                      <Button variant="outline" className="w-full text-sm">
                        Check for Updates
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

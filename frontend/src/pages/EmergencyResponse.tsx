
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  AlertTriangle, 
  Phone, 
  Shield, 
  MapPin, 
  Clock, 
  Users,
  FileText,
  Radio,
  Zap,
  Heart,
  Truck,
  Siren,
  MessageSquare,
  Bell
} from 'lucide-react';

const emergencyContacts = [
  { name: 'Fire Department', number: '999', type: 'fire', available: true },
  { name: 'Police Emergency', number: '199', type: 'police', available: true },
  { name: 'Medical Emergency', number: '112', type: 'medical', available: true },
  { name: 'Agricultural Extension Officer', number: '+234-801-234-5678', type: 'agricultural', available: true },
  { name: 'Veterinary Services', number: '+234-802-345-6789', type: 'veterinary', available: true },
  { name: 'Weather Alert Service', number: '+234-803-456-7890', type: 'weather', available: true }
];

const emergencyProtocols = [
  {
    title: 'Fire Emergency Protocol',
    icon: Zap,
    steps: [
      'Ensure personal safety first',
      'Call fire department immediately',
      'Evacuate livestock to safe area',
      'Turn off gas and electrical supplies',
      'Use fire extinguisher if safe to do so',
      'Document damages for insurance'
    ],
    priority: 'critical'
  },
  {
    title: 'Severe Weather Response',
    icon: Shield,
    steps: [
      'Monitor weather alerts continuously',
      'Secure loose equipment and materials',
      'Move livestock to shelter',
      'Check drainage systems',
      'Prepare emergency supplies',
      'Stay indoors during severe conditions'
    ],
    priority: 'high'
  },
  {
    title: 'Livestock Health Emergency',
    icon: Heart,
    steps: [
      'Isolate affected animals immediately',
      'Contact veterinary services',
      'Document symptoms and timeline',
      'Prevent spread to other animals',
      'Follow quarantine procedures',
      'Report to agricultural authorities'
    ],
    priority: 'high'
  },
  {
    title: 'Crop Disease Outbreak',
    icon: AlertTriangle,
    steps: [
      'Identify and document affected areas',
      'Contact agricultural extension officer',
      'Implement quarantine measures',
      'Apply appropriate treatments',
      'Monitor spread progression',
      'Report to relevant authorities'
    ],
    priority: 'medium'
  }
];

const activeAlerts = [
  {
    type: 'weather',
    title: 'Heavy Rainfall Warning',
    description: 'Expected 50-80mm rainfall in next 6 hours',
    severity: 'high',
    issued: '2 hours ago',
    expires: '6 hours',
    area: 'Northern Region'
  },
  {
    type: 'pest',
    title: 'Fall Armyworm Alert',
    description: 'Increased activity reported in nearby farms',
    severity: 'medium',
    issued: '1 day ago',
    expires: '3 days',
    area: 'Central Plains'
  }
];

const communityAlerts = [
  { message: 'Road closure on Main Farm Road due to flooding', time: '30 min ago', priority: 'high' },
  { message: 'Veterinary mobile unit available in area tomorrow', time: '2 hours ago', priority: 'medium' },
  { message: 'Community meeting scheduled for emergency preparedness', time: '1 day ago', priority: 'low' }
];

export default function EmergencyResponse() {
  const [activeTab, setActiveTab] = useState('contacts');

  const getContactIcon = (type: string) => {
    switch (type) {
      case 'fire': return <Zap className="h-5 w-5 text-red-500" />;
      case 'police': return <Shield className="h-5 w-5 text-blue-500" />;
      case 'medical': return <Heart className="h-5 w-5 text-red-500" />;
      case 'agricultural': return <FileText className="h-5 w-5 text-green-500" />;
      case 'veterinary': return <Heart className="h-5 w-5 text-purple-500" />;
      case 'weather': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <Phone className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-8 px-4">
      <div className="container mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold flex items-center justify-center gap-3">
            <Siren className="h-8 w-8 text-primary" />
            Emergency Response System
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Quick access to emergency services, protocols, and community alerts for farm safety
          </p>
        </div>

        {/* Emergency Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Button size="lg" className="h-20 bg-red-600 hover:bg-red-700 text-white">
            <div className="text-center">
              <Phone className="h-8 w-8 mx-auto mb-2" />
              <span className="text-lg font-bold">Call 999</span>
            </div>
          </Button>
          <Button size="lg" variant="outline" className="h-20 border-2 border-yellow-500 text-yellow-700">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2" />
              <span className="text-lg font-bold">Report Emergency</span>
            </div>
          </Button>
          <Button size="lg" variant="outline" className="h-20 border-2 border-blue-500 text-blue-700">
            <div className="text-center">
              <MapPin className="h-8 w-8 mx-auto mb-2" />
              <span className="text-lg font-bold">Share Location</span>
            </div>
          </Button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 border-b">
          {['contacts', 'protocols', 'alerts', 'community'].map((tab) => (
            <Button
              key={tab}
              variant={activeTab === tab ? "default" : "ghost"}
              onClick={() => setActiveTab(tab)}
              className="capitalize"
            >
              {tab}
            </Button>
          ))}
        </div>

        {/* Emergency Contacts */}
        {activeTab === 'contacts' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {emergencyContacts.map((contact, idx) => (
              <Card key={idx} className="shadow-soft">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getContactIcon(contact.type)}
                      <div>
                        <h3 className="font-semibold">{contact.name}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{contact.type} Emergency</p>
                      </div>
                    </div>
                    <Badge variant={contact.available ? "default" : "secondary"}>
                      {contact.available ? "Available" : "Unavailable"}
                    </Badge>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="text-2xl font-bold text-primary">{contact.number}</div>
                    <div className="flex gap-2">
                      <Button className="flex-1">
                        <Phone className="h-4 w-4 mr-2" />
                        Call Now
                      </Button>
                      <Button variant="outline">
                        <MessageSquare className="h-4 w-4 mr-2" />
                        SMS
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Emergency Protocols */}
        {activeTab === 'protocols' && (
          <div className="space-y-6">
            {emergencyProtocols.map((protocol, idx) => {
              const Icon = protocol.icon;
              return (
                <Card key={idx} className={`shadow-soft border-l-4 ${getSeverityColor(protocol.priority)}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Icon className="h-6 w-6" />
                      {protocol.title}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {protocol.priority} Priority
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <h4 className="font-semibold text-sm">Emergency Steps:</h4>
                      <ol className="space-y-2">
                        {protocol.steps.map((step, stepIdx) => (
                          <li key={stepIdx} className="flex items-start gap-3">
                            <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                              {stepIdx + 1}
                            </div>
                            <span className="text-sm">{step}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Active Alerts */}
        {activeTab === 'alerts' && (
          <div className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Active Weather & Agricultural Alerts
                </CardTitle>
                <CardDescription>Current warnings and advisories for your area</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeAlerts.map((alert, idx) => (
                  <div key={idx} className={`border-l-4 p-4 rounded-lg ${getSeverityColor(alert.severity)}`}>
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{alert.title}</h3>
                        <p className="text-sm text-muted-foreground">{alert.description}</p>
                      </div>
                      <Badge variant="secondary" className="capitalize">
                        {alert.severity}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs mt-3">
                      <div>
                        <p className="text-muted-foreground">Area</p>
                        <p className="font-medium">{alert.area}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Issued</p>
                        <p className="font-medium">{alert.issued}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Expires</p>
                        <p className="font-medium">{alert.expires}</p>
                      </div>
                      <div>
                        <Button size="sm" variant="outline">View Details</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Community Alerts */}
        {activeTab === 'community' && (
          <div className="space-y-6">
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Community Emergency Network
                </CardTitle>
                <CardDescription>Local alerts and community emergency information</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {communityAlerts.map((alert, idx) => (
                  <div key={idx} className="flex gap-3 p-3 bg-muted/50 rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      alert.priority === 'high' ? 'bg-red-500' : 
                      alert.priority === 'medium' ? 'bg-yellow-500' : 'bg-blue-500'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">{alert.time}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Emergency Preparedness</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" className="w-full justify-start">
                    <FileText className="h-4 w-4 mr-2" />
                    Emergency Kit Checklist
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Disaster Preparedness Guide
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <MapPin className="h-4 w-4 mr-2" />
                    Evacuation Routes
                  </Button>
                  <Button variant="outline" className="w-full justify-start">
                    <Radio className="h-4 w-4 mr-2" />
                    Emergency Radio Frequencies
                  </Button>
                </CardContent>
              </Card>

              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle>Quick Stats</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">2</div>
                    <p className="text-sm text-muted-foreground">Active Alerts</p>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span>Response Time</span>
                      <span>&lt; 5 minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Network Coverage</span>
                      <span>98% uptime</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Community Members</span>
                      <span>1,247 farmers</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

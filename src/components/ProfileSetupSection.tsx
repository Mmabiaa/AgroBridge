
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MapPin, Upload, Sprout, Wheat, ShoppingCart, Users } from 'lucide-react';

const roles = [
  { id: 'farmer', name: 'Farmer', icon: Sprout },
  { id: 'poultry', name: 'Poultry Keeper', icon: Wheat },
  { id: 'buyer', name: 'Buyer', icon: ShoppingCart },
  { id: 'ngo', name: 'NGO/Government', icon: Users }
];

const farmSizes = ['Small (< 1 acre)', 'Medium (1-5 acres)', 'Large (5+ acres)'];
const regions = ['Northern Ghana', 'Central Ghana', 'Southern Ghana', 'Eastern Ghana', 'Western Ghana'];
const crops = ['Maize', 'Rice', 'Cassava', 'Yam', 'Tomatoes', 'Onions', 'Cocoa', 'Plantain'];
const poultryTypes = ['Broilers', 'Layers', 'Local Chickens', 'Turkeys', 'Ducks', 'Guinea Fowl'];

export function ProfileSetupSection() {
  const [selectedRole, setSelectedRole] = useState('farmer');
  const [formData, setFormData] = useState({
    fullName: 'John Mensah',
    location: 'Kumasi',
    region: 'Central Ghana',
    farmSize: 'Medium (1-5 acres)',
    selectedCrops: ['Maize', 'Tomatoes'],
    selectedPoultry: ['Layers'],
    experience: 'intermediate',
    interests: '',
    organization: '',
    projectFocus: ''
  });

  const toggleCrop = (crop: string) => {
    setFormData(prev => ({
      ...prev,
      selectedCrops: prev.selectedCrops.includes(crop)
        ? prev.selectedCrops.filter(c => c !== crop)
        : [...prev.selectedCrops, crop]
    }));
  };

  const togglePoultry = (type: string) => {
    setFormData(prev => ({
      ...prev,
      selectedPoultry: prev.selectedPoultry.includes(type)
        ? prev.selectedPoultry.filter(p => p !== type)
        : [...prev.selectedPoultry, type]
    }));
  };

  return (
    <div className="space-y-6">
      {/* Role Selection */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Your Role</CardTitle>
          <CardDescription>How do you use AgroBridge?</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {roles.map((role) => {
              const Icon = role.icon;
              return (
                <Card
                  key={role.id}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-soft ${
                    selectedRole === role.id ? 'ring-2 ring-primary' : ''
                  }`}
                  onClick={() => setSelectedRole(role.id)}
                >
                  <CardContent className="flex flex-col items-center p-4">
                    <Icon className="h-8 w-8 text-primary mb-2" />
                    <h3 className="font-medium text-sm text-center">{role.name}</h3>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Personal Information */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Update your basic details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="region">Region</Label>
              <Select value={formData.region} onValueChange={(value) => setFormData(prev => ({ ...prev, region: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {regions.map((region) => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Specific Location</Label>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="location"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                className="pl-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="experience">Years of Experience</Label>
            <Select value={formData.experience} onValueChange={(value) => setFormData(prev => ({ ...prev, experience: value }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner (0-2 years)</SelectItem>
                <SelectItem value="intermediate">Intermediate (3-5 years)</SelectItem>
                <SelectItem value="experienced">Experienced (6-10 years)</SelectItem>
                <SelectItem value="expert">Expert (10+ years)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Agricultural Details */}
      {(selectedRole === 'farmer' || selectedRole === 'buyer') && (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Agricultural Information</CardTitle>
            <CardDescription>Tell us about your farming activities</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Farm Size</Label>
              <Select value={formData.farmSize} onValueChange={(value) => setFormData(prev => ({ ...prev, farmSize: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {farmSizes.map((size) => (
                    <SelectItem key={size} value={size}>{size}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Crops of Interest</Label>
              <p className="text-sm text-muted-foreground mb-2">Select all that apply</p>
              <div className="flex flex-wrap gap-2">
                {crops.map((crop) => (
                  <Badge
                    key={crop}
                    variant={formData.selectedCrops.includes(crop) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => toggleCrop(crop)}
                  >
                    {crop}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {(selectedRole === 'poultry' || selectedRole === 'buyer') && (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Poultry Information</CardTitle>
            <CardDescription>Your poultry farming details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Poultry Types</Label>
              <p className="text-sm text-muted-foreground mb-2">Select all that apply</p>
              <div className="flex flex-wrap gap-2">
                {poultryTypes.map((type) => (
                  <Badge
                    key={type}
                    variant={formData.selectedPoultry.includes(type) ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => togglePoultry(type)}
                  >
                    {type}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedRole === 'ngo' && (
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Organization Information</CardTitle>
            <CardDescription>Details about your organization</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organization">Organization Name</Label>
              <Input
                id="organization"
                value={formData.organization}
                onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                placeholder="Enter organization name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="projectFocus">Project Focus</Label>
              <Textarea
                id="projectFocus"
                value={formData.projectFocus}
                onChange={(e) => setFormData(prev => ({ ...prev, projectFocus: e.target.value }))}
                placeholder="Describe your agricultural projects and focus areas"
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Verification */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Account Verification</CardTitle>
          <CardDescription>Upload documents to gain trusted status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
            <p className="text-sm text-muted-foreground mb-2">
              Upload ID or community endorsement letter
            </p>
            <Button variant="outline" size="sm">
              Choose Files
            </Button>
          </div>
        </CardContent>
      </Card>

      <Button variant="farmer" className="w-full">
        Save Profile Changes
      </Button>
    </div>
  );
}

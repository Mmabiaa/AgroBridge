import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { MapPin, Upload, CheckCircle, Sprout, Wheat, ShoppingCart, Users } from 'lucide-react';

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

export default function ProfileSetup() {
  const [step, setStep] = useState(1);
  const [selectedRole, setSelectedRole] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    location: '',
    region: '',
    farmSize: '',
    selectedCrops: [],
    selectedPoultry: [],
    experience: '',
    interests: '',
    organization: '',
    projectFocus: ''
  });

  const totalSteps = 4;
  const progress = (step / totalSteps) * 100;

  const handleNext = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const handlePrevious = () => {
    if (step > 1) setStep(step - 1);
  };

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
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-8 px-4">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4">Profile Setup</h1>
          <p className="text-muted-foreground mb-6">
            Let's personalize your AgroBridge experience
          </p>
          <Progress value={progress} className="w-full h-2" />
          <p className="text-sm text-muted-foreground mt-2">
            Step {step} of {totalSteps}
          </p>
        </div>

        <Card className="shadow-strong">
          <CardHeader>
            <CardTitle>
              {step === 1 && 'Choose Your Role'}
              {step === 2 && 'Personal Information'}
              {step === 3 && 'Agricultural Details'}
              {step === 4 && 'Complete Setup'}
            </CardTitle>
            <CardDescription>
              {step === 1 && 'Select how you want to use AgroBridge'}
              {step === 2 && 'Tell us about yourself'}
              {step === 3 && 'Share your agricultural interests'}
              {step === 4 && 'Review and complete your profile'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Step 1: Role Selection */}
            {step === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      <CardContent className="flex flex-col items-center p-6">
                        <Icon className="h-12 w-12 text-primary mb-4" />
                        <h3 className="font-semibold">{role.name}</h3>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            {/* Step 2: Personal Information */}
            {step === 2 && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    value={formData.fullName}
                    onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                    placeholder="Enter your full name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="region">Region</Label>
                  <Select value={formData.region} onValueChange={(value) => setFormData(prev => ({ ...prev, region: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your region" />
                    </SelectTrigger>
                    <SelectContent>
                      {regions.map((region) => (
                        <SelectItem key={region} value={region}>{region}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Specific Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                      placeholder="Enter your city/town"
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experience">Years of Experience</Label>
                  <Select value={formData.experience} onValueChange={(value) => setFormData(prev => ({ ...prev, experience: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select experience level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner (0-2 years)</SelectItem>
                      <SelectItem value="intermediate">Intermediate (3-5 years)</SelectItem>
                      <SelectItem value="experienced">Experienced (6-10 years)</SelectItem>
                      <SelectItem value="expert">Expert (10+ years)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 3: Agricultural Details */}
            {step === 3 && (
              <div className="space-y-6">
                {(selectedRole === 'farmer' || selectedRole === 'buyer') && (
                  <>
                    <div className="space-y-2">
                      <Label>Farm Size</Label>
                      <Select value={formData.farmSize} onValueChange={(value) => setFormData(prev => ({ ...prev, farmSize: value }))}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select farm size" />
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
                  </>
                )}

                {(selectedRole === 'poultry' || selectedRole === 'buyer') && (
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
                )}

                {selectedRole === 'ngo' && (
                  <>
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
                  </>
                )}
              </div>
            )}

            {/* Step 4: Verification & Complete */}
            {step === 4 && (
              <div className="space-y-6">
                <div className="text-center">
                  <CheckCircle className="h-16 w-16 text-primary mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Almost Done!</h3>
                  <p className="text-muted-foreground mb-6">
                    Upload verification documents to gain trusted status
                  </p>
                </div>

                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-4" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload ID or community endorsement letter
                  </p>
                  <Button variant="outline" size="sm">
                    Choose Files
                  </Button>
                </div>

                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Profile Summary:</h4>
                  <div className="space-y-1 text-sm">
                    <p><strong>Role:</strong> {roles.find(r => r.id === selectedRole)?.name}</p>
                    <p><strong>Name:</strong> {formData.fullName}</p>
                    <p><strong>Location:</strong> {formData.location}, {formData.region}</p>
                    {formData.selectedCrops.length > 0 && (
                      <p><strong>Crops:</strong> {formData.selectedCrops.join(', ')}</p>
                    )}
                    {formData.selectedPoultry.length > 0 && (
                      <p><strong>Poultry:</strong> {formData.selectedPoultry.join(', ')}</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={step === 1}
              >
                Previous
              </Button>
              
              {step < totalSteps ? (
                <Button
                  variant="farmer"
                  onClick={handleNext}
                  disabled={step === 1 && !selectedRole}
                >
                  Continue
                </Button>
              ) : (
                <Button variant="farmer" className="px-8">
                  Complete Setup
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
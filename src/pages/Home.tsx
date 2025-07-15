import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Wheat, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Bot,
  Sprout,
  ArrowRight,
  CheckCircle,
  Globe,
  Smartphone,
  Shield,
  Zap,
  Heart,
  Star
} from 'lucide-react';

const userRoles = [
  {
    title: 'Farmer',
    description: 'Grow crops, monitor farm health, and sell directly to buyers',
    icon: Sprout,
    color: 'bg-gradient-primary',
    features: ['Smart farm monitoring', 'AI crop guidance', 'Direct marketplace access']
  },
  {
    title: 'Poultry Keeper',
    description: 'Manage poultry health, optimize feeding, and track productivity',
    icon: Wheat,
    color: 'bg-gradient-earth',
    features: ['Poultry health tracking', 'Feed optimization', 'Disease alerts']
  },
  {
    title: 'Buyer',
    description: 'Source fresh produce directly from verified farmers',
    icon: ShoppingCart,
    color: 'bg-gradient-sky',
    features: ['Verified suppliers', 'Quality assurance', 'Traceability system']
  },
  {
    title: 'NGO/Government',
    description: 'Monitor agricultural programs and support farmer communities',
    icon: Users,
    color: 'bg-harvest',
    features: ['Impact analytics', 'Program tracking', 'Community insights']
  }
];

const features = [
  {
    icon: Bot,
    title: 'AgriGPT Assistant',
    description: 'AI-powered farming advice in local languages'
  },
  {
    icon: TrendingUp,
    title: 'Predictive Analytics',
    description: 'Weather forecasts, pest alerts, and market predictions'
  },
  {
    icon: Smartphone,
    title: 'Offline Support',
    description: 'Works even in areas with limited internet connectivity'
  },
  {
    icon: Globe,
    title: 'Multi-Language',
    description: 'Available in English, Twi, Hausa, and more'
  }
];

const benefits = [
  {
    icon: Zap,
    title: 'Increase Productivity',
    description: 'AI-driven insights help optimize your farming operations'
  },
  {
    icon: Shield,
    title: 'Secure Transactions',
    description: 'Safe and transparent marketplace with verified users'
  },
  {
    icon: Heart,
    title: 'Community Support',
    description: 'Connect with fellow farmers and agricultural experts'
  }
];

const testimonials = [
  {
    name: 'Kwame Asante',
    role: 'Farmer, Northern Ghana',
    content: 'AgroBridge helped me increase my maize yield by 40% using smart monitoring.',
    rating: 5
  },
  {
    name: 'Fatima Ibrahim',
    role: 'Poultry Keeper, Tamale',
    content: 'The AI assistant guides me in local language. Very helpful for disease prevention.',
    rating: 5
  },
  {
    name: 'Sarah Mensah',
    role: 'Agricultural Buyer, Accra',
    content: 'I can now source fresh produce directly from verified farmers. Quality is excellent.',
    rating: 5
  }
];

export default function Home() {
  const [selectedRole, setSelectedRole] = useState('');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-gradient-primary shadow-glow">
              <Wheat className="h-12 w-12 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-hero bg-clip-text text-transparent">
            Welcome to AgroBridge
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Empowering African agriculture through AI-driven insights, smart monitoring, 
            and direct market connections
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link to="/register">
              <Button variant="farmer" size="lg" className="text-lg px-8 py-6 hover-scale">
                <ArrowRight className="mr-2 h-5 w-5" />
                Get Started Today
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg" className="text-lg px-8 py-6 hover-scale">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Impact Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">10,000+</div>
              <div className="text-muted-foreground">Farmers Connected</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <div className="text-muted-foreground">Communities Served</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">₦2M+</div>
              <div className="text-muted-foreground">Farmer Income Increased</div>
            </div>
          </div>
        </div>
      </section>

      {/* Role Selection */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Choose Your Role</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Select how you'd like to participate in the AgroBridge ecosystem
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {userRoles.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.title;
              
              return (
                <Card 
                  key={role.title}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-strong ${
                    isSelected ? 'ring-2 ring-primary shadow-strong' : ''
                  }`}
                  onClick={() => setSelectedRole(role.title)}
                >
                  <CardHeader className="text-center pb-4">
                    <div className={`w-16 h-16 mx-auto rounded-full ${role.color} flex items-center justify-center mb-4 shadow-soft`}>
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-xl">{role.title}</CardTitle>
                    <CardDescription className="text-center">
                      {role.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {role.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-primary" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {selectedRole && (
            <div className="text-center animate-fade-in">
              <p className="text-muted-foreground mb-4">Ready to join as a {selectedRole}?</p>
              <Link to="/register">
                <Button variant="farmer" size="lg" className="text-lg px-8 py-6 hover-scale">
                  Create Account
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose AgroBridge?</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of farmers who are already transforming their agricultural practices
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="text-center hover:shadow-strong transition-all duration-300 hover-scale">
                  <CardHeader>
                    <div className="w-16 h-16 mx-auto rounded-full bg-gradient-primary flex items-center justify-center mb-4 shadow-soft">
                      <Icon className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-xl">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Platform Features</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to succeed in modern agriculture
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-primary flex items-center justify-center mb-4 shadow-soft">
                    <Icon className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">What Our Users Say</h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Real stories from farmers and agricultural professionals across Ghana
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="shadow-soft hover:shadow-strong transition-all duration-300">
                <CardContent className="pt-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-muted-foreground mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to Transform Your Agriculture?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join thousands of farmers who are already using AgroBridge to increase their yields 
              and connect with buyers directly.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/register">
                <Button variant="farmer" size="lg" className="text-lg px-8 py-6 hover-scale">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/learning">
                <Button variant="outline" size="lg" className="text-lg px-8 py-6 hover-scale">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

import { useEffect, useState } from 'react';
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
import { getHello } from '@/lib/api';

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
  const [backendMessage, setBackendMessage] = useState('');

  

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10">
      {/* Hero Section */}
<section className="relative min-h-screen flex items-center justify-center overflow-hidden px-3 md:px-4">
  <div className="container mx-auto text-center">
    <div className="flex justify-center mb-4 md:mb-6">
      <div className="p-3 md:p-4 rounded-full bg-gradient-primary shadow-glow">
        <Wheat className="h-8 w-8 md:h-12 md:w-12 text-primary-foreground" />
      </div>
    </div>
    
    <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-4 md:mb-6 bg-gradient-hero bg-clip-text text-transparent px-2">
      Welcome to AgroBridge
    </h1>
    
    <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground mb-6 md:mb-8 max-w-3xl mx-auto px-4">
      Empowering African agriculture through AI-driven insights, smart monitoring, 
      and direct market connections
    </p>

    <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center mb-8 md:mb-12 px-4">
      <Link to="/register" className="w-full sm:w-auto">
        <Button variant="farmer" size="lg" className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8 py-4 md:py-6 hover-scale">
          <ArrowRight className="mr-2 h-4 w-4 md:h-5 md:w-5" />
          Get Started Today
        </Button>
      </Link>
      <Link to="/login" className="w-full sm:w-auto">
        <Button variant="outline" size="lg" className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8 py-4 md:py-6 hover-scale">
          Sign In
        </Button>
      </Link>
    </div>

    {/* Impact Stats */}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-8 max-w-4xl mx-auto px-4">
      <div className="text-center p-4 bg-card/50 rounded-lg backdrop-blur-sm">
        <div className="text-2xl md:text-3xl font-bold text-primary mb-1 md:mb-2">10,000+</div>
        <div className="text-sm md:text-base text-muted-foreground">Farmers Connected</div>
      </div>
      <div className="text-center p-4 bg-card/50 rounded-lg backdrop-blur-sm">
        <div className="text-2xl md:text-3xl font-bold text-primary mb-1 md:mb-2">500+</div>
        <div className="text-sm md:text-base text-muted-foreground">Communities Served</div>
      </div>
      <div className="text-center p-4 bg-card/50 rounded-lg backdrop-blur-sm">
        <div className="text-2xl md:text-3xl font-bold text-primary mb-1 md:mb-2">₦2M+</div>
        <div className="text-sm md:text-base text-muted-foreground">Farmer Income Increased</div>
      </div>
    </div>
  </div>
</section>

      {/* Role Selection */}
      <section className="py-12 md:py-20 px-3 md:px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-8 md:mb-12 px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">Choose Your Role</h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Select how you'd like to participate in the AgroBridge ecosystem
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8 md:mb-12 px-0 sm:px-2">
            {userRoles.map((role) => {
              const Icon = role.icon;
              const isSelected = selectedRole === role.title;
              
              return (
                <Card 
                  key={role.title}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-strong ${
                    isSelected ? 'ring-2 ring-primary shadow-strong' : ''
                  } touch-manipulation`}
                  onClick={() => setSelectedRole(role.title)}
                >
                  <CardHeader className="text-center pb-3 md:pb-4 p-4 md:p-6">
                    <div className={`w-12 h-12 md:w-16 md:h-16 mx-auto rounded-full ${role.color} flex items-center justify-center mb-3 md:mb-4 shadow-soft`}>
                      <Icon className="h-6 w-6 md:h-8 md:w-8 text-white" />
                    </div>
                    <CardTitle className="text-lg md:text-xl">{role.title}</CardTitle>
                    <CardDescription className="text-center text-sm md:text-base">
                      {role.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 pt-0">
                    <ul className="space-y-2">
                      {role.features.map((feature, index) => (
                        <li key={index} className="flex items-center gap-2 text-xs md:text-sm">
                          <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-primary flex-shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {selectedRole && (
            <div className="text-center animate-fade-in px-4">
              <p className="text-muted-foreground mb-4">Ready to join as a {selectedRole}?</p>
              <Link to="/register">
                <Button variant="farmer" size="lg" className="text-base md:text-lg px-6 md:px-8 py-4 md:py-6 hover-scale">
                  Create Account
                  <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 md:py-20 px-3 md:px-4">
        <div className="container mx-auto">
          <div className="text-center mb-8 md:mb-12 px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">Why Choose AgroBridge?</h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands of farmers who are already transforming their agricultural practices
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-8 md:mb-16 px-0 md:px-2">
            {benefits.map((benefit, index) => {
              const Icon = benefit.icon;
              return (
                <Card key={index} className="text-center hover:shadow-strong transition-all duration-300 hover-scale touch-manipulation">
                  <CardHeader className="p-4 md:p-6">
                    <div className="w-12 h-12 md:w-16 md:h-16 mx-auto rounded-full bg-gradient-primary flex items-center justify-center mb-3 md:mb-4 shadow-soft">
                      <Icon className="h-6 w-6 md:h-8 md:w-8 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-lg md:text-xl">{benefit.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 md:p-6 pt-0">
                    <p className="text-sm md:text-base text-muted-foreground">{benefit.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-12 md:py-20 px-3 md:px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-8 md:mb-12 px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">Platform Features</h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need to succeed in modern agriculture
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 px-0 sm:px-2">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div key={index} className="text-center p-4 bg-card/50 rounded-lg backdrop-blur-sm hover:shadow-soft transition-all duration-300">
                  <div className="w-12 h-12 md:w-16 md:h-16 mx-auto rounded-full bg-gradient-primary flex items-center justify-center mb-3 md:mb-4 shadow-soft">
                    <Icon className="h-6 w-6 md:h-8 md:w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg md:text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-sm md:text-base text-muted-foreground">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-12 md:py-20 px-3 md:px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-8 md:mb-12 px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-3 md:mb-4">What Our Users Say</h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              Real stories from farmers and agricultural professionals across Ghana
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 px-0 md:px-2">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="shadow-soft hover:shadow-strong transition-all duration-300 touch-manipulation">
                <CardContent className="pt-4 md:pt-6 p-4 md:p-6">
                  <div className="flex items-center mb-3 md:mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-3 w-3 md:h-4 md:w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-sm md:text-base text-muted-foreground mb-3 md:mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <p className="text-sm md:text-base font-semibold">{testimonial.name}</p>
                    <p className="text-xs md:text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-12 md:py-20 px-3 md:px-4">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto px-4">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 md:mb-6">
              Ready to Transform Your Agriculture?
            </h2>
            <p className="text-base md:text-lg text-muted-foreground mb-6 md:mb-8">
              Join thousands of farmers who are already using AgroBridge to increase their yields 
              and connect with buyers directly.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4 justify-center">
              <Link to="/register" className="w-full sm:w-auto">
                <Button variant="farmer" size="lg" className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8 py-4 md:py-6 hover-scale">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-4 w-4 md:h-5 md:w-5" />
                </Button>
              </Link>
              <Link to="/learning" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full sm:w-auto text-base md:text-lg px-6 md:px-8 py-4 md:py-6 hover-scale">
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

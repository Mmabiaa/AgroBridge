# 🎨 Frontend Implementation & UI Architecture

This section documents the frontend architecture, React components, state management, and user interface implementation of AgroBridge.

## 🏗️ Architecture Overview

### 🎯 Frontend Design
AgroBridge follows a **component-based architecture** with modern React patterns:

```
┌─────────────────────────────────────────────────────────────┐
│                    Application Layer                        │
├─────────────────────────────────────────────────────────────┤
│  Pages (Route-based)  │  Layouts  │  Navigation  │  Auth  │
├─────────────────────────────────────────────────────────────┤
│                    Component Layer                          │
├─────────────────────────────────────────────────────────────┤
│  UI Components  │  Feature Components  │  Shared Components │
├─────────────────────────────────────────────────────────────┤
│                    State Management                         │
├─────────────────────────────────────────────────────────────┤
│  Context API  │  React Query  │  Local State  │  Cache  │
├─────────────────────────────────────────────────────────────┤
│                    Service Layer                            │
├─────────────────────────────────────────────────────────────┤
│  API Client  │  Voice Services  │  File Upload  │  Utils  │
└─────────────────────────────────────────────────────────────┘
```

### 🔧 Technology Stack
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite for fast development and building
- **Styling**: Tailwind CSS with custom agricultural theme
- **Components**: Shadcn/ui component library
- **State Management**: Context API + TanStack React Query
- **Routing**: React Router v6 with protected routes
- **Voice Integration**: Web Speech API + Google Cloud TTS

## 🚀 Core Components

### 🏠 Layout Components

#### App Layout
```typescript
// App.tsx - Main application wrapper
const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <ProtectedRoute>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/agrigpt" element={<AgriGPT />} />
                {/* Additional protected routes */}
              </ProtectedRoute>
            </Routes>
          </Router>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};
```

#### Navigation Component
```typescript
// Navigation.tsx - Main navigation bar
const Navigation: React.FC = () => {
  const { user, logout } = useAuth();
  const { role } = useRole();

  return (
    <nav className="bg-green-800 text-white">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Logo />
          <div className="hidden md:flex space-x-8">
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/marketplace">Marketplace</NavLink>
            <NavLink to="/agrigpt">AgriGPT</NavLink>
            {/* Role-based navigation items */}
          </div>
          <UserMenu user={user} onLogout={logout} />
        </div>
      </div>
    </nav>
  );
};
```

#### Role-Based Navigation
```typescript
// RoleBasedNavigation.tsx - Dynamic navigation based on user role
const RoleBasedNavigation: React.FC = () => {
  const { role } = useRole();
  
  const getNavigationItems = () => {
    switch (role) {
      case 'farmer':
        return [
          { to: '/monitoring', label: 'Monitoring', icon: Monitor },
          { to: '/crop-calendar', label: 'Crop Calendar', icon: Calendar },
          { to: '/financial-planning', label: 'Financial Planning', icon: DollarSign }
        ];
      case 'buyer':
        return [
          { to: '/search', label: 'Search Products', icon: Search },
          { to: '/orders', label: 'My Orders', icon: Package },
          { to: '/analytics', label: 'Market Analytics', icon: BarChart3 }
        ];
      // Additional roles...
    }
  };

  return (
    <nav className="space-y-2">
      {getNavigationItems().map(item => (
        <NavLink
          key={item.to}
          to={item.to}
          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-green-100"
        >
          <item.icon className="w-5 h-5" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
};
```

### 🎨 UI Components

#### Button Components
```typescript
// components/ui/button.tsx
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', loading, children, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={loading}
        {...props}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  }
);
```

#### Form Components
```typescript
// components/ui/form.tsx
interface FormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'select';
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[];
}

const FormField: React.FC<FormFieldProps> = ({
  name,
  label,
  type = 'text',
  placeholder,
  required,
  options
}) => {
  const { register, formState: { errors } } = useFormContext();
  
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>{label}</Label>
      {type === 'select' ? (
        <Select>
          <SelectTrigger>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options?.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <Input
          id={name}
          type={type}
          placeholder={placeholder}
          {...register(name, { required })}
        />
      )}
      {errors[name] && (
        <p className="text-sm text-red-600">{errors[name]?.message}</p>
      )}
    </div>
  );
};
```

### 🗣️ Voice Integration Components

#### Voice Fab Component
```typescript
// VoiceFab.tsx - Floating action button for voice commands
const VoiceFab: React.FC = () => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const { speak } = useVoice();

  const startListening = () => {
    setIsListening(true);
    // Initialize speech recognition
    recognition.start();
  };

  const stopListening = () => {
    setIsListening(false);
    recognition.stop();
  };

  const handleCommand = (command: string) => {
    const normalizedCommand = command.toLowerCase().trim();
    
    // Handle common voice commands
    if (normalizedCommand.includes('go to')) {
      const page = extractPageFromCommand(command);
      navigate(`/${page}`);
      speak(`Navigating to ${page}`);
    } else if (normalizedCommand.includes('logout')) {
      logout();
      speak('Goodbye! Wishing you a bountiful harvest and a wonderful day!');
    }
    // Additional command handling...
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={isListening ? stopListening : startListening}
        className={cn(
          "w-16 h-16 rounded-full shadow-lg transition-all duration-200",
          isListening 
            ? "bg-red-500 hover:bg-red-600 animate-pulse" 
            : "bg-green-600 hover:bg-green-700"
        )}
      >
        <Mic className="w-8 h-8 text-white mx-auto" />
      </button>
      
      {isListening && (
        <div className="absolute bottom-20 right-0 bg-white p-4 rounded-lg shadow-lg">
          <p className="text-sm text-gray-600">Listening...</p>
          <p className="text-sm font-medium">{transcript}</p>
        </div>
      )}
    </div>
  );
};
```

#### Voice Commands Hook
```typescript
// hooks/useVoice.ts
export const useVoice = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  useEffect(() => {
    setIsSupported('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
  }, []);

  const startListening = useCallback(() => {
    if (!isSupported) return;

    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US'; // Configurable language

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join('');
      setTranscript(transcript);
    };

    recognition.start();
  }, [isSupported]);

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'en-US'; // Configurable language
      speechSynthesis.speak(utterance);
    }
  }, []);

  return {
    isSupported,
    isListening,
    transcript,
    startListening,
    speak
  };
};
```

## 📱 Page Components

### 🏠 Home Page
```typescript
// pages/Home.tsx
const Home: React.FC = () => {
  const { user } = useAuth();
  const { role } = useRole();

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white">
      <HeroSection />
      
      {!user ? (
        <AuthSection />
      ) : (
        <QuickActions role={role} />
      )}
      
      <FeaturesSection />
      <TestimonialsSection />
      <ContactSection />
    </div>
  );
};

const HeroSection: React.FC = () => (
  <section className="text-center py-20 px-4">
    <h1 className="text-5xl md:text-6xl font-bold text-green-800 mb-6">
      Welcome to AgroBridge
    </h1>
    <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
      The AI-powered agricultural hub connecting farmers, buyers, and organizations 
      across Africa for modern, sustainable farming.
    </p>
    <div className="space-x-4">
      <Button size="lg" className="bg-green-600 hover:bg-green-700">
        Get Started
      </Button>
      <Button size="lg" variant="outline">
        Learn More
      </Button>
    </div>
  </section>
);
```

### 📊 Dashboard Page
```typescript
// pages/Dashboard.tsx
const Dashboard: React.FC = () => {
  const { role } = useRole();
  
  return (
    <div className="min-h-screen bg-gray-50">
      <DashboardHeader />
      
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <QuickStats />
            <RecentActivity />
            <PerformanceCharts />
          </div>
          <div className="space-y-6">
            <WeatherWidget />
            <QuickActions />
            <Notifications />
          </div>
        </div>
      </div>
    </div>
  );
};

const QuickStats: React.FC = () => {
  const { data: stats } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: fetchDashboardStats
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
      <StatCard
        title="Farm Health"
        value={stats?.farmHealth || 0}
        unit="%"
        icon={Heart}
        trend="up"
        trendValue={5}
      />
      <StatCard
        title="Crop Yield"
        value={stats?.cropYield || 0}
        unit="tons"
        icon={TrendingUp}
        trend="up"
        trendValue={12}
      />
      <StatCard
        title="Market Value"
        value={stats?.marketValue || 0}
        unit="$"
        icon={DollarSign}
        trend="down"
        trendValue={3}
      />
    </div>
  );
};
```

### 🤖 AgriGPT Page
```typescript
// pages/AgriGPT.tsx
const AgriGPT: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { speak } = useVoice();

  const sendMessage = async (content: string, type: 'text' | 'voice' = 'text') => {
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content,
      type,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await sendChatMessage(content);
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response.message,
        type: 'text',
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
      
      // Speak response if original message was voice
      if (type === 'voice') {
        speak(response.message);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVoiceInput = () => {
    // Voice input handling logic
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-lg">
        <ChatHeader />
        
        <ChatMessages 
          messages={messages} 
          isLoading={isLoading} 
        />
        
        <ChatInput
          value={inputValue}
          onChange={setInputValue}
          onSend={sendMessage}
          onVoiceInput={handleVoiceInput}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};
```

## 🔄 State Management

### 🎯 Context API Implementation

#### Authentication Context
```typescript
// contexts/AuthContext.tsx
interface AuthContextType {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterData) => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    checkAuthStatus();
  }, []);

  const login = async (credentials: LoginCredentials) => {
    try {
      setIsLoading(true);
      const response = await loginUser(credentials);
      setUser(response.user);
      localStorage.setItem('token', response.token);
    } catch (error) {
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    login,
    logout,
    register,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
```

#### Role Context
```typescript
// contexts/RoleContext.tsx
interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  permissions: Permission[];
  hasPermission: (permission: Permission) => boolean;
}

export const RoleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole>('farmer');
  const [permissions, setPermissions] = useState<Permission[]>([]);

  useEffect(() => {
    // Load role-based permissions
    loadPermissions(role);
  }, [role]);

  const hasPermission = useCallback((permission: Permission) => {
    return permissions.includes(permission);
  }, [permissions]);

  const value = {
    role,
    setRole,
    permissions,
    hasPermission
  };

  return (
    <RoleContext.Provider value={value}>
      {children}
    </RoleContext.Provider>
  );
};
```

### 🔄 React Query Integration

#### Query Hooks
```typescript
// hooks/useFarmData.ts
export const useFarmData = (farmId: string) => {
  return useQuery({
    queryKey: ['farm', farmId],
    queryFn: () => fetchFarmData(farmId),
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdateFarm = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateFarmData,
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries(['farm', variables.id]);
      queryClient.setQueryData(['farm', variables.id], data);
    },
  });
};

// hooks/useMarketplace.ts
export const useProducts = (filters: ProductFilters) => {
  return useQuery({
    queryKey: ['products', filters],
    queryFn: () => fetchProducts(filters),
    keepPreviousData: true, // Keep previous data while fetching new data
  });
};
```

## 🎨 Styling & Theming

### 🎨 Tailwind CSS Configuration
```typescript
// tailwind.config.ts
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Agricultural color palette
        green: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
        },
        earth: {
          50: '#fdf8f6',
          100: '#f2e8e5',
          200: '#eaddd7',
          300: '#e0cec7',
          400: '#d2bab0',
          500: '#bfa094',
          600: '#a18072',
          700: '#977669',
          800: '#846358',
          900: '#43302b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Poppins', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    require('@tailwindcss/forms'),
  ],
};
```

### 🎭 Component Variants
```typescript
// lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Button variants
export const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "underline-offset-4 hover:underline text-primary",
      },
      size: {
        default: "h-10 py-2 px-4",
        sm: "h-9 px-3 rounded-md",
        lg: "h-11 px-8 rounded-md",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);
```

## 📱 Responsive Design

### 📱 Mobile-First Approach
```typescript
// Responsive breakpoints
const breakpoints = {
  sm: '640px',   // Small devices (phones)
  md: '768px',   // Medium devices (tablets)
  lg: '1024px',  // Large devices (laptops)
  xl: '1280px',  // Extra large devices (desktops)
  '2xl': '1536px', // 2X large devices (large desktops)
};

// Responsive grid layouts
const ResponsiveGrid: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
    {/* Grid items */}
  </div>
);

// Responsive navigation
const ResponsiveNav: React.FC = () => (
  <nav className="hidden md:flex space-x-8">
    {/* Desktop navigation */}
  </nav>
  
  <button className="md:hidden">
    <Menu className="w-6 h-6" />
  </button>
);
```

### 🎯 Touch-Friendly Design
```typescript
// Touch-friendly components
const TouchButton: React.FC = () => (
  <button className="min-h-[44px] min-w-[44px] p-3 rounded-lg">
    {/* Button content */}
  </button>
);

// Swipe gestures
const SwipeableCard: React.FC = () => {
  const [swipeDirection, setSwipeDirection] = useState<'left' | 'right' | null>(null);
  
  const handleSwipe = (direction: 'left' | 'right') => {
    setSwipeDirection(direction);
    // Handle swipe action
  };

  return (
    <div className="touch-pan-y">
      {/* Swipeable content */}
    </div>
  );
};
```

## 🚀 Performance Optimization

### ⚡ Code Splitting
```typescript
// Lazy loading components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Marketplace = lazy(() => import('./pages/Marketplace'));
const AgriGPT = lazy(() => import('./pages/AgriGPT'));

// Route-based code splitting
const AppRoutes: React.FC = () => (
  <Suspense fallback={<LoadingSpinner />}>
    <Routes>
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/marketplace" element={<Marketplace />} />
      <Route path="/agrigpt" element={<AgriGPT />} />
    </Routes>
  </Suspense>
);
```

### 🎯 Memoization
```typescript
// Memoized components
const ExpensiveChart = memo<ChartProps>(({ data, options }) => {
  return (
    <Chart data={data} options={options} />
  );
});

// Memoized calculations
const useExpensiveCalculation = (data: number[]) => {
  return useMemo(() => {
    return data.reduce((acc, val) => acc + val, 0) / data.length;
  }, [data]);
};
```

---

**Next**: Explore [Current Features](./../current_features/) for feature-specific implementation details, or dive into [Backend](./../backend/) for API integration details. 
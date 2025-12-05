# Template Components

Templates are page-level layouts that combine organisms, molecules, and atoms to create complete page structures. They define the overall layout and structure of different types of pages in the application.

## Components

### DashboardLayout
A comprehensive layout for authenticated dashboard pages with sidebar navigation.

**Features:**
- Responsive sidebar navigation (desktop) and drawer (mobile)
- Sticky header with notifications and user menu
- Mobile-optimized header with hamburger menu
- Footer with links
- Automatic sidebar state management
- Support for nested routes via React Router Outlet

**Usage:**
```tsx
import { DashboardLayout } from '@/components/templates';

// In your router configuration
<Route element={<DashboardLayout />}>
  <Route path="/dashboard" element={<Dashboard />} />
  <Route path="/farms" element={<Farms />} />
  {/* Other dashboard routes */}
</Route>

// Or with children
<DashboardLayout>
  <YourPageContent />
</DashboardLayout>
```

### MarketplaceLayout
A specialized layout for marketplace/e-commerce pages with filters and search.

**Features:**
- Integrated search bar
- Desktop sidebar filters
- Mobile filter drawer
- Active filter badges with quick removal
- Category filtering
- Price range slider
- Stock status filter
- Sort options
- Responsive grid layout
- Filter state management

**Usage:**
```tsx
import { MarketplaceLayout, MarketplaceFilters } from '@/components/templates';

function MarketplacePage() {
  const handleSearch = (query: string) => {
    // Handle search
  };

  const handleFilterChange = (filters: MarketplaceFilters) => {
    // Handle filter changes
  };

  return (
    <MarketplaceLayout
      onSearch={handleSearch}
      onFilterChange={handleFilterChange}
      categories={['Vegetables', 'Fruits', 'Grains']}
      priceRange={[0, 10000]}
    >
      <ProductGrid products={products} />
    </MarketplaceLayout>
  );
}
```

### AuthLayout
A clean, centered layout for authentication pages (login, register, forgot password).

**Features:**
- Split-screen design (form + hero)
- Centered form on mobile
- Hero section with statistics on desktop
- Logo and branding
- Footer links
- Responsive design
- Decorative background elements
- Support for custom title and description

**Usage:**
```tsx
import { AuthLayout } from '@/components/templates';

// In your router configuration
<Route element={<AuthLayout />}>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />
</Route>

// Or with props
<AuthLayout
  title="Welcome Back"
  description="Sign in to your account to continue"
  showBackToHome={true}
>
  <LoginForm />
</AuthLayout>
```

### SettingsLayout
A tabbed layout for settings and configuration pages.

**Features:**
- Sidebar navigation on desktop
- Grid tabs on mobile
- Active tab highlighting
- Tab descriptions
- Icon support for each tab
- Responsive design
- Support for nested routes
- Organized settings categories

**Usage:**
```tsx
import { SettingsLayout } from '@/components/templates';

// In your router configuration
<Route element={<SettingsLayout />}>
  <Route path="/settings/profile" element={<ProfileSettings />} />
  <Route path="/settings/notifications" element={<NotificationSettings />} />
  <Route path="/settings/security" element={<SecuritySettings />} />
  {/* Other settings routes */}
</Route>

// Or with children
<SettingsLayout>
  <ProfileSettings />
</SettingsLayout>
```

## Design Principles

1. **Consistency**: All templates follow the same design language
2. **Responsiveness**: Mobile-first approach with desktop enhancements
3. **Flexibility**: Support both Outlet and children patterns
4. **Accessibility**: Semantic HTML and ARIA labels
5. **Performance**: Optimized rendering and state management
6. **Reusability**: Templates can be used across multiple pages

## Responsive Behavior

### Mobile (< 768px)
- Hamburger menu for navigation
- Bottom sheet for filters
- Stacked layouts
- Touch-optimized interactions
- Simplified headers

### Tablet (768px - 1024px)
- Collapsible sidebar
- Adaptive grid layouts
- Optimized spacing
- Touch and mouse support

### Desktop (> 1024px)
- Full sidebar navigation
- Side-by-side layouts
- Expanded filters
- Hover interactions
- Maximum content width

## Layout Hierarchy

```
Templates (Page Layouts)
├── Organisms (Complex Components)
│   ├── Navigation
│   ├── NotificationDropdown
│   ├── UserMenu
│   └── DataTable
├── Molecules (Simple Combinations)
│   ├── SearchBar
│   ├── FormField
│   └── Card
└── Atoms (Basic Elements)
    ├── Button
    ├── Input
    └── Badge
```

## Best Practices

1. **Use React Router Outlet**: Prefer Outlet for nested routes
2. **Provide callbacks**: Allow parent components to handle state changes
3. **Keep layouts focused**: Each layout should serve a specific purpose
4. **Handle loading states**: Show appropriate loading indicators
5. **Optimize performance**: Use React.memo for expensive components
6. **Test responsiveness**: Test on actual devices, not just browser resize

## File Structure

```
templates/
├── DashboardLayout.tsx      # Main dashboard layout
├── MarketplaceLayout.tsx    # Marketplace with filters
├── AuthLayout.tsx          # Authentication pages
├── SettingsLayout.tsx      # Settings with tabs
├── index.ts               # Barrel exports
└── README.md             # This file
```

## Integration with Routing

Example router configuration using templates:

```tsx
import { createBrowserRouter } from 'react-router-dom';
import {
  DashboardLayout,
  MarketplaceLayout,
  AuthLayout,
  SettingsLayout,
} from '@/components/templates';

const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardLayout />,
    children: [
      { path: 'dashboard', element: <Dashboard /> },
      { path: 'farms', element: <Farms /> },
      { path: 'analytics', element: <Analytics /> },
    ],
  },
  {
    path: '/marketplace',
    element: <MarketplaceLayout />,
    children: [
      { index: true, element: <ProductList /> },
      { path: ':id', element: <ProductDetails /> },
    ],
  },
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      { path: 'forgot-password', element: <ForgotPassword /> },
    ],
  },
  {
    path: '/settings',
    element: <SettingsLayout />,
    children: [
      { path: 'profile', element: <ProfileSettings /> },
      { path: 'notifications', element: <NotificationSettings /> },
      { path: 'security', element: <SecuritySettings /> },
    ],
  },
]);
```

## Requirements Satisfied

- **Requirement 19.1-19.4**: Responsive design for all screen sizes
- **Requirement 30.1**: Component architecture following Atomic Design
- **Requirement 23.2**: Keyboard navigation support
- **Requirement 23.3**: ARIA labels and semantic HTML

## Future Enhancements

- Add loading states for async content
- Add error boundaries for each layout
- Add breadcrumb navigation
- Add page transition animations
- Add print-friendly layouts
- Add customizable themes per layout
- Add layout persistence (remember sidebar state)

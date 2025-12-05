# Molecular Components

Molecules are combinations of atoms that form simple, reusable UI patterns. They combine multiple atomic components to create more complex functionality while remaining relatively simple and focused.

## Components

### FormField
A complete form field combining Label + Input + Error message.

**Features:**
- Integrated label, input, and error display
- Validation state handling
- Helper text support
- Accessibility compliant (ARIA attributes)
- Required field indicator

**Usage:**
```tsx
import { FormField } from '@/components/molecules';

<FormField
  label="Email Address"
  name="email"
  type="email"
  error={errors.email}
  touched={touched.email}
  helperText="We'll never share your email"
  required
/>
```

### SearchBar
A search input with debouncing and clear functionality.

**Features:**
- Debounced input (configurable delay)
- Search icon
- Clear button
- Optimized for API calls

**Usage:**
```tsx
import { SearchBar } from '@/components/molecules';

<SearchBar
  placeholder="Search products..."
  onSearch={(query) => handleSearch(query)}
  debounceMs={300}
  showClearButton
/>
```

### Card
A flexible card component with header, body, and footer sections.

**Features:**
- Responsive design
- Header with title and description
- Content area
- Footer for actions
- Mobile-optimized styling

**Usage:**
```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/molecules';

<Card>
  <CardHeader>
    <CardTitle>Farm Statistics</CardTitle>
    <CardDescription>Overview of your farm performance</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Your content here</p>
  </CardContent>
  <CardFooter>
    <Button>View Details</Button>
  </CardFooter>
</Card>
```

### EmptyState
A component for displaying "no data" scenarios.

**Features:**
- Optional icon
- Title and description
- Optional call-to-action button
- Centered layout

**Usage:**
```tsx
import { EmptyState } from '@/components/molecules';
import { Package } from 'lucide-react';

<EmptyState
  icon={Package}
  title="No products found"
  description="Try adjusting your search or filters"
  action={{
    label: "Clear filters",
    onClick: () => clearFilters()
  }}
/>
```

### ErrorState
A component for displaying error messages with retry functionality.

**Features:**
- Error icon and styling
- Title and message
- Optional retry button
- Alert-based design
- Accessible (ARIA live regions)

**Usage:**
```tsx
import { ErrorState } from '@/components/molecules';

<ErrorState
  title="Failed to load data"
  message="Unable to connect to the server. Please check your connection."
  onRetry={() => refetch()}
  variant="destructive"
/>
```

### Pagination
A pagination component for navigating through pages of data.

**Features:**
- Previous/Next navigation
- Page number links
- Ellipsis for large page counts
- Accessible navigation

**Usage:**
```tsx
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis
} from '@/components/molecules';

<Pagination>
  <PaginationContent>
    <PaginationItem>
      <PaginationPrevious href="#" />
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#" isActive>1</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationLink href="#">2</PaginationLink>
    </PaginationItem>
    <PaginationItem>
      <PaginationEllipsis />
    </PaginationItem>
    <PaginationItem>
      <PaginationNext href="#" />
    </PaginationItem>
  </PaginationContent>
</Pagination>
```

## Design Principles

1. **Composition**: Molecules combine atoms to create reusable patterns
2. **Single Responsibility**: Each molecule has one clear purpose
3. **Reusability**: Can be used across different contexts
4. **Accessibility**: All components follow WCAG 2.1 Level AA standards
5. **Responsive**: Work seamlessly on mobile, tablet, and desktop

## Atomic Design Hierarchy

```
Atoms (Basic elements)
  ↓
Molecules (Simple combinations) ← You are here
  ↓
Organisms (Complex features)
  ↓
Templates (Page layouts)
  ↓
Pages (Complete views)
```

## Testing

All molecular components should be tested for:
- Rendering with different props
- User interactions (clicks, input changes)
- Accessibility (keyboard navigation, screen readers)
- Responsive behavior
- Error states

## Contributing

When adding new molecular components:
1. Combine 2-3 atomic components
2. Keep the component focused on one pattern
3. Add TypeScript types for all props
4. Include JSDoc comments
5. Add usage examples
6. Update this README
7. Export from index.ts

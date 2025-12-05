# Organism Components

Organisms are complex UI components composed of groups of molecules and/or atoms. They form distinct sections of an interface and represent complete, functional UI patterns.

## Components

### Navigation
A comprehensive navigation component with both desktop and mobile variants.

**Features:**
- Desktop sidebar navigation with logo and user section
- Mobile drawer navigation with hamburger menu
- Role-based menu filtering
- Active route highlighting
- User profile display with avatar
- Quick access to settings and logout

**Usage:**
```tsx
import { Navigation } from '@/components/organisms';

// Desktop variant
<Navigation variant="desktop" />

// Mobile variant
<Navigation variant="mobile" />
```

### DataTable
A feature-rich data table with sorting, filtering, and pagination.

**Features:**
- Column-based sorting (ascending/descending)
- Search/filter functionality
- Pagination with configurable page size
- Custom cell rendering
- Row click handlers
- Empty state handling
- Responsive design

**Usage:**
```tsx
import { DataTable, Column } from '@/components/organisms';

const columns: Column<User>[] = [
  { key: 'name', label: 'Name', sortable: true, filterable: true },
  { key: 'email', label: 'Email', sortable: true, filterable: true },
  { 
    key: 'role', 
    label: 'Role', 
    render: (value) => <Badge>{value}</Badge> 
  },
];

<DataTable
  data={users}
  columns={columns}
  searchable
  searchPlaceholder="Search users..."
  onRowClick={(user) => navigate(`/users/${user.id}`)}
  pageSize={10}
/>
```

### ProductCard
A card component for displaying marketplace products.

**Features:**
- Product image with fallback
- Price and unit display
- Seller information with avatar
- Rating and reviews
- Location display
- Stock status indicators
- Add to cart functionality
- Favorite/bookmark button
- Out of stock handling

**Usage:**
```tsx
import { ProductCard } from '@/components/organisms';

<ProductCard
  product={product}
  onAddToCart={(id) => addToCart(id)}
  onFavorite={(id) => toggleFavorite(id)}
  onClick={(id) => navigate(`/products/${id}`)}
  isFavorited={favorites.includes(product.id)}
  showActions
/>
```

### FarmCard
A card component for displaying farm information.

**Features:**
- Map preview placeholder
- Farm area display
- Location information
- Statistics (fields, crops, yield)
- Edit and delete actions
- Dropdown menu for actions
- Created date display

**Usage:**
```tsx
import { FarmCard } from '@/components/organisms';

<FarmCard
  farm={farm}
  onClick={(id) => navigate(`/farms/${id}`)}
  onEdit={(id) => openEditDialog(id)}
  onDelete={(id) => confirmDelete(id)}
  showActions
/>
```

### NotificationDropdown
A dropdown menu for displaying and managing notifications.

**Features:**
- Unread count badge
- Notification type icons (info, warning, error, success)
- Mark as read functionality
- Mark all as read
- Delete notifications
- Relative time display
- Action URLs for notifications
- Scrollable list with max visible items
- Link to full notifications page

**Usage:**
```tsx
import { NotificationDropdown } from '@/components/organisms';

<NotificationDropdown
  notifications={notifications}
  unreadCount={unreadCount}
  onMarkAsRead={(id) => markAsRead(id)}
  onMarkAllAsRead={() => markAllAsRead()}
  onDelete={(id) => deleteNotification(id)}
  maxVisible={5}
/>
```

### UserMenu
A dropdown menu for user account management and settings.

**Features:**
- User profile display with avatar
- Role badge
- Profile and settings links
- Theme switcher (light/dark/system)
- Notification settings
- Billing (role-based)
- Admin panel access (admin only)
- Help & support
- Logout functionality

**Usage:**
```tsx
import { UserMenu } from '@/components/organisms';

<UserMenu />
```

## Design Principles

1. **Composition**: Organisms are built from molecules and atoms
2. **Reusability**: Each organism is self-contained and reusable
3. **Flexibility**: Props allow customization without modification
4. **Accessibility**: All components follow WCAG 2.1 Level AA standards
5. **Responsiveness**: Components adapt to different screen sizes
6. **Type Safety**: Full TypeScript support with proper interfaces

## Best Practices

1. **Keep organisms focused**: Each organism should have a single, clear purpose
2. **Use composition**: Build organisms from existing molecules and atoms
3. **Provide sensible defaults**: Make components work with minimal configuration
4. **Handle edge cases**: Empty states, loading states, error states
5. **Document thoroughly**: Include usage examples and prop descriptions
6. **Test comprehensively**: Unit tests for logic, integration tests for interactions

## File Structure

```
organisms/
├── Navigation.tsx           # Navigation component
├── DataTable.tsx           # Data table with sorting/filtering
├── ProductCard.tsx         # Marketplace product card
├── FarmCard.tsx           # Farm management card
├── NotificationDropdown.tsx # Notification dropdown menu
├── UserMenu.tsx           # User account menu
├── index.ts               # Barrel exports
└── README.md             # This file
```

## Related Components

- **Atoms**: Basic building blocks (Button, Input, Badge, Avatar, etc.)
- **Molecules**: Simple combinations (FormField, SearchBar, Card, etc.)
- **Templates**: Page layouts that use organisms
- **Pages**: Complete views that use templates

## Requirements Satisfied

- **Requirement 30.1**: Component architecture following Atomic Design
- **Requirement 19.1-19.4**: Responsive design for all screen sizes
- **Requirement 23.2-23.5**: Accessibility compliance (keyboard navigation, ARIA labels)

## Future Enhancements

- Add Storybook stories for each organism
- Add visual regression tests
- Add more organism variants (e.g., different navigation styles)
- Add animation and transition options
- Add internationalization support

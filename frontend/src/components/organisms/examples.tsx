/**
 * Organism Components Examples
 * 
 * This file demonstrates how to use the organism components in your application.
 * These examples show common use cases and patterns.
 */

import React from 'react';
import {
  Navigation,
  DataTable,
  Column,
  ProductCard,
  FarmCard,
  NotificationDropdown,
  UserMenu,
} from './index';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// ============================================================================
// Navigation Examples
// ============================================================================

export function NavigationExamples() {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Desktop Navigation</h3>
        <div className="h-screen border rounded-lg overflow-hidden">
          <Navigation variant="desktop" />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Mobile Navigation</h3>
        <Navigation variant="mobile" />
      </div>
    </div>
  );
}

// ============================================================================
// DataTable Examples
// ============================================================================

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  created_at: string;
}

const sampleUsers: User[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john@example.com',
    role: 'farmer',
    status: 'active',
    created_at: '2024-01-15',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane@example.com',
    role: 'buyer',
    status: 'active',
    created_at: '2024-02-20',
  },
  // Add more sample data...
];

export function DataTableExample() {
  const columns: Column<User>[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      filterable: true,
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      filterable: true,
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      render: (value) => (
        <Badge variant="outline">
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </Badge>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (value) => (
        <Badge variant={value === 'active' ? 'default' : 'secondary'}>
          {value}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      label: 'Created',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">User Management Table</h3>
      <DataTable
        data={sampleUsers}
        columns={columns}
        searchable
        searchPlaceholder="Search users..."
        onRowClick={(user) => console.log('Clicked user:', user)}
        pageSize={10}
      />
    </div>
  );
}

// ============================================================================
// ProductCard Examples
// ============================================================================

const sampleProduct = {
  id: '1',
  name: 'Fresh Organic Tomatoes',
  description: 'Locally grown, pesticide-free tomatoes perfect for salads and cooking.',
  price: 50,
  currency: 'KES',
  unit: 'kg',
  quantity_available: 100,
  images: [
    { url: '/images/tomatoes.jpg', is_primary: true },
  ],
  seller: {
    first_name: 'John',
    last_name: 'Farmer',
    avatar: '/avatars/john.jpg',
  },
  location: {
    address: 'Nairobi, Kenya',
  },
  rating: 4.5,
  reviews_count: 23,
  is_active: true,
};

export function ProductCardExample() {
  const [favorites, setFavorites] = React.useState<string[]>([]);

  const handleAddToCart = (productId: string) => {
    console.log('Added to cart:', productId);
  };

  const handleFavorite = (productId: string) => {
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Product Card</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ProductCard
          product={sampleProduct}
          onAddToCart={handleAddToCart}
          onFavorite={handleFavorite}
          onClick={(id) => console.log('View product:', id)}
          isFavorited={favorites.includes(sampleProduct.id)}
          showActions
        />
        <ProductCard
          product={{ ...sampleProduct, quantity_available: 0 }}
          onAddToCart={handleAddToCart}
          showActions
        />
      </div>
    </div>
  );
}

// ============================================================================
// FarmCard Examples
// ============================================================================

const sampleFarm = {
  id: '1',
  name: 'Green Valley Farm',
  description: 'A sustainable organic farm specializing in vegetables and fruits.',
  area: 25,
  area_unit: 'hectares' as const,
  location: {
    latitude: -1.2921,
    longitude: 36.8219,
    address: 'Kiambu County, Kenya',
  },
  created_at: '2023-06-15T10:00:00Z',
  statistics: {
    active_fields: 5,
    total_crops: 12,
    yield_this_season: 5000,
  },
};

export function FarmCardExample() {
  const handleEdit = (farmId: string) => {
    console.log('Edit farm:', farmId);
  };

  const handleDelete = (farmId: string) => {
    console.log('Delete farm:', farmId);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Farm Card</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <FarmCard
          farm={sampleFarm}
          onClick={(id) => console.log('View farm:', id)}
          onEdit={handleEdit}
          onDelete={handleDelete}
          showActions
        />
      </div>
    </div>
  );
}

// ============================================================================
// NotificationDropdown Examples
// ============================================================================

const sampleNotifications = [
  {
    id: '1',
    type: 'success' as const,
    title: 'Order Confirmed',
    message: 'Your order #12345 has been confirmed and is being processed.',
    is_read: false,
    action_url: '/orders/12345',
    created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString(), // 5 minutes ago
  },
  {
    id: '2',
    type: 'warning' as const,
    title: 'Low Stock Alert',
    message: 'Your product "Tomatoes" is running low on stock.',
    is_read: false,
    created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 minutes ago
  },
  {
    id: '3',
    type: 'info' as const,
    title: 'New Message',
    message: 'You have a new message from John Doe.',
    is_read: true,
    action_url: '/messages',
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
  },
];

export function NotificationDropdownExample() {
  const [notifications, setNotifications] = React.useState(sampleNotifications);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
    );
  };

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleDelete = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Notification Dropdown</h3>
      <div className="flex justify-center p-8 border rounded-lg">
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          onMarkAsRead={handleMarkAsRead}
          onMarkAllAsRead={handleMarkAllAsRead}
          onDelete={handleDelete}
          maxVisible={5}
        />
      </div>
    </div>
  );
}

// ============================================================================
// UserMenu Example
// ============================================================================

export function UserMenuExample() {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">User Menu</h3>
      <div className="flex justify-center p-8 border rounded-lg">
        <UserMenu />
      </div>
    </div>
  );
}

// ============================================================================
// All Examples Combined
// ============================================================================

export function AllOrganismExamples() {
  return (
    <div className="container mx-auto p-8 space-y-12">
      <div>
        <h1 className="text-3xl font-bold mb-2">Organism Components</h1>
        <p className="text-muted-foreground">
          Complex UI components composed of molecules and atoms
        </p>
      </div>

      <DataTableExample />
      <ProductCardExample />
      <FarmCardExample />
      <NotificationDropdownExample />
      <UserMenuExample />
    </div>
  );
}

/**
 * Molecular Components Examples
 * 
 * This file demonstrates usage of all molecular components.
 * Use these examples as reference for implementing features.
 */

import React from 'react';
import {
  FormField,
  SearchBar,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  EmptyState,
  ErrorState,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
} from './index';
import { Button } from '@/components/ui/button';
import { Package, Inbox } from 'lucide-react';

export const MolecularComponentsExamples: React.FC = () => {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [formData, setFormData] = React.useState({
    email: '',
    password: '',
  });
  const [touched, setTouched] = React.useState({
    email: false,
    password: false,
  });

  const validateEmail = (email: string) => {
    if (!email) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return 'Invalid email address';
    return undefined;
  };

  const validatePassword = (password: string) => {
    if (!password) return 'Password is required';
    if (password.length < 8) return 'Password must be at least 8 characters';
    return undefined;
  };

  return (
    <div className="space-y-12 p-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold mb-2">Molecular Components</h1>
        <p className="text-muted-foreground">
          Examples of molecular components combining atoms into reusable patterns
        </p>
      </div>

      {/* FormField Examples */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">FormField</h2>
          <p className="text-muted-foreground mb-4">
            Complete form fields with labels, inputs, and validation
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            label="Email Address"
            name="email"
            type="email"
            placeholder="john@example.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            onBlur={() => setTouched({ ...touched, email: true })}
            error={validateEmail(formData.email)}
            touched={touched.email}
            helperText="We'll never share your email"
            required
          />

          <FormField
            label="Password"
            name="password"
            type="password"
            placeholder="••••••••"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            onBlur={() => setTouched({ ...touched, password: true })}
            error={validatePassword(formData.password)}
            touched={touched.password}
            helperText="Must be at least 8 characters"
            required
          />
        </div>
      </section>

      {/* SearchBar Examples */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">SearchBar</h2>
          <p className="text-muted-foreground mb-4">
            Debounced search input with clear functionality
          </p>
        </div>

        <div className="space-y-4">
          <SearchBar
            placeholder="Search products..."
            onSearch={setSearchQuery}
            debounceMs={300}
            showClearButton
          />
          
          {searchQuery && (
            <p className="text-sm text-muted-foreground">
              Searching for: <span className="font-medium">{searchQuery}</span>
            </p>
          )}
        </div>
      </section>

      {/* Card Examples */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Card</h2>
          <p className="text-muted-foreground mb-4">
            Flexible card component with header, content, and footer
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Farm Statistics</CardTitle>
              <CardDescription>Overview of your farm performance this month</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Yield</span>
                  <span className="font-medium">2,450 kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Revenue</span>
                  <span className="font-medium">$12,500</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Active Crops</span>
                  <span className="font-medium">8</span>
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">View Details</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest farming activities</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium">Tomatoes harvested</p>
                  <p className="text-muted-foreground">2 hours ago</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium">Irrigation system activated</p>
                  <p className="text-muted-foreground">5 hours ago</p>
                </div>
                <div className="text-sm">
                  <p className="font-medium">New order received</p>
                  <p className="text-muted-foreground">1 day ago</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* EmptyState Examples */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">EmptyState</h2>
          <p className="text-muted-foreground mb-4">
            Friendly messages for empty data scenarios
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Package}
              title="No products found"
              description="Try adjusting your search or filters to find what you're looking for"
              action={{
                label: 'Clear filters',
                onClick: () => console.log('Filters cleared'),
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <EmptyState
              icon={Inbox}
              title="No notifications yet"
              description="When you receive notifications, they'll appear here"
            />
          </CardContent>
        </Card>
      </section>

      {/* ErrorState Examples */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">ErrorState</h2>
          <p className="text-muted-foreground mb-4">
            Error messages with retry functionality
          </p>
        </div>

        <ErrorState
          title="Failed to load data"
          message="Unable to connect to the server. Please check your internet connection and try again."
          onRetry={() => console.log('Retrying...')}
          variant="destructive"
        />

        <ErrorState
          title="Something went wrong"
          message="An unexpected error occurred. Our team has been notified."
          variant="default"
        />
      </section>

      {/* Pagination Examples */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Pagination</h2>
          <p className="text-muted-foreground mb-4">
            Navigate through pages of data
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>
                    1
                  </PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">2</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">3</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationEllipsis />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#">10</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardContent>
        </Card>
      </section>

      {/* Combined Example */}
      <section className="space-y-4">
        <div>
          <h2 className="text-2xl font-semibold mb-2">Combined Example</h2>
          <p className="text-muted-foreground mb-4">
            Multiple molecules working together
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Product Search</CardTitle>
            <CardDescription>Find products in the marketplace</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <SearchBar
              placeholder="Search for products..."
              onSearch={(query) => console.log('Searching:', query)}
              debounceMs={300}
            />
            
            <EmptyState
              icon={Package}
              title="Start searching"
              description="Enter a product name to see results"
            />
          </CardContent>
          <CardFooter>
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious href="#" />
                </PaginationItem>
                <PaginationItem>
                  <PaginationLink href="#" isActive>1</PaginationLink>
                </PaginationItem>
                <PaginationItem>
                  <PaginationNext href="#" />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </CardFooter>
        </Card>
      </section>
    </div>
  );
};

export default MolecularComponentsExamples;

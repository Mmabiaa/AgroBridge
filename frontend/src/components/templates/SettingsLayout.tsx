import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { User, Bell, Lock, CreditCard, Globe, Palette, Shield, HelpCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SettingsLayoutProps {
  children?: React.ReactNode;
}

interface SettingsTab {
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const settingsTabs: SettingsTab[] = [
  {
    label: 'Profile',
    path: '/settings/profile',
    icon: User,
    description: 'Manage your personal information',
  },
  {
    label: 'Notifications',
    path: '/settings/notifications',
    icon: Bell,
    description: 'Configure notification preferences',
  },
  {
    label: 'Security',
    path: '/settings/security',
    icon: Lock,
    description: 'Password and security settings',
  },
  {
    label: 'Billing',
    path: '/settings/billing',
    icon: CreditCard,
    description: 'Manage payment methods and billing',
  },
  {
    label: 'Language & Region',
    path: '/settings/language',
    icon: Globe,
    description: 'Language and regional preferences',
  },
  {
    label: 'Appearance',
    path: '/settings/appearance',
    icon: Palette,
    description: 'Theme and display settings',
  },
  {
    label: 'Privacy',
    path: '/settings/privacy',
    icon: Shield,
    description: 'Privacy and data settings',
  },
  {
    label: 'Help & Support',
    path: '/settings/help',
    icon: HelpCircle,
    description: 'Get help and contact support',
  },
];

export function SettingsLayout({ children }: SettingsLayoutProps) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-6 md:py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Sidebar Navigation - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <nav className="space-y-1">
              {settingsTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <Link
                    key={tab.path}
                    to={tab.path}
                    className={cn(
                      'flex items-start gap-3 px-4 py-3 rounded-lg transition-colors',
                      isActive(tab.path)
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted'
                    )}
                  >
                    <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{tab.label}</div>
                      <div
                        className={cn(
                          'text-xs mt-0.5',
                          isActive(tab.path)
                            ? 'text-primary-foreground/80'
                            : 'text-muted-foreground'
                        )}
                      >
                        {tab.description}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </aside>

          {/* Tabs Navigation - Mobile */}
          <div className="lg:hidden">
            <div className="border rounded-lg p-1 bg-muted/50">
              <div className="grid grid-cols-2 gap-1">
                {settingsTabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <Link
                      key={tab.path}
                      to={tab.path}
                      className={cn(
                        'flex flex-col items-center gap-1 px-3 py-2 rounded-md transition-colors text-center',
                        isActive(tab.path)
                          ? 'bg-background shadow-sm'
                          : 'hover:bg-background/50'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-xs font-medium">{tab.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            <div className="bg-card border rounded-lg p-6 md:p-8">
              {children || <Outlet />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

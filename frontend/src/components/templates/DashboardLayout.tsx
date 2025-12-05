import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Navigation } from '@/components/organisms/Navigation';
import { NotificationDropdown } from '@/components/organisms/NotificationDropdown';
import { UserMenu } from '@/components/organisms/UserMenu';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

interface DashboardLayoutProps {
  children?: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  
  // Mock notifications - replace with actual context when available
  const notifications: any[] = [];
  const unreadCount = 0;
  const markAsRead = (id: string) => console.log('Mark as read:', id);
  const markAllAsRead = () => console.log('Mark all as read');
  const deleteNotification = (id: string) => console.log('Delete:', id);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <header className="lg:hidden sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <Menu className="h-6 w-6" />
            </Button>
            <h1 className="text-xl font-bold text-primary">AgroBridge</h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onDelete={deleteNotification}
            />
            <UserMenu />
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block">
          <Navigation variant="desktop" />
        </div>

        {/* Mobile Sidebar Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <div
              className="fixed inset-y-0 left-0 w-64 bg-background border-r"
              onClick={(e) => e.stopPropagation()}
            >
              <Navigation variant="desktop" />
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-h-screen">
          {/* Desktop Header */}
          <header className="hidden lg:flex sticky top-0 z-30 h-16 items-center justify-end gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
            <NotificationDropdown
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
              onDelete={deleteNotification}
            />
            <UserMenu />
          </header>

          {/* Page Content */}
          <main className="flex-1 p-4 md:p-6 lg:p-8">
            {children || <Outlet />}
          </main>

          {/* Footer */}
          <footer className="border-t py-6 px-4 md:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
              <p>© 2024 AgroBridge. All rights reserved.</p>
              <div className="flex gap-4">
                <a href="/privacy" className="hover:text-foreground transition-colors">
                  Privacy Policy
                </a>
                <a href="/terms" className="hover:text-foreground transition-colors">
                  Terms of Service
                </a>
                <a href="/help" className="hover:text-foreground transition-colors">
                  Help
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

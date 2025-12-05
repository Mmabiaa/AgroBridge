import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { Sprout } from 'lucide-react';

interface AuthLayoutProps {
  children?: React.ReactNode;
  title?: string;
  description?: string;
  showBackToHome?: boolean;
}

export function AuthLayout({
  children,
  title,
  description,
  showBackToHome = true,
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen grid lg:grid-cols-2">
      {/* Left Side - Form */}
      <div className="flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-md space-y-8">
          {/* Logo */}
          <div className="flex flex-col items-center">
            <Link to="/" className="flex items-center gap-2 mb-6">
              <div className="h-12 w-12 rounded-full bg-primary flex items-center justify-center">
                <Sprout className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-2xl font-bold text-primary">AgroBridge</span>
            </Link>

            {title && (
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
                {description && (
                  <p className="text-muted-foreground">{description}</p>
                )}
              </div>
            )}
          </div>

          {/* Form Content */}
          <div className="mt-8">
            {children || <Outlet />}
          </div>

          {/* Footer Links */}
          <div className="text-center space-y-2">
            {showBackToHome && (
              <Link
                to="/"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                ← Back to Home
              </Link>
            )}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <Link to="/privacy" className="hover:text-foreground transition-colors">
                Privacy
              </Link>
              <span>•</span>
              <Link to="/terms" className="hover:text-foreground transition-colors">
                Terms
              </Link>
              <span>•</span>
              <Link to="/help" className="hover:text-foreground transition-colors">
                Help
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Hero Image/Content */}
      <div className="hidden lg:block relative bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
        <div className="absolute inset-0 flex flex-col items-center justify-center p-12 text-center">
          <div className="max-w-lg space-y-6">
            <h1 className="text-4xl font-bold text-green-900 dark:text-green-50">
              Empowering African Agriculture
            </h1>
            <p className="text-lg text-green-700 dark:text-green-200">
              Connect with farmers, access markets, and grow your agricultural business
              with AgroBridge's comprehensive platform.
            </p>
            <div className="grid grid-cols-3 gap-4 pt-8">
              <div className="space-y-2">
                <div className="text-3xl font-bold text-green-900 dark:text-green-50">
                  10K+
                </div>
                <div className="text-sm text-green-700 dark:text-green-200">
                  Active Farmers
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-green-900 dark:text-green-50">
                  5K+
                </div>
                <div className="text-sm text-green-700 dark:text-green-200">
                  Products Listed
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-3xl font-bold text-green-900 dark:text-green-50">
                  15+
                </div>
                <div className="text-sm text-green-700 dark:text-green-200">
                  Countries
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-10 right-10 h-32 w-32 rounded-full bg-green-200/50 dark:bg-green-800/50 blur-3xl" />
        <div className="absolute bottom-10 left-10 h-40 w-40 rounded-full bg-green-300/50 dark:bg-green-700/50 blur-3xl" />
      </div>
    </div>
  );
}

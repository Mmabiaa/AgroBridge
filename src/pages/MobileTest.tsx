import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Smartphone, Menu, LogOut, CheckCircle, Scroll } from 'lucide-react';

export default function MobileTest() {
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (result: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${result}`]);
  };

  const testMobileMenu = () => {
    addTestResult('📱 Testing mobile menu visibility...');
    addTestResult('✅ Mobile menu should be accessible via hamburger icon (☰)');
    addTestResult('✅ Look for hamburger menu in top-right corner');
  };

  const testScrollableMenu = () => {
    addTestResult('📜 Testing scrollable mobile menu...');
    addTestResult('✅ Open mobile menu (click hamburger icon)');
    addTestResult('✅ Menu should have a header with "Menu" title');
    addTestResult('✅ Content should be scrollable up and down');
    addTestResult('✅ Scroll to bottom to find "Account" section');
    addTestResult('✅ Logout button should be visible at the bottom');
  };

  const testLogoutButton = () => {
    addTestResult('🔴 Testing logout button in mobile menu...');
    addTestResult('✅ Open mobile menu (click hamburger icon)');
    addTestResult('✅ Scroll down to the bottom of the menu');
    addTestResult('✅ Look for "Account" section');
    addTestResult('✅ Find red "Logout" button with logout icon');
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-accent/10 py-8 px-4">
      <div className="container mx-auto max-w-4xl space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold flex items-center justify-center gap-3">
            <Smartphone className="h-8 w-8 text-primary" />
            Mobile Navigation Test
          </h1>
          <p className="text-muted-foreground">Test the scrollable mobile navigation and logout functionality</p>
        </div>

        {/* Instructions */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>📱 Mobile Navigation Instructions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Badge variant="outline">1</Badge>
                <div>
                  <h4 className="font-semibold">Find the Hamburger Menu</h4>
                  <p className="text-sm text-muted-foreground">
                    Look for the hamburger icon (☰) in the top-right corner of the navigation bar
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge variant="outline">2</Badge>
                <div>
                  <h4 className="font-semibold">Open Mobile Menu</h4>
                  <p className="text-sm text-muted-foreground">
                    Click the hamburger icon to open the mobile navigation menu
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge variant="outline">3</Badge>
                <div>
                  <h4 className="font-semibold">Scroll Through Menu</h4>
                  <p className="text-sm text-muted-foreground">
                    The menu is now scrollable! Scroll up and down to see all sections
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <Badge variant="outline">4</Badge>
                <div>
                  <h4 className="font-semibold">Find Logout Button</h4>
                  <p className="text-sm text-muted-foreground">
                    Scroll to the bottom to find the "Account" section with the red "Logout" button
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Visual Guide */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>🎯 Visual Guide - Scrollable Menu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Scrollable Mobile Menu Layout:</h4>
                <div className="text-sm space-y-1 font-mono">
                  <div>┌─────────────────────────────────┐</div>
                  <div>│ 📋 Menu Header                   │ ← Fixed Header</div>
                  <div>│ Navigate and manage account     │</div>
                  <div>│ ─────────────────────────────── │</div>
                  <div>│                                 │</div>
                  <div>│ Navigation:                     │</div>
                  <div>│ [Dashboard]                     │</div>
                  <div>│ [AgriGPT]                       │</div>
                  <div>│ [Farm Monitor]                  │</div>
                  <div>│ [Analytics]                     │</div>
                  <div>│ [Marketplace]                   │</div>
                  <div>│ [Settings]                      │</div>
                  <div>│ [Support]                       │</div>
                  <div>│                                 │</div>
                  <div>│ ─────────────────────────────── │</div>
                  <div>│ Quick Actions:                  │</div>
                  <div>│ [📷 Disease Detection]          │</div>
                  <div>│ [🎤 Voice Commands]             │</div>
                  <div>│ [🔔 Notifications]              │</div>
                  <div>│                                 │</div>
                  <div>│ ─────────────────────────────── │</div>
                  <div>│ Account:                        │</div>
                  <div>│ 👤 Kwame Addo                   │</div>
                  <div>│    kwame.addo@email.com         │</div>
                  <div>│                                 │</div>
                  <div>│ 🔴 [↪️ Logout] ← HERE!          │</div>
                  <div>│                                 │ ← Scrollable Area</div>
                  <div>└─────────────────────────────────┘</div>
                </div>
              </div>
              
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">🆕 New Features:</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• <strong>Fixed Header:</strong> Menu title stays at top</li>
                  <li>• <strong>Scrollable Content:</strong> All sections accessible</li>
                  <li>• <strong>Better Organization:</strong> Clear section headers</li>
                  <li>• <strong>Easy Navigation:</strong> Smooth scrolling experience</li>
                  <li>• <strong>Always Accessible:</strong> Logout button always reachable</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Test Controls */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>🧪 Test Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <Button 
                onClick={testMobileMenu}
                variant="outline"
                className="flex-1"
              >
                <Menu className="h-4 w-4 mr-2" />
                Test Menu
              </Button>
              <Button 
                onClick={testScrollableMenu}
                variant="outline"
                className="flex-1"
              >
                <Scroll className="h-4 w-4 mr-2" />
                Test Scroll
              </Button>
              <Button 
                onClick={testLogoutButton}
                variant="outline"
                className="flex-1"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Test Logout
              </Button>
            </div>
            <Button 
              onClick={clearResults}
              variant="ghost"
              className="w-full"
            >
              Clear Results
            </Button>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>📊 Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {testResults.length === 0 ? (
                <p className="text-muted-foreground">No test results yet. Click test buttons above to start.</p>
              ) : (
                testResults.map((result, index) => (
                  <div key={index} className="text-sm p-2 bg-muted rounded flex items-center gap-2">
                    <CheckCircle className="h-3 w-3 text-green-600" />
                    {result}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Troubleshooting */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>🔧 Troubleshooting</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <h4 className="font-semibold">If you can't see the mobile menu:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Make sure you're on a mobile device or using mobile view</li>
                <li>• Resize your browser window to be smaller (less than 1024px wide)</li>
                <li>• Look for the hamburger icon (☰) in the top-right corner</li>
                <li>• Try refreshing the page (Ctrl+F5)</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">If you can't scroll the menu:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Make sure the mobile menu is fully open</li>
                <li>• Try scrolling with your mouse wheel or touch gestures</li>
                <li>• The menu should have a fixed header and scrollable content</li>
                <li>• All sections should be accessible by scrolling</li>
              </ul>
            </div>
            
            <div className="space-y-2">
              <h4 className="font-semibold">If you can't see the logout button:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Scroll to the very bottom of the mobile menu</li>
                <li>• Look for the "Account" section</li>
                <li>• The logout button should be a red button with "Logout" text</li>
                <li>• Make sure you've scrolled past all other sections</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
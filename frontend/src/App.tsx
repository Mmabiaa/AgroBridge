import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Navigation } from "@/components/Navigation";
import { AuthProvider } from "@/contexts/AuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ApiProvider } from "@/contexts/ApiProvider";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import ErrorBoundary from "@/components/ErrorBoundary"; // Import the ErrorBoundary
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfileSetup from "./pages/ProfileSetup";
import Dashboard from "./pages/Dashboard";
import AgriGPT from "./pages/AgriGPT";
import Monitoring from "./pages/Monitoring";
import Analytics from "./pages/Analytics";
import Marketplace from "./pages/Marketplace";
import ProductDetails from "./pages/ProductDetails";
import EditProduct from "./pages/EditProduct";
import MyOrders from "./pages/MyOrders";
import MySales from "./pages/MySales";
import Farms from "./pages/Farms";
import FarmDetails from "./pages/FarmDetails";
import CreateFarm from "./pages/CreateFarm";
import EditFarm from "./pages/EditFarm";
import Learning from "./pages/Learning";
import CourseDetails from "./pages/CourseDetails";
import LessonViewer from "./pages/LessonViewer";
import Certificates from "./pages/Certificates";
import Community from "./pages/Community";
import { UserProfile } from "./components/community/UserProfile";
import Messages from "./pages/Messages";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Search from "./pages/Search";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import CropDiseaseDetection from "./pages/CropDiseaseDetection";
import VoiceCommandsPage from "./pages/VoiceCommands";
import Notifications from "./pages/Notifications";
import NotificationSettings from "./pages/NotificationSettings";
import SmartScheduling from "./pages/SmartScheduling";
import BlockchainCertificates from "./pages/BlockchainCertificates";
import ARVisualization from "./pages/ARVisualization";
import SatelliteIntegration from "./pages/SatelliteIntegration";
import IoTSensorNetwork from "./pages/IoTSensorNetwork";
import SocialLearningPlatform from "./pages/SocialLearningPlatform";
import FinancialPlanning from "./pages/FinancialPlanning";
import EmergencyResponse from "./pages/EmergencyResponse";
import DroneIntegration from "./pages/DroneIntegration";
import ExportDocumentation from "./pages/ExportDocumentation";
import Support from "./pages/Support";
import CropCalendar from "./pages/CropCalendar";
import FarmerStories from "./pages/FarmerStories";
import DevDashboard from "./pages/DevDashboard";
import { VoiceFab } from '@/components/VoiceFab';
import { FeatureFlagsProvider } from '@/contexts/FeatureFlagsContext';
import { FeatureFlaggedVoiceFab } from '@/components/FeatureFlaggedVoiceFab';
import { AuthSessionManager } from '@/components/AuthSessionManager';

// Fallback component for when errors occur
const ErrorFallback = ({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-screen p-4">
    <div className="max-w-md w-full p-6 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-red-200 dark:border-red-800">
      <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-4">
        Something went wrong
      </h2>
      <p className="text-gray-600 dark:text-gray-300 mb-4">
        {error.message || "An unexpected error occurred"}
      </p>
      <div className="flex gap-2">
        <button
          onClick={resetErrorBoundary}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
        >
          Try Again
        </button>
        <button
          onClick={() => window.location.href = '/dashboard'}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
        >
          Go to Dashboard
        </button>
      </div>
    </div>
  </div>
);

const App = () => (
  <ErrorBoundary fallback={<ErrorFallback error={new Error("App crashed")} resetErrorBoundary={() => window.location.reload()} />}>
    <ApiProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <FeatureFlagsProvider>
          <AuthProvider>
            <AuthSessionManager>
              <NotificationProvider>
                <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                <Routes>
                  {/* Public routes without navigation */}
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password/:token" element={<ResetPassword />} />
                  
                  {/* Protected routes with main navigation */}
                  <Route path="/*" element={
                    <ProtectedRoute>
                      <Navigation />
                      <FeatureFlaggedVoiceFab />
                      <Routes>
                        {/* Core Dashboard - accessible to all authenticated users */}
                        <Route path="/dashboard" element={
                          <ProtectedRoute requiredPermission="view_dashboard">
                            <ErrorBoundary>
                              <Dashboard />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        
                        {/* AI and Smart Tools */}
                        <Route path="/agrigpt" element={
                          <ProtectedRoute requiredPermission="use_agrigpt">
                            <ErrorBoundary>
                              <AgriGPT />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/crop-disease-detection" element={
                          <ProtectedRoute requiredPermission="use_crop_detection">
                            <ErrorBoundary>
                              <CropDiseaseDetection />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/voice-commands" element={
                          <ProtectedRoute requiredPermission="use_voice_commands">
                            <ErrorBoundary>
                              <VoiceCommandsPage />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        
                        {/* Monitoring and Analytics */}
                        <Route path="/monitoring" element={
                          <ProtectedRoute requiredPermission="view_monitoring">
                            <ErrorBoundary>
                              <Monitoring />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/analytics" element={
                          <ProtectedRoute requiredPermission="view_analytics">
                            <ErrorBoundary>
                              <Analytics />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        
                        {/* Farm Management */}
                        <Route path="/farms" element={
                          <ProtectedRoute requiredPermission="view_farms">
                            <ErrorBoundary>
                              <Farms />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/farms/new" element={
                          <ProtectedRoute requiredPermission="view_farms">
                            <ErrorBoundary>
                              <CreateFarm />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/farms/:id" element={
                          <ProtectedRoute requiredPermission="view_farms">
                            <ErrorBoundary>
                              <FarmDetails />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/farms/:id/edit" element={
                          <ProtectedRoute requiredPermission="view_farms">
                            <ErrorBoundary>
                              <EditFarm />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        
                        {/* Marketplace and Commerce */}
                        <Route path="/marketplace" element={
                          <ProtectedRoute requiredPermission="view_marketplace">
                            <ErrorBoundary>
                              <Marketplace />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/marketplace/products/:id" element={
                          <ProtectedRoute requiredPermission="view_marketplace">
                            <ErrorBoundary>
                              <ProductDetails />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/marketplace/products/:id/edit" element={
                          <ProtectedRoute requiredPermission="view_marketplace">
                            <ErrorBoundary>
                              <EditProduct />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/my-orders" element={
                          <ProtectedRoute requiredPermission="view_marketplace">
                            <ErrorBoundary>
                              <MyOrders />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        
                        <Route path="/my-sales" element={
                          <ProtectedRoute requiredPermission="view_marketplace">
                            <ErrorBoundary>
                              <MySales />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        
                        {/* Planning and Management */}
                        <Route path="/crop-calendar" element={
                          <ProtectedRoute requiredPermission="view_smart_scheduling">
                            <ErrorBoundary>
                              <CropCalendar />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/smart-scheduling" element={
                          <ProtectedRoute requiredPermission="view_smart_scheduling">
                            <ErrorBoundary>
                              <SmartScheduling />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/financial-planning" element={
                          <ProtectedRoute requiredPermission="view_financial_planning">
                            <ErrorBoundary>
                              <FinancialPlanning />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        
                        {/* Learning and Community */}
                        <Route path="/learning" element={
                          <ProtectedRoute requiredPermission="view_learning">
                            <ErrorBoundary>
                              <Learning />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/learning/courses/:courseId" element={
                          <ProtectedRoute requiredPermission="view_learning">
                            <ErrorBoundary>
                              <CourseDetails />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/learning/lessons/:lessonId" element={
                          <ProtectedRoute requiredPermission="view_learning">
                            <ErrorBoundary>
                              <LessonViewer />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/learning/certificates" element={
                          <ProtectedRoute requiredPermission="view_learning">
                            <ErrorBoundary>
                              <Certificates />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/community" element={
                          <ProtectedRoute requiredPermission="view_community">
                            <ErrorBoundary>
                              <Community />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/community/users/:userId" element={
                          <ProtectedRoute requiredPermission="view_community">
                            <ErrorBoundary>
                              <UserProfile />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/messages" element={
                          <ProtectedRoute requiredPermission="view_community">
                            <ErrorBoundary>
                              <Messages />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/farmer-stories" element={
                          <ProtectedRoute requiredPermission="view_community">
                            <ErrorBoundary>
                              <FarmerStories />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        
                        {/* Advanced Technologies */}
                        <Route path="/satellite-integration" element={
                          <ProtectedRoute requiredPermission="use_satellite_integration">
                            <ErrorBoundary>
                              <SatelliteIntegration />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/iot-sensor-network" element={
                          <ProtectedRoute requiredPermission="use_iot_sensors">
                            <ErrorBoundary>
                              <IoTSensorNetwork />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/drone-integration" element={
                          <ProtectedRoute requiredPermission="use_drone_integration">
                            <ErrorBoundary>
                              <DroneIntegration />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/ar-visualization" element={
                          <ProtectedRoute requiredPermission="use_ar_visualization">
                            <ErrorBoundary>
                              <ARVisualization />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        <Route path="/blockchain-certificates" element={
                          <ProtectedRoute requiredPermission="use_blockchain">
                            <ErrorBoundary>
                              <BlockchainCertificates />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        
                        {/* System and Settings */}
                        <Route path="/settings" element={
                          <ErrorBoundary>
                            <Settings />
                          </ErrorBoundary>
                        } />
                        <Route path="/settings/notifications" element={
                          <ErrorBoundary>
                            <NotificationSettings />
                          </ErrorBoundary>
                        } />
                        <Route path="/notifications" element={
                          <ErrorBoundary>
                            <Notifications />
                          </ErrorBoundary>
                        } />
                        <Route path="/support" element={
                          <ErrorBoundary>
                            <Support />
                          </ErrorBoundary>
                        } />
                        
                        {/* Other Features */}
                        <Route path="/profile-setup" element={
                          <ErrorBoundary>
                            <ProfileSetup />
                          </ErrorBoundary>
                        } />
                        <Route path="/search" element={
                          <ErrorBoundary>
                            <Search />
                          </ErrorBoundary>
                        } />
                        <Route path="/social-learning" element={
                          <ErrorBoundary>
                            <SocialLearningPlatform />
                          </ErrorBoundary>
                        } />
                        <Route path="/emergency-response" element={
                          <ErrorBoundary>
                            <EmergencyResponse />
                          </ErrorBoundary>
                        } />
                        <Route path="/export-documentation" element={
                          <ErrorBoundary>
                            <ExportDocumentation />
                          </ErrorBoundary>
                        } />
                        
                        {/* Admin Panel */}
                        <Route path="/admin" element={
                          <ProtectedRoute requiredPermission="view_admin_dashboard">
                            <ErrorBoundary>
                              <Admin />
                            </ErrorBoundary>
                          </ProtectedRoute>
                        } />
                        
                        {/* Development Dashboard - Only in development */}
                        {import.meta.env.DEV && (
                          <Route path="/dev" element={
                            <ErrorBoundary>
                              <DevDashboard />
                            </ErrorBoundary>
                          } />
                        )}
                        
                        <Route path="*" element={
                          <ErrorBoundary>
                            <NotFound />
                          </ErrorBoundary>
                        } />
                      </Routes>
                    </ProtectedRoute>
                  } />
                </Routes>
              </BrowserRouter>
                </TooltipProvider>
              </NotificationProvider>
            </AuthSessionManager>
          </AuthProvider>
        </FeatureFlagsProvider>
      </ThemeProvider>
    </ApiProvider>
  </ErrorBoundary>
);

export default App;
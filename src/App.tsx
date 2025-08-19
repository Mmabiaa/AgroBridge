
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { Navigation } from "@/components/Navigation";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ProfileSetup from "./pages/ProfileSetup";
import Dashboard from "./pages/Dashboard";
import AgriGPT from "./pages/AgriGPT";
import Monitoring from "./pages/Monitoring";
import Analytics from "./pages/Analytics";
import Marketplace from "./pages/Marketplace";
import Learning from "./pages/Learning";
import Community from "./pages/Community";
import Settings from "./pages/Settings";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import Search from "./pages/Search";
import CropDiseaseDetection from "./pages/CropDiseaseDetection";
import VoiceCommandsPage from "./pages/VoiceCommands";
import Notifications from "./pages/Notifications";
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
import { VoiceFab } from '@/components/VoiceFab';
import { FeatureFlagsProvider } from '@/contexts/FeatureFlagsContext';
import { FeatureFlaggedVoiceFab } from '@/components/FeatureFlaggedVoiceFab';

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <FeatureFlagsProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                {/* Public routes without navigation */}
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Protected routes with main navigation */}
                <Route path="/*" element={
                  <ProtectedRoute>
                    <Navigation />
                    <FeatureFlaggedVoiceFab />
                    <Routes>
                      {/* Core Dashboard - accessible to all authenticated users */}
                      <Route path="/dashboard" element={
                        <ProtectedRoute requiredPermission="view_dashboard">
                          <Dashboard />
                        </ProtectedRoute>
                      } />
                      
                      {/* AI and Smart Tools */}
                      <Route path="/agrigpt" element={
                        <ProtectedRoute requiredPermission="use_agrigpt">
                          <AgriGPT />
                        </ProtectedRoute>
                      } />
                      <Route path="/crop-disease-detection" element={
                        <ProtectedRoute requiredPermission="use_crop_detection">
                          <CropDiseaseDetection />
                        </ProtectedRoute>
                      } />
                      <Route path="/voice-commands" element={
                        <ProtectedRoute requiredPermission="use_voice_commands">
                          <VoiceCommandsPage />
                        </ProtectedRoute>
                      } />
                      
                      {/* Monitoring and Analytics */}
                      <Route path="/monitoring" element={
                        <ProtectedRoute requiredPermission="view_monitoring">
                          <Monitoring />
                        </ProtectedRoute>
                      } />
                      <Route path="/analytics" element={
                        <ProtectedRoute requiredPermission="view_analytics">
                          <Analytics />
                        </ProtectedRoute>
                      } />
                      
                      {/* Marketplace and Commerce */}
                      <Route path="/marketplace" element={
                        <ProtectedRoute requiredPermission="view_marketplace">
                          <Marketplace />
                        </ProtectedRoute>
                      } />
                      
                      {/* Planning and Management */}
                      <Route path="/crop-calendar" element={
                        <ProtectedRoute requiredPermission="view_smart_scheduling">
                          <CropCalendar />
                        </ProtectedRoute>
                      } />
                      <Route path="/smart-scheduling" element={
                        <ProtectedRoute requiredPermission="view_smart_scheduling">
                          <SmartScheduling />
                        </ProtectedRoute>
                      } />
                      <Route path="/financial-planning" element={
                        <ProtectedRoute requiredPermission="view_financial_planning">
                          <FinancialPlanning />
                        </ProtectedRoute>
                      } />
                      
                      {/* Learning and Community */}
                      <Route path="/learning" element={
                        <ProtectedRoute requiredPermission="view_learning">
                          <Learning />
                        </ProtectedRoute>
                      } />
                      <Route path="/community" element={
                        <ProtectedRoute requiredPermission="view_community">
                          <Community />
                        </ProtectedRoute>
                      } />
                      <Route path="/farmer-stories" element={
                        <ProtectedRoute requiredPermission="view_community">
                          <FarmerStories />
                        </ProtectedRoute>
                      } />
                      
                      {/* Advanced Technologies */}
                      <Route path="/satellite-integration" element={
                        <ProtectedRoute requiredPermission="use_satellite_integration">
                          <SatelliteIntegration />
                        </ProtectedRoute>
                      } />
                      <Route path="/iot-sensor-network" element={
                        <ProtectedRoute requiredPermission="use_iot_sensors">
                          <IoTSensorNetwork />
                        </ProtectedRoute>
                      } />
                      <Route path="/drone-integration" element={
                        <ProtectedRoute requiredPermission="use_drone_integration">
                          <DroneIntegration />
                        </ProtectedRoute>
                      } />
                      <Route path="/ar-visualization" element={
                        <ProtectedRoute requiredPermission="use_ar_visualization">
                          <ARVisualization />
                        </ProtectedRoute>
                      } />
                      <Route path="/blockchain-certificates" element={
                        <ProtectedRoute requiredPermission="use_blockchain">
                          <BlockchainCertificates />
                        </ProtectedRoute>
                      } />
                      
                      {/* System and Settings */}
                      <Route path="/settings" element={<Settings />} />
                      <Route path="/notifications" element={<Notifications />} />
                      <Route path="/support" element={<Support />} />
                      
                      {/* Other Features */}
                      <Route path="/profile-setup" element={<ProfileSetup />} />
                      <Route path="/search" element={<Search />} />
                      <Route path="/social-learning" element={<SocialLearningPlatform />} />
                      <Route path="/emergency-response" element={<EmergencyResponse />} />
                      <Route path="/export-documentation" element={<ExportDocumentation />} />
                      
                      {/* Admin Panel */}
                      <Route path="/admin" element={
                        <ProtectedRoute requiredPermission="view_admin_dashboard">
                          <Admin />
                        </ProtectedRoute>
                      } />
                      
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </ProtectedRoute>
                } />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </FeatureFlagsProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;


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
import VoiceCommands from "./pages/VoiceCommands";
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

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
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
              
              {/* Admin route (separate layout) */}
              <Route path="/admin" element={
                <ProtectedRoute requiredRole={['ngo']}>
                  <Admin />
                </ProtectedRoute>
              } />
              
              {/* Protected routes with main navigation */}
              <Route path="/*" element={
                <ProtectedRoute>
                  <Navigation />
                  <Routes>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/agrigpt" element={<AgriGPT />} />
                    <Route path="/monitoring" element={<Monitoring />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/marketplace" element={<Marketplace />} />
                    <Route path="/learning" element={<Learning />} />
                    <Route path="/community" element={<Community />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/profile-setup" element={<ProfileSetup />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/crop-disease-detection" element={<CropDiseaseDetection />} />
                    <Route path="/voice-commands" element={<VoiceCommands />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/smart-scheduling" element={<SmartScheduling />} />
                    <Route path="/blockchain-certificates" element={<BlockchainCertificates />} />
                    <Route path="/ar-visualization" element={<ARVisualization />} />
                    <Route path="/satellite-integration" element={<SatelliteIntegration />} />
                    <Route path="/iot-sensor-network" element={<IoTSensorNetwork />} />
                    <Route path="/social-learning" element={<SocialLearningPlatform />} />
                    <Route path="/financial-planning" element={<FinancialPlanning />} />
                    <Route path="/emergency-response" element={<EmergencyResponse />} />
                    <Route path="/drone-integration" element={<DroneIntegration />} />
                    <Route path="/export-documentation" element={<ExportDocumentation />} />
                    <Route path="/support" element={<Support />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ProtectedRoute>
              } />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;

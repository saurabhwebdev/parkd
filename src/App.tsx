import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import FinishSignInPage from "./pages/FinishSignIn";
import DashboardPage from "./pages/Dashboard";
import { AuthProvider } from "./contexts/AuthContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ParkingManagement from "./components/ParkingManagement";
import ZoneManagement from "./components/ZoneManagement";
import VehicleEntryExit from "./components/VehicleEntryExit";
import ReportsDashboard from "./components/ReportsDashboard";
import ParkingLayout from "./components/ParkingLayout";
import HelpSection from "./components/HelpSection";
import ProtectedRoute from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex flex-col min-h-screen bg-white">
            <Navbar />
            <main className="flex-grow pt-16">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/finishSignIn" element={<FinishSignInPage />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route 
                  path="/parking-management" 
                  element={
                    <ProtectedRoute>
                      <ParkingManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/zone-management" 
                  element={
                    <ProtectedRoute>
                      <ZoneManagement />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/vehicle-entry-exit" 
                  element={
                    <ProtectedRoute>
                      <VehicleEntryExit />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/reports" 
                  element={
                    <ProtectedRoute>
                      <ReportsDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/parking-layout" 
                  element={
                    <ProtectedRoute>
                      <ParkingLayout />
                    </ProtectedRoute>
                  } 
                />
                <Route path="/help" element={<HelpSection />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;

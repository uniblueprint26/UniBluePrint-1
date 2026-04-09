import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import AppLayout from "@/components/layout/AppLayout";
import PortalLayout from "@/components/layout/PortalLayout";
import OperationsLayout from "@/components/layout/OperationsLayout";

import LoginPage from "@/pages/LoginPage";
import OnboardingPage from "@/pages/OnboardingPage";
import HomePage from "@/pages/HomePage";
import BlueprintPage from "@/pages/BlueprintPage";
import ConnectPage from "@/pages/ConnectPage";
import MorePage from "@/pages/MorePage";
import SettingsPage from "@/pages/SettingsPage";
import PlaceholderPage from "@/pages/PlaceholderPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<Navigate to="/home" replace />} />

            {/* Onboarding */}
            <Route path="/onboarding" element={
              <ProtectedRoute><OnboardingPage /></ProtectedRoute>
            } />

            {/* Student App */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/blueprint" element={<BlueprintPage />} />
              <Route path="/foundation" element={<PlaceholderPage title="Foundation Blueprint" description="Build the essentials for your journey." />} />
              <Route path="/foundation/*" element={<PlaceholderPage title="Foundation Blueprint" description="Build the essentials for your journey." />} />
              <Route path="/elevation" element={<PlaceholderPage title="Elevation Blueprint" description="Take your Blueprint further." />} />
              <Route path="/elevation/*" element={<PlaceholderPage title="Elevation Blueprint" description="Take your Blueprint further." />} />
              <Route path="/connect" element={<ConnectPage />} />
              <Route path="/campus" element={<PlaceholderPage title="Campus Connect" description="Your campus community." />} />
              <Route path="/campus/*" element={<PlaceholderPage title="Campus Connect" description="Your campus community." />} />
              <Route path="/connect/course" element={<PlaceholderPage title="Course Connect" description="Course-specific groups and resources." />} />
              <Route path="/lifestyle" element={<PlaceholderPage title="Lifestyle" description="Deals, experiences, and more." />} />
              <Route path="/lifestyle/*" element={<PlaceholderPage title="Lifestyle" description="Deals, experiences, and more." />} />
              <Route path="/more" element={<MorePage />} />
              <Route path="/budget" element={<PlaceholderPage title="Budgeting Tool" description="Spending Based · Saving Based · Balanced" />} />
              <Route path="/budget/*" element={<PlaceholderPage title="Budgeting Tool" description="Spending Based · Saving Based · Balanced" />} />
              <Route path="/ads" element={<PlaceholderPage title="Advertisement Board" description="Deals and opportunities for students." />} />
              <Route path="/ads/*" element={<PlaceholderPage title="Advertisement Board" description="Deals and opportunities for students." />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/settings/*" element={<PlaceholderPage title="Settings" description="Manage your Blueprint." />} />
            </Route>

            {/* Handler/Coach Portal */}
            <Route element={<ProtectedRoute><PortalLayout /></ProtectedRoute>}>
              <Route path="/portal" element={<PlaceholderPage title="Handler Portal" description="Manage assignments and engagements." />} />
              <Route path="/portal/*" element={<PlaceholderPage title="Handler Portal" description="Manage assignments and engagements." />} />
            </Route>

            {/* Operations Dashboard */}
            <Route element={<ProtectedRoute><OperationsLayout /></ProtectedRoute>}>
              <Route path="/operations" element={<PlaceholderPage title="Operations Dashboard" description="Full platform visibility and moderation." />} />
              <Route path="/operations/*" element={<PlaceholderPage title="Operations Dashboard" description="Full platform visibility and moderation." />} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;

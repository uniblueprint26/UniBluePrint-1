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
import ResetPasswordPage from "@/pages/ResetPasswordPage";
import OnboardingPage from "@/pages/OnboardingPage";
import HomePage from "@/pages/HomePage";
import BlueprintPage from "@/pages/BlueprintPage";
import ConnectPage from "@/pages/ConnectPage";
import MorePage from "@/pages/MorePage";
import SettingsPage from "@/pages/SettingsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import UpgradePage from "@/pages/UpgradePage";
import PlaceholderPage from "@/pages/PlaceholderPage";
import NotFound from "@/pages/NotFound";

// Phase 2 pages
import FoundationServicesPage from "@/pages/foundation/FoundationServicesPage";
import ServiceDetailPage from "@/pages/foundation/ServiceDetailPage";
import SubmissionsPage from "@/pages/foundation/SubmissionsPage";
import ElevationServicesPage from "@/pages/elevation/ElevationServicesPage";
import LifestylePage from "@/pages/lifestyle/LifestylePage";
import PartnerDetailPage from "@/pages/lifestyle/PartnerDetailPage";
import CampusPage from "@/pages/campus/CampusPage";
import CampusBoardPage from "@/pages/campus/CampusBoardPage";
import CourseConnectPage from "@/pages/connect/CourseConnectPage";
import CourseBoardPage from "@/pages/connect/CourseBoardPage";
import BudgetPage from "@/pages/budget/BudgetPage";
import AdsPage from "@/pages/ads/AdsPage";

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
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/" element={<Navigate to="/home" replace />} />

            {/* Onboarding */}
            <Route path="/onboarding" element={
              <ProtectedRoute><OnboardingPage /></ProtectedRoute>
            } />

            {/* Student App */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/home" element={<HomePage />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/upgrade" element={<UpgradePage />} />
              <Route path="/blueprint" element={<BlueprintPage />} />

              {/* Foundation Blueprint */}
              <Route path="/foundation" element={<FoundationServicesPage />} />
              <Route path="/foundation/submissions" element={<SubmissionsPage />} />
              <Route path="/foundation/:serviceId" element={<ServiceDetailPage />} />

              {/* Elevation Blueprint */}
              <Route path="/elevation" element={<ElevationServicesPage />} />
              <Route path="/elevation/*" element={<PlaceholderPage title="Elevation Blueprint" description="Coach directory and engagement — coming soon." />} />

              {/* Connect */}
              <Route path="/connect" element={<ConnectPage />} />
              <Route path="/campus" element={<CampusPage />} />
              <Route path="/campus/:boardType" element={<CampusBoardPage />} />
              <Route path="/connect/course" element={<CourseConnectPage />} />
              <Route path="/connect/course/:boardType" element={<CourseBoardPage />} />

              {/* Lifestyle */}
              <Route path="/lifestyle" element={<LifestylePage />} />
              <Route path="/lifestyle/partner/:partnerId" element={<PartnerDetailPage />} />
              <Route path="/lifestyle/*" element={<PlaceholderPage title="Lifestyle Blueprint" description="Partner details coming soon." />} />

              {/* More */}
              <Route path="/more" element={<MorePage />} />
              <Route path="/budget" element={<BudgetPage />} />
              <Route path="/budget/*" element={<PlaceholderPage title="Budgeting Tool" description="Additional budget features coming soon." />} />
              <Route path="/ads" element={<AdsPage />} />
              <Route path="/ads/*" element={<PlaceholderPage title="Advertisement Board" description="Ad management coming soon." />} />

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

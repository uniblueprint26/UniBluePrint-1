import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useScrollToTop } from './hooks/useScrollToTop'
import { useUTMCapture } from './hooks/useUTMCapture'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import RequireRole from './components/auth/RequireRole'
import PageLoader from './components/layout/PageLoader'

const HomePage = lazy(() => import('./pages/HomePage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const BehindTheBlueprintPage = lazy(() => import('./pages/BehindTheBlueprintPage'))
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'))
const FoundationBlueprintPage = lazy(() => import('./pages/FoundationBlueprintPage'))
const ElevationBlueprintPage = lazy(() => import('./pages/ElevationBlueprintPage'))
const LifestyleBlueprintPage = lazy(() => import('./pages/LifestyleBlueprintPage'))
const CampusConnectPage = lazy(() => import('./pages/CampusConnectPage'))
const CourseConnectPage = lazy(() => import('./pages/CourseConnectPage'))
const CourseCompassPage = lazy(() => import('./pages/CourseCompassPage'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const SeptemberTrialPage = lazy(() => import('./pages/SeptemberTrialPage'))
const ForUniversitiesPage = lazy(() => import('./pages/ForUniversitiesPage'))
const ForBusinessesPage = lazy(() => import('./pages/ForBusinessesPage'))
const PartnersPage = lazy(() => import('./pages/PartnersPage'))
const JoinPage = lazy(() => import('./pages/JoinPage'))
const FAQsPage = lazy(() => import('./pages/FAQsPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const HelpPage = lazy(() => import('./pages/HelpPage'))
const DownloadPage = lazy(() => import('./pages/DownloadPage'))
const ComingSoonPage = lazy(() => import('./pages/ComingSoonPage'))
const SubscriptionSuccessPage = lazy(() => import('./pages/SubscriptionSuccessPage'))
const SubscriptionManagementPage = lazy(() => import('./pages/SubscriptionManagementPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const ServerErrorPage = lazy(() => import('./pages/ServerErrorPage'))

const FounderDashboardPage = lazy(() => import('./pages/admin/FounderDashboardPage'))
const OperationsDashboardPage = lazy(() => import('./pages/admin/OperationsDashboardPage'))
const FinanceDashboardPage = lazy(() => import('./pages/admin/FinanceDashboardPage'))
const PartnerPortalPage = lazy(() => import('./pages/portal/PartnerPortalPage'))

const TermsPage = lazy(() => import('./pages/legal/TermsPage'))
const PrivacyPage = lazy(() => import('./pages/legal/PrivacyPage'))
const CookiesPage = lazy(() => import('./pages/legal/CookiesPage'))
const RefundPolicyPage = lazy(() => import('./pages/legal/RefundPolicyPage'))
const AccessibilityPage = lazy(() => import('./pages/legal/AccessibilityPage'))

const BudgetingPage = lazy(() => import('./pages/BudgetingPage'))
const AdBoardPage = lazy(() => import('./pages/AdBoardPage'))

const BlogPage = lazy(() => import('./pages/blog/BlogPage'))
const BlogPostPage = lazy(() => import('./pages/blog/BlogPostPage'))

const SignUpPage = lazy(() => import('./pages/auth/SignUpPage'))
const SignInPage = lazy(() => import('./pages/auth/SignInPage'))
const ForgotPasswordPage = lazy(() => import('./pages/auth/ForgotPasswordPage'))
const ResetPasswordPage = lazy(() => import('./pages/auth/ResetPasswordPage'))
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'))

function AppRoutes() {
  useScrollToTop()
  useUTMCapture()

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/behind-the-blueprint" element={<BehindTheBlueprintPage />} />
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/foundation-blueprint" element={<FoundationBlueprintPage />} />
        <Route path="/elevation-blueprint" element={<ElevationBlueprintPage />} />
        <Route path="/lifestyle-blueprint" element={<LifestyleBlueprintPage />} />
        <Route path="/campus-connect" element={<CampusConnectPage />} />
        <Route path="/course-connect" element={<CourseConnectPage />} />
        <Route path="/course-compass" element={<CourseCompassPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/september-trial" element={<SeptemberTrialPage />} />
        <Route path="/for-universities" element={<ForUniversitiesPage />} />
        <Route path="/for-businesses" element={<ForBusinessesPage />} />
        <Route path="/budgeting" element={<BudgetingPage />} />
        <Route path="/ad-board" element={<AdBoardPage />} />
        <Route path="/partners" element={<PartnersPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/join-handler" element={<Navigate to="/join#handler-form" replace />} />
        <Route path="/join-coach" element={<Navigate to="/join#coach-form" replace />} />
        <Route path="/ambassadors" element={<Navigate to="/join#ambassador-form" replace />} />
        <Route path="/faqs" element={<FAQsPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/help" element={<HelpPage />} />
        <Route path="/download" element={<DownloadPage />} />
        <Route path="/coming-soon" element={<ComingSoonPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/:slug" element={<BlogPostPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/cookies" element={<CookiesPage />} />
        <Route path="/refund-policy" element={<RefundPolicyPage />} />
        <Route path="/accessibility" element={<AccessibilityPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route
          path="/subscription-success"
          element={
            <ProtectedRoute>
              <SubscriptionSuccessPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/subscription-management"
          element={
            <ProtectedRoute>
              <SubscriptionManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/founder"
          element={
            <RequireRole allow={['founder', 'admin']}>
              <FounderDashboardPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/operations"
          element={
            <RequireRole allow={['operations', 'founder', 'admin']}>
              <OperationsDashboardPage />
            </RequireRole>
          }
        />
        <Route
          path="/admin/finance"
          element={
            <RequireRole allow={['finance', 'founder', 'admin']}>
              <FinanceDashboardPage />
            </RequireRole>
          }
        />
        <Route
          path="/portal/partner"
          element={
            <RequireRole allow={['business', 'operations', 'founder', 'admin']}>
              <PartnerPortalPage />
            </RequireRole>
          }
        />
        <Route path="/500" element={<ServerErrorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

export default function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AppRoutes />
    </Suspense>
  )
}

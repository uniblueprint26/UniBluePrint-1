import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useScrollToTop } from './hooks/useScrollToTop'
import { useUTMCapture } from './hooks/useUTMCapture'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import PageLoader from './components/layout/PageLoader'

const HomePage = lazy(() => import('./pages/HomePage'))
const AboutPage = lazy(() => import('./pages/AboutPage'))
const HowItWorksPage = lazy(() => import('./pages/HowItWorksPage'))
const FoundationBlueprintPage = lazy(() => import('./pages/FoundationBlueprintPage'))
const ElevationBlueprintPage = lazy(() => import('./pages/ElevationBlueprintPage'))
const LifestyleBlueprintPage = lazy(() => import('./pages/LifestyleBlueprintPage'))
const CampusConnectPage = lazy(() => import('./pages/CampusConnectPage'))
const CourseConnectPage = lazy(() => import('./pages/CourseConnectPage'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const SeptemberTrialPage = lazy(() => import('./pages/SeptemberTrialPage'))
const ForUniversitiesPage = lazy(() => import('./pages/ForUniversitiesPage'))
const ForBusinessesPage = lazy(() => import('./pages/ForBusinessesPage'))
const PartnersPage = lazy(() => import('./pages/PartnersPage'))
const OurCoachesPage = lazy(() => import('./pages/OurCoachesPage'))
const JoinPage = lazy(() => import('./pages/JoinPage'))
const ContributorsLandingPage = lazy(() => import('./pages/contributors/ContributorsLandingPage'))
const ContributorDashboardPage = lazy(() => import('./pages/contributors/ContributorDashboardPage'))
const ContributorUploadPage = lazy(() => import('./pages/contributors/ContributorUploadPage'))
const CvBuilderPage = lazy(() => import('./pages/foundation/CvBuilderPage'))
const CvReviewPage = lazy(() => import('./pages/foundation/CvReviewPage'))
const JobSearchSupportPage = lazy(() => import('./pages/foundation/JobSearchSupportPage'))
const FAQsPage = lazy(() => import('./pages/FAQsPage'))
const ContactPage = lazy(() => import('./pages/ContactPage'))
const HelpPage = lazy(() => import('./pages/HelpPage'))
const DownloadPage = lazy(() => import('./pages/DownloadPage'))
const ComingSoonPage = lazy(() => import('./pages/ComingSoonPage'))
const SubscriptionSuccessPage = lazy(() => import('./pages/SubscriptionSuccessPage'))
const SubscriptionManagementPage = lazy(() => import('./pages/SubscriptionManagementPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))
const ServerErrorPage = lazy(() => import('./pages/ServerErrorPage'))

const TermsPage = lazy(() => import('./pages/legal/TermsPage'))
const PrivacyPage = lazy(() => import('./pages/legal/PrivacyPage'))
const CookiesPage = lazy(() => import('./pages/legal/CookiesPage'))
const RefundPolicyPage = lazy(() => import('./pages/legal/RefundPolicyPage'))
const AccessibilityPage = lazy(() => import('./pages/legal/AccessibilityPage'))

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
        <Route path="/how-it-works" element={<HowItWorksPage />} />
        <Route path="/foundation-blueprint" element={<FoundationBlueprintPage />} />
        <Route path="/elevation-blueprint" element={<ElevationBlueprintPage />} />
        <Route path="/lifestyle-blueprint" element={<LifestyleBlueprintPage />} />
        <Route path="/campus-connect" element={<CampusConnectPage />} />
        <Route path="/course-connect" element={<CourseConnectPage />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/september-trial" element={<SeptemberTrialPage />} />
        <Route path="/for-universities" element={<ForUniversitiesPage />} />
        <Route path="/for-businesses" element={<ForBusinessesPage />} />
        <Route path="/partners" element={<PartnersPage />} />
        <Route path="/our-coaches" element={<OurCoachesPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/contributors" element={<ContributorsLandingPage />} />
        <Route
          path="/contributors/dashboard"
          element={
            <ProtectedRoute>
              <ContributorDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contributors/upload"
          element={
            <ProtectedRoute>
              <ContributorUploadPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/foundation/cv-builder"
          element={
            <ProtectedRoute>
              <CvBuilderPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/foundation/cv-review"
          element={
            <ProtectedRoute>
              <CvReviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/foundation/job-search-support"
          element={
            <ProtectedRoute>
              <JobSearchSupportPage />
            </ProtectedRoute>
          }
        />
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

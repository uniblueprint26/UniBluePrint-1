import { Routes, Route } from 'react-router-dom'
import { useScrollToTop } from './hooks/useScrollToTop'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'

import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import HowItWorksPage from './pages/HowItWorksPage'
import FoundationBlueprintPage from './pages/FoundationBlueprintPage'
import ElevationBlueprintPage from './pages/ElevationBlueprintPage'
import LifestyleBlueprintPage from './pages/LifestyleBlueprintPage'
import CampusConnectPage from './pages/CampusConnectPage'
import CourseConnectPage from './pages/CourseConnectPage'
import PricingPage from './pages/PricingPage'
import SeptemberTrialPage from './pages/SeptemberTrialPage'
import ForUniversitiesPage from './pages/ForUniversitiesPage'
import ForBusinessesPage from './pages/ForBusinessesPage'
import AmbassadorsPage from './pages/AmbassadorsPage'
import FAQsPage from './pages/FAQsPage'
import ContactPage from './pages/ContactPage'
import HelpPage from './pages/HelpPage'
import DownloadPage from './pages/DownloadPage'
import ComingSoonPage from './pages/ComingSoonPage'
import SubscriptionSuccessPage from './pages/SubscriptionSuccessPage'
import SubscriptionManagementPage from './pages/SubscriptionManagementPage'
import NotFoundPage from './pages/NotFoundPage'

import JoinHandlerPage from './pages/join/JoinHandlerPage'
import JoinCoachPage from './pages/join/JoinCoachPage'

import TermsPage from './pages/legal/TermsPage'
import PrivacyPage from './pages/legal/PrivacyPage'
import CookiesPage from './pages/legal/CookiesPage'
import RefundPolicyPage from './pages/legal/RefundPolicyPage'
import AccessibilityPage from './pages/legal/AccessibilityPage'

import BlogPage from './pages/blog/BlogPage'
import BlogPostPage from './pages/blog/BlogPostPage'

import SignUpPage from './pages/auth/SignUpPage'
import SignInPage from './pages/auth/SignInPage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import VerifyEmailPage from './pages/auth/VerifyEmailPage'

export default function App() {
  useScrollToTop()

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
        <Route path="/join-handler" element={<JoinHandlerPage />} />
        <Route path="/join-coach" element={<JoinCoachPage />} />
        <Route path="/ambassadors" element={<AmbassadorsPage />} />
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
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}

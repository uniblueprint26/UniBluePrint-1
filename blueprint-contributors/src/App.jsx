import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import RoleRoute from './components/auth/RoleRoute'
import PageLoader from './components/layout/PageLoader'

const LandingPage = lazy(() => import('./pages/LandingPage'))
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const UploadPage = lazy(() => import('./pages/UploadPage'))
const OperationsPage = lazy(() => import('./pages/OperationsPage'))
const SignUpPage = lazy(() => import('./pages/auth/SignUpPage'))
const SignInPage = lazy(() => import('./pages/auth/SignInPage'))
const VerifyEmailPage = lazy(() => import('./pages/auth/VerifyEmailPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/dashboard"
          element={
            <RoleRoute allow={['contributor']}>
              <DashboardPage />
            </RoleRoute>
          }
        />
        <Route
          path="/upload"
          element={
            <RoleRoute allow={['contributor']}>
              <UploadPage />
            </RoleRoute>
          }
        />
        <Route
          path="/operations"
          element={
            <RoleRoute allow={['operations']}>
              <OperationsPage />
            </RoleRoute>
          }
        />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
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

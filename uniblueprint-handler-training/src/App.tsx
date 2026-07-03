import { Route, Routes } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import RouteFade from './components/RouteFade'
import ProtectedRoute from './components/ProtectedRoute'
import OperationsRoute from './components/OperationsRoute'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import ModulePage from './pages/ModulePage'
import QuizPage from './pages/QuizPage'
import OperationsDashboard from './pages/OperationsDashboard'

export default function App() {
  return (
    <>
      <ScrollToTop />
      <RouteFade>
        <Routes>
          <Route path="/" element={<Login />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/module/:id"
            element={
              <ProtectedRoute>
                <ModulePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/quiz/:id"
            element={
              <ProtectedRoute>
                <QuizPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/operations"
            element={
              <OperationsRoute>
                <OperationsDashboard />
              </OperationsRoute>
            }
          />
        </Routes>
      </RouteFade>
    </>
  )
}

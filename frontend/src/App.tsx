import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { Spinner } from './components/ui/Feedback'

// Route-level code splitting (NFR2): each page is only downloaded when a
// user actually navigates to it, instead of one ~885 kB bundle upfront.
// Auth/layout/routing chrome stays eager since it's needed immediately.
const LoginPage = lazy(() => import('./pages/auth/LoginPage').then((m) => ({ default: m.LoginPage })))
const SignupPage = lazy(() => import('./pages/auth/SignupPage').then((m) => ({ default: m.SignupPage })))
const DashboardPage = lazy(() => import('./pages/student/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const SearchPage = lazy(() => import('./pages/student/SearchPage').then((m) => ({ default: m.SearchPage })))
const EventsPage = lazy(() => import('./pages/student/EventsPage').then((m) => ({ default: m.EventsPage })))
const SocietiesPage = lazy(() => import('./pages/student/SocietiesPage').then((m) => ({ default: m.SocietiesPage })))
const RoomsPage = lazy(() => import('./pages/student/RoomsPage').then((m) => ({ default: m.RoomsPage })))
const LostFoundPage = lazy(() => import('./pages/student/LostFoundPage').then((m) => ({ default: m.LostFoundPage })))
const AcademicSupportPage = lazy(() => import('./pages/student/AcademicSupportPage').then((m) => ({ default: m.AcademicSupportPage })))
const FacilityIssuesPage = lazy(() => import('./pages/student/FacilityIssuesPage').then((m) => ({ default: m.FacilityIssuesPage })))
const FeedbackPage = lazy(() => import('./pages/student/FeedbackPage').then((m) => ({ default: m.FeedbackPage })))
const AiAssistantPage = lazy(() => import('./pages/student/AiAssistantPage').then((m) => ({ default: m.AiAssistantPage })))
const StaffConsolePage = lazy(() => import('./pages/staff/StaffConsolePage').then((m) => ({ default: m.StaffConsolePage })))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage').then((m) => ({ default: m.NotFoundPage })))

function PageFallback() {
  return <Spinner label="Loading…" />
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<PageFallback />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />

            <Route
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/events" element={<EventsPage />} />
              <Route path="/societies" element={<SocietiesPage />} />
              <Route path="/rooms" element={<RoomsPage />} />
              <Route path="/lost-found" element={<LostFoundPage />} />
              <Route path="/academic-support" element={<AcademicSupportPage />} />
              <Route path="/facility-issues" element={<FacilityIssuesPage />} />
              <Route path="/feedback" element={<FeedbackPage />} />
              <Route path="/ai" element={<AiAssistantPage />} />
              <Route
                path="/staff"
                element={
                  <ProtectedRoute staffOnly>
                    <StaffConsolePage />
                  </ProtectedRoute>
                }
              />
            </Route>

            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}

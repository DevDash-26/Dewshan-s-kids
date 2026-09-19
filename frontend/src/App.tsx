import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { AppLayout } from './components/layout/AppLayout'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { LoginPage } from './pages/auth/LoginPage'
import { SignupPage } from './pages/auth/SignupPage'
import { DashboardPage } from './pages/student/DashboardPage'
import { SearchPage } from './pages/student/SearchPage'
import { EventsPage } from './pages/student/EventsPage'
import { SocietiesPage } from './pages/student/SocietiesPage'
import { RoomsPage } from './pages/student/RoomsPage'
import { LostFoundPage } from './pages/student/LostFoundPage'
import { AcademicSupportPage } from './pages/student/AcademicSupportPage'
import { FacilityIssuesPage } from './pages/student/FacilityIssuesPage'
import { FeedbackPage } from './pages/student/FeedbackPage'
import { AiAssistantPage } from './pages/student/AiAssistantPage'
import { StaffConsolePage } from './pages/staff/StaffConsolePage'
import { NotFoundPage } from './pages/NotFoundPage'

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
      </AuthProvider>
    </BrowserRouter>
  )
}

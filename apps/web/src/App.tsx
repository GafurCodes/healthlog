import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import { Header } from './components/Header';
// import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';
import { HomePage } from './pages/HomePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { VerifyEmailPage } from './pages/VerifyEmailPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { DashboardPage } from './pages/DashboardPage';
import { LogsPage } from './pages/LogsPage';
/*import { LogFormPage } from './pages/LogFormPage';*/
import LogFormPage from './pages/LogFormPage';
import { NotFoundPage } from './pages/NotFoundPage';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <a
              href='#main-content'
              style={{
                position: 'absolute',
                left: '-9999px',
                zIndex: 999,
              }}
              onFocus={(e) => {
                e.currentTarget.style.left = '0';
                e.currentTarget.style.top = '0';
              }}
              onBlur={(e) => {
                e.currentTarget.style.left = '-9999px';
              }}
            >
              Skip to main content
            </a>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                minHeight: '100vh',
              }}
            >
              <Header />
              <main id='main-content' style={{ flex: 1 }}>
                <Routes>
                  <Route path='/' element={<HomePage />} />
                  <Route path='/login' element={<LoginPage />} />
                  <Route path='/register' element={<RegisterPage />} />
                  <Route path='/verify-email' element={<VerifyEmailPage />} />
                  <Route
                    path='/forgot-password'
                    element={<ForgotPasswordPage />}
                  />
                  <Route
                    path='/reset-password'
                    element={<ResetPasswordPage />}
                  />
                  <Route
                    path='/dashboard'
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path='/logs'
                    element={
                      <ProtectedRoute>
                        <LogsPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path='/logs/new'
                    element={
                      <ProtectedRoute>
                        <LogFormPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path='/logs/:id/edit'
                    element={
                      <ProtectedRoute>
                        <LogFormPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route path='*' element={<NotFoundPage />} />
                </Routes>
              </main>
              {/* <Footer /> */}
            </div>
          </Router>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
};

export default App;

import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/lib/context/AuthContext';
import { ThemeProvider } from '@/lib/context/ThemeContext';
import { NetworkProvider } from '@/lib/context/NetworkContext';
import { OfflineToast } from '@/components/atoms/OfflineToast';

// Layouts
import { AuthLayout } from '@/components/templates/AuthLayout';
import { AppShell } from '@/components/templates/AppShell';
import { ProtectedRoute } from '@/components/templates/ProtectedRoute';

// Public Pages
import { LoginPage } from '@/app/(public)/login/LoginPage';
import { RegisterPage } from '@/app/(public)/register/RegisterPage';

// Authenticated Pages
import { DashboardPage } from '@/app/(authenticated)/dashboard/DashboardPage';
import { ExpensesPage } from '@/app/(authenticated)/expenses/ExpensesPage';
import { BudgetsPage } from '@/app/(authenticated)/budgets/BudgetsPage';
import { InsightsPage } from '@/app/(authenticated)/insights/InsightsPage';
import { SettingsPage } from '@/app/(authenticated)/settings/SettingsPage';
import { ChatPage } from '@/app/(authenticated)/chat/ChatPage';
import { SubscriptionsPage } from '@/app/(authenticated)/subscriptions/SubscriptionsPage';
import { OnboardingPage } from '@/app/(authenticated)/onboarding/OnboardingPage';

function App() {
  return (
    <ThemeProvider>
      <NetworkProvider>
        <AuthProvider>
          <Routes>
          {/* Public Routes */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
          </Route>

          {/* Onboarding Route (Protected, no AppShell) */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppShell />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/budgets" element={<BudgetsPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/subscriptions" element={<SubscriptionsPage />} />
          </Route>

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
        <OfflineToast />
        </AuthProvider>
      </NetworkProvider>
    </ThemeProvider>
  );
}

export default App;

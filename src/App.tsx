import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { MobileNav } from "@/components/layout/MobileNav";
import { PublicJobLayout } from "@/pages/public/PublicJobLayout";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { RouteErrorBoundary } from "@/components/RouteErrorBoundary";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { RoleGuard } from "@/components/auth/RoleGuard";
import { Suspense, lazy } from "react";
import { CommandMenu } from "@/components/ui/CommandMenu";

// Lazy load pages for code splitting
const Register = lazy(() => import("./pages/Register"));
const Login = lazy(() => import("./pages/Login"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Profile = lazy(() => import("./pages/Profile"));
const PositionCreate = lazy(() => import("./pages/PositionCreate"));
const PositionEdit = lazy(() => import("./pages/PositionEdit"));
const Candidates = lazy(() => import("./pages/Candidates"));
const AllCandidates = lazy(() => import("./pages/AllCandidates"));
const Interviews = lazy(() => import("./pages/Interviews"));
const SyncStatus = lazy(() => import("@/pages/SyncStatus"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Index = lazy(() => import("./pages/Index"));
const HiringManagerDashboard = lazy(() => import("./pages/HiringManagerDashboard"));
const PublicJobBoard = lazy(() => import("./pages/public/JobBoard"));
const PublicApplicationForm = lazy(() => import("./pages/public/ApplicationForm"));
const InterviewGuides = lazy(() => import("./pages/InterviewGuides"));
const TeamManagement = lazy(() => import("./pages/TeamManagement"));
const ActivityLog = lazy(() => import("./pages/ActivityLog"));
const LandingPage = lazy(() => import("./pages/LandingPage"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// Configure React Query for better caching
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <CommandMenu />
              <Suspense fallback={<PageLoader />}>
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/reset-password" element={<ResetPassword />} />
                    {/* Authenticated Routes with Route Protection */}
                    <Route path="/dashboard" element={<ProtectedRoute><RouteErrorBoundary><Dashboard /></RouteErrorBoundary></ProtectedRoute>} />
                    <Route path="/hiring" element={<ProtectedRoute><RouteErrorBoundary><HiringManagerDashboard /></RouteErrorBoundary></ProtectedRoute>} />
                    <Route path="/profile" element={<ProtectedRoute><RouteErrorBoundary><Profile /></RouteErrorBoundary></ProtectedRoute>} />
                    <Route path="/positions/new" element={<ProtectedRoute><RoleGuard requiredPermission="canPostJobs"><RouteErrorBoundary><PositionCreate /></RouteErrorBoundary></RoleGuard></ProtectedRoute>} />
                    <Route path="/positions/:id/edit" element={<ProtectedRoute><RouteErrorBoundary><PositionEdit /></RouteErrorBoundary></ProtectedRoute>} />
                    <Route path="/positions/:positionId/candidates" element={<ProtectedRoute><RouteErrorBoundary><Candidates /></RouteErrorBoundary></ProtectedRoute>} />
                    <Route path="/candidates" element={<ProtectedRoute><RouteErrorBoundary><AllCandidates /></RouteErrorBoundary></ProtectedRoute>} />
                    <Route path="/interviews" element={<ProtectedRoute><RouteErrorBoundary><Interviews /></RouteErrorBoundary></ProtectedRoute>} />
                    <Route path="/sync" element={<ProtectedRoute><RoleGuard requiredRoles={['admin']}><RouteErrorBoundary><SyncStatus /></RouteErrorBoundary></RoleGuard></ProtectedRoute>} />
                    <Route path="/guides" element={<ProtectedRoute><RouteErrorBoundary><InterviewGuides /></RouteErrorBoundary></ProtectedRoute>} />
                    <Route path="/team" element={<ProtectedRoute><RoleGuard requiredPermission="canManageTeam"><RouteErrorBoundary><TeamManagement /></RouteErrorBoundary></RoleGuard></ProtectedRoute>} />
                    <Route path="/activity" element={<ProtectedRoute><RoleGuard requiredRoles={['admin']}><RouteErrorBoundary><ActivityLog /></RouteErrorBoundary></RoleGuard></ProtectedRoute>} />

                    {/* Public Job Board Routes */}
                    <Route element={<PublicJobLayout />}>
                      <Route path="/jobs" element={<PublicJobBoard />} />
                      <Route path="/jobs/:positionId/apply" element={<PublicApplicationForm />} />
                    </Route>

                    {/* Legacy route */}
                    <Route path="/form" element={<Index />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ErrorBoundary>
                <MobileNav />
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;


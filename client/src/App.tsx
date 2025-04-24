import { Switch, Route, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Practice from "@/pages/practice";
import Analytics from "@/pages/analytics";
import ManageQuestions from "@/pages/manage-questions";
import ManageChapters from "@/pages/manage-chapters";
import ManageTopics from "@/pages/manage-topics";
import Subscription from "@/pages/subscription";
import AuthPage from "@/pages/auth-page";
import LandingPage from "@/pages/landing-page";
import Settings from "@/pages/settings";
import HelpCenter from "@/pages/help-center";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { AdminRoute } from "@/lib/admin-route";
import AdminDashboard from "@/pages/admin";
import AdminTopics from "@/pages/admin/topics";
import AdminQuestions from "@/pages/admin/questions";
import AdminPracticeSets from "@/pages/admin/practice-sets";
import AdminUsers from "@/pages/admin/users";
import AdminChapters from "@/pages/admin/chapters";
import StudentAnalytics from "@/pages/admin/student-analytics";

function Router() {
  return (
    <Switch>
      {/* Standard user routes */}
      <ProtectedRoute path="/dashboard" component={Dashboard} />
      <ProtectedRoute path="/practice/:topicId" component={Practice} />
      <ProtectedRoute path="/analytics" component={Analytics} />
      <ProtectedRoute path="/subscription" component={Subscription} />
      <ProtectedRoute path="/settings" component={Settings} />
      <ProtectedRoute path="/help-center" component={HelpCenter} />
      
      {/* Management routes for admin users only */}
      <AdminRoute path="/manage-questions" component={ManageQuestions} />
      <AdminRoute path="/manage-chapters" component={ManageChapters} />
      <AdminRoute path="/manage-topics" component={ManageTopics} />
      
      {/* Admin routes */}
      <AdminRoute path="/admin" component={AdminDashboard} />
      <AdminRoute path="/admin/topics" component={AdminTopics} />
      <AdminRoute path="/admin/chapters" component={AdminChapters} />
      <AdminRoute path="/admin/questions" component={AdminQuestions} />
      <AdminRoute path="/admin/practice-sets" component={AdminPracticeSets} />
      <AdminRoute path="/admin/users" component={AdminUsers} />
      <AdminRoute path="/admin/student-analytics" component={StudentAnalytics} />
      <AdminRoute path="/admin/settings" component={Settings} />
      <AdminRoute path="/admin/help-center" component={HelpCenter} />
      
      {/* Public routes */}
      {/* Temporarily disabled landing page for premium access */}
      {/* <Route path="/" component={LandingPage} /> */}
      <Route path="/">
        {() => <Redirect to="/dashboard" />}
      </Route>
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;

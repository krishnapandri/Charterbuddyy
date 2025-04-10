import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Practice from "@/pages/practice";
import Analytics from "@/pages/analytics";
import ManageQuestions from "@/pages/manage-questions";
import StudyPlans from "@/pages/study-plans";
import StudyPlanPage from "@/pages/study-plan";
import AuthPage from "@/pages/auth-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { AdminRoute } from "@/lib/admin-route";
import AdminDashboard from "@/pages/admin";
import AdminTopics from "@/pages/admin/topics";
import AdminQuestions from "@/pages/admin/questions";
import AdminPracticeSets from "@/pages/admin/practice-sets";
import AdminUsers from "@/pages/admin/users";

function Router() {
  return (
    <Switch>
      {/* Standard user routes */}
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/practice/:topicId" component={Practice} />
      <ProtectedRoute path="/analytics" component={Analytics} />
      <ProtectedRoute path="/manage-questions" component={ManageQuestions} />
      <ProtectedRoute path="/study-plans" component={StudyPlans} />
      <ProtectedRoute path="/study-plan/:id" component={StudyPlanPage} />
      
      {/* Admin routes */}
      <AdminRoute path="/admin" component={AdminDashboard} />
      <AdminRoute path="/admin/topics" component={AdminTopics} />
      <AdminRoute path="/admin/questions" component={AdminQuestions} />
      <AdminRoute path="/admin/practice-sets" component={AdminPracticeSets} />
      <AdminRoute path="/admin/users" component={AdminUsers} />
      
      {/* Public routes */}
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

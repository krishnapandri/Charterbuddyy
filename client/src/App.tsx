import { Switch, Route } from "wouter";
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
import AuthPage from "@/pages/auth-page";
import { AuthProvider } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import { AdminRoute } from "@/lib/admin-route";
import AdminDashboard from "@/pages/admin";
import AdminTopics from "@/pages/admin/topics";
import AdminQuestions from "@/pages/admin/questions";
import AdminPracticeSets from "@/pages/admin/practice-sets";
import AdminUsers from "@/pages/admin/users";
import AdminChapters from "@/pages/admin/chapters";

function Router() {
  return (
    <Switch>
      {/* Standard user routes */}
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/practice/:topicId" component={Practice} />
      <ProtectedRoute path="/analytics" component={Analytics} />
      <ProtectedRoute path="/manage-questions" component={ManageQuestions} />
      <ProtectedRoute path="/manage-chapters" component={ManageChapters} />
      <ProtectedRoute path="/manage-topics" component={ManageTopics} />
      
      {/* Admin routes */}
      <AdminRoute path="/admin" component={AdminDashboard} />
      <AdminRoute path="/admin/topics" component={AdminTopics} />
      <AdminRoute path="/admin/chapters" component={AdminChapters} />
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

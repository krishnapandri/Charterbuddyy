import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Practice from "@/pages/practice";
import Analytics from "@/pages/analytics";
import ManageQuestions from "@/pages/manage-questions";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/practice/:topicId" component={Practice} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/manage-questions" component={ManageQuestions} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

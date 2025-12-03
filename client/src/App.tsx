import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardPage from "@/pages/dashboard";
import OrdersPage from "@/pages/orders";
import PaymentPage from "@/pages/payment";
import TransactionsPage from "@/pages/transactions";
import UnmappedPage from "@/pages/unmapped";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/orders" component={OrdersPage} />
      <Route path="/pay/:id" component={PaymentPage} />
      <Route path="/transactions" component={TransactionsPage} />
      <Route path="/unmapped" component={UnmappedPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;

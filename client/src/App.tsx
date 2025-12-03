import { Switch, Route } from "wouter";
import { Toaster } from "@/components/ui/toaster";
import DashboardPage from "@/pages/dashboard";
import OrdersPage from "@/pages/orders";
import PaymentPage from "@/pages/payment";
import TransactionsPage from "@/pages/transactions";
import SettingsPage from "@/pages/settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={DashboardPage} />
      <Route path="/orders" component={OrdersPage} />
      <Route path="/pay/:id" component={PaymentPage} />
      <Route path="/transactions" component={TransactionsPage} />
      <Route path="/settings" component={SettingsPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <>
      <Router />
      <Toaster />
    </>
  );
}

export default App;

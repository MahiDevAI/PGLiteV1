import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { ordersApi, type Order } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Card, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, ExternalLink, Copy, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function OrdersPage() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newAmount, setNewAmount] = useState("");
  const [newCustomer, setNewCustomer] = useState("");
  const { toast } = useToast();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: ordersApi.getAll,
    refetchInterval: 3000,
  });

  const createOrderMutation = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsCreateOpen(false);
      setNewAmount("");
      setNewCustomer("");
      toast({
        title: "Order Created",
        description: `Order ${data.orderId} created successfully.`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreateOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(newAmount);
    if (amount > 0) {
      createOrderMutation.mutate({
        amount,
        customerName: newCustomer || undefined,
      });
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Link copied to clipboard.",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'PENDING': return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'EXPIRED': return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      default: return 'bg-destructive/10 text-destructive border-destructive/20';
    }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold font-heading text-foreground tracking-tight">Orders</h1>
          <p className="text-muted-foreground mt-1">Manage and track all payment requests.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 shadow-lg shadow-primary/25 text-white rounded-lg h-11 px-6" data-testid="button-create-order">
              <Plus className="w-4 h-4 mr-2" />
              Create Order
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
              <CardDescription>
                Generate a new UPI payment link.
              </CardDescription>
            </DialogHeader>
            <form onSubmit={handleCreateOrder} className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (₹)</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  placeholder="0.00" 
                  value={newAmount}
                  onChange={(e) => setNewAmount(e.target.value)}
                  required
                  min="1"
                  autoFocus
                  className="font-heading text-lg"
                  data-testid="input-amount"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customer">Customer Name (Optional)</Label>
                <Input 
                  id="customer" 
                  placeholder="John Doe" 
                  value={newCustomer}
                  onChange={(e) => setNewCustomer(e.target.value)}
                  data-testid="input-customer"
                />
              </div>
              <DialogFooter>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={createOrderMutation.isPending}
                  data-testid="button-submit-order"
                >
                  {createOrderMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Generate Link
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-sm border-border/60 bg-card/50 backdrop-blur-sm">
        <div className="p-4 border-b border-border/60 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search by Order ID or Customer..." className="pl-9 bg-background/50 border-border/50 focus-visible:ring-1" data-testid="input-search" />
          </div>
          <Button variant="outline" className="ml-auto gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </Button>
        </div>
        
        <div className="relative w-full overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-muted-foreground uppercase bg-muted/30">
                <tr>
                  <th className="px-6 py-4 font-medium">Order ID</th>
                  <th className="px-6 py-4 font-medium">Customer</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium">Created</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-muted/20 transition-colors group" data-testid={`row-order-${order.orderId}`}>
                    <td className="px-6 py-4 font-medium font-mono text-foreground/80">
                      {order.orderId}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{order.customerName || "Guest"}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-heading font-bold">₹{order.amount.toLocaleString()}</span>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="outline" className={cn("font-medium border", getStatusColor(order.status))}>
                        {order.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground text-xs">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Link href={`/pay/${order.orderId}`}>
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0" title="Open Payment Page" data-testid={`button-view-${order.orderId}`}>
                            <ExternalLink className="w-4 h-4" />
                          </Button>
                        </Link>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0" 
                          title="Copy Link"
                          onClick={() => copyToClipboard(`${window.location.origin}/pay/${order.orderId}`)}
                          data-testid={`button-copy-${order.orderId}`}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      No orders found. Create one to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </Layout>
  );
}

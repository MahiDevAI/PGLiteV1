import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { transactionsApi, ordersApi } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Download, Loader2 } from "lucide-react";

export default function TransactionsPage() {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["/api/transactions"],
    queryFn: transactionsApi.getAll,
    refetchInterval: 5000,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["/api/orders"],
    queryFn: ordersApi.getAll,
  });

  const getOrderAmount = (orderId: string) => {
    const order = orders.find(o => o.orderId === orderId);
    return order?.amount || 0;
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold font-heading text-foreground tracking-tight">Transactions</h1>
          <p className="text-muted-foreground mt-1">History of all successful payments.</p>
        </div>
        <Button variant="outline" className="gap-2" data-testid="button-export">
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      <Card className="shadow-sm border-border/60 bg-card/50 backdrop-blur-sm">
        <div className="p-4 border-b border-border/60 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search Transaction ID..." className="pl-9 bg-background/50 border-border/50" data-testid="input-search-txn" />
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
                  <th className="px-6 py-4 font-medium">Txn ID</th>
                  <th className="px-6 py-4 font-medium">Order ID</th>
                  <th className="px-6 py-4 font-medium">Payer</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Status</th>
                  <th className="px-6 py-4 font-medium text-right">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {transactions.map((txn) => (
                  <tr key={txn.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-txn-${txn.id}`}>
                    <td className="px-6 py-4 font-medium font-mono text-foreground/80">
                      {txn.id}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-muted-foreground">
                      {txn.orderId}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{txn.payerName}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-heading font-bold text-emerald-600">
                        ₹{getOrderAmount(txn.orderId).toLocaleString()}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {txn.isLatePayment ? (
                        <Badge variant="destructive" className="bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-100">Late</Badge>
                      ) : (
                        <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100">Success</Badge>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground text-xs">
                      {new Date(txn.createdAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground">
                      No transactions recorded yet.
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

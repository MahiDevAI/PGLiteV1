import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { dashboardApi, transactionsApi } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, DollarSign, CreditCard, Activity, Users, Loader2 } from "lucide-react";

const chartData = [
  { name: 'Mon', total: 1200 },
  { name: 'Tue', total: 2100 },
  { name: 'Wed', total: 800 },
  { name: 'Thu', total: 1600 },
  { name: 'Fri', total: 2400 },
  { name: 'Sat', total: 3200 },
  { name: 'Sun', total: 2800 },
];

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
    queryFn: dashboardApi.getStats,
    refetchInterval: 5000,
  });

  const { data: transactions } = useQuery({
    queryKey: ["/api/transactions"],
    queryFn: transactionsApi.getAll,
    refetchInterval: 5000,
  });

  const successRate = stats && stats.totalOrders > 0 
    ? Math.round((stats.completedOrders / stats.totalOrders) * 100) 
    : 100;

  return (
    <Layout>
      <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-3xl font-bold font-heading text-foreground tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Real-time overview of your payment gateway.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold font-heading">₹{(stats?.totalRevenue || 0).toLocaleString()}</div>
                <p className="text-xs text-emerald-500 flex items-center mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  From completed orders
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Orders</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold font-heading">{stats?.activeOrders || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Waiting for payment
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold font-heading">{successRate}%</div>
                <p className="text-xs text-blue-500 flex items-center mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  Completion rate
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Orders</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold font-heading">{stats?.totalOrders || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  All time
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid gap-4 md:grid-cols-7 mb-8">
        <Card className="col-span-4 bg-card/50 backdrop-blur-sm border-border/60">
          <CardHeader>
            <CardTitle>Revenue Overview</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="name" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false}
                  tickFormatter={(value) => `₹${value}`}
                />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" opacity={0.4} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  itemStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="total" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorTotal)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-card/50 backdrop-blur-sm border-border/60">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {transactions && transactions.length > 0 ? (
                transactions.slice(0, 5).map((txn) => (
                  <div key={txn.id} className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none text-foreground">{txn.payerName}</p>
                      <p className="text-xs text-muted-foreground">Order {txn.orderId}</p>
                    </div>
                    <div className="ml-auto font-bold font-heading text-emerald-600">Received</div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No transactions yet. Create an order to get started.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

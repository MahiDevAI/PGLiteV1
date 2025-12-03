import { useState, useEffect } from "react";
import Layout from "@/components/layout";
import { db } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, ArrowDownRight, DollarSign, CreditCard, Activity, Users } from "lucide-react";

const data = [
  { name: 'Mon', total: 1200 },
  { name: 'Tue', total: 2100 },
  { name: 'Wed', total: 800 },
  { name: 'Thu', total: 1600 },
  { name: 'Fri', total: 2400 },
  { name: 'Sat', total: 3200 },
  { name: 'Sun', total: 2800 },
];

export default function DashboardPage() {
  const [stats, setStats] = useState({
    totalRevenue: 0,
    activeOrders: 0,
    successRate: 98,
    todayTransactions: 0
  });

  useEffect(() => {
    const calculateStats = () => {
      const orders = db.getOrders();
      const completed = orders.filter(o => o.status === 'COMPLETED');
      const pending = orders.filter(o => o.status === 'PENDING');
      
      const revenue = completed.reduce((sum, o) => sum + o.amount, 0);
      
      setStats({
        totalRevenue: revenue,
        activeOrders: pending.length,
        successRate: orders.length > 0 ? Math.round((completed.length / orders.length) * 100) : 100,
        todayTransactions: completed.length
      });
    };

    calculateStats();
    return db.subscribe(calculateStats);
  }, []);

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
            <div className="text-2xl font-bold font-heading">₹{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-emerald-500 flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +20.1% from last month
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Orders</CardTitle>
            <Activity className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">{stats.activeOrders}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Waiting for payment
            </p>
          </CardContent>
        </Card>

        <Card className="bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Success Rate</CardTitle>
            <CreditCard className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">{stats.successRate}%</div>
            <p className="text-xs text-blue-500 flex items-center mt-1">
              <ArrowUpRight className="h-3 w-3 mr-1" />
              +2% from yesterday
            </p>
          </CardContent>
        </Card>

         <Card className="bg-card/50 backdrop-blur-sm hover:shadow-md transition-shadow border-border/60">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Today's Txns</CardTitle>
            <Users className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold font-heading">{stats.todayTransactions}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Processed today
            </p>
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
              <AreaChart data={data}>
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
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="space-y-8">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none text-foreground">Payment Received</p>
                      <p className="text-xs text-muted-foreground">User 9823 paid via UPI</p>
                    </div>
                    <div className="ml-auto font-bold font-heading text-emerald-600">+₹{(Math.random() * 1000).toFixed(2)}</div>
                  </div>
                ))}
             </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

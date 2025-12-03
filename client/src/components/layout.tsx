import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { LayoutDashboard, ShoppingCart, Settings, CreditCard, LogOut, ShieldCheck } from "lucide-react";
import logoImage from "@assets/generated_images/minimalist_abstract_shield_logo_for_fintech_app.png";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navItems = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/orders", label: "Orders", icon: ShoppingCart },
    { href: "/transactions", label: "Transactions", icon: CreditCard },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen bg-background font-sans text-foreground overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-sidebar-border bg-sidebar text-sidebar-foreground flex flex-col shadow-2xl z-10">
        <div className="p-6 flex items-center gap-3 border-b border-sidebar-border/50">
          <img src={logoImage} alt="ChargePay" className="w-8 h-8 rounded-sm object-cover" />
          <span className="text-xl font-bold font-heading tracking-tight">ChargePay</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = location === item.href;
            const Icon = item.icon;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 group",
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-lg shadow-primary/20" 
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                )}
              >
                <Icon className={cn("w-5 h-5 transition-colors", isActive ? "text-white" : "text-sidebar-foreground/50 group-hover:text-sidebar-accent-foreground")} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border/50">
          <div className="bg-sidebar-accent/50 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2 mb-2 text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">System Active</span>
            </div>
            <p className="text-xs text-sidebar-foreground/60">RBI-Compliant Mode</p>
          </div>
          <button className="flex items-center gap-3 px-4 py-2 w-full text-sm text-sidebar-foreground/60 hover:text-destructive transition-colors">
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-background relative">
        {/* Subtle background texture/gradient */}
        <div className="absolute inset-0 pointer-events-none opacity-40 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-background to-background"></div>
        
        <div className="relative z-0 p-8 max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}

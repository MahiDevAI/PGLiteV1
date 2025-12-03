import { useQuery } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { unmappedNotificationsApi } from "@/lib/api";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Filter, Loader2, AlertTriangle } from "lucide-react";

export default function UnmappedPage() {
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["/api/unmapped-notifications"],
    queryFn: unmappedNotificationsApi.getAll,
    refetchInterval: 5000,
  });

  const getNotificationText = (json: Record<string, unknown>) => {
    return (json["android.bigText"] || json["android.text"] || json["android.title"] || "No text") as string;
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div>
          <h1 className="text-3xl font-bold font-heading text-foreground tracking-tight">Unmapped Notifications</h1>
          <p className="text-muted-foreground mt-1">Payment notifications that couldn't be matched to orders.</p>
        </div>
      </div>

      <Card className="shadow-sm border-border/60 bg-card/50 backdrop-blur-sm" data-testid="card-unmapped">
        <div className="p-4 border-b border-border/60 flex items-center gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search notifications..." className="pl-9 bg-background/50 border-border/50" data-testid="input-search-unmapped" />
          </div>
          <Button variant="outline" className="ml-auto gap-2" data-testid="button-filter-unmapped">
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
                  <th className="px-6 py-4 font-medium">ID</th>
                  <th className="px-6 py-4 font-medium">Notification Text</th>
                  <th className="px-6 py-4 font-medium">Title</th>
                  <th className="px-6 py-4 font-medium text-right">Received At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {notifications.map((notif) => (
                  <tr key={notif.id} className="hover:bg-muted/20 transition-colors" data-testid={`row-unmapped-${notif.id}`}>
                    <td className="px-6 py-4 font-medium font-mono text-foreground/80" data-testid={`text-id-${notif.id}`}>
                      {notif.id}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500 flex-shrink-0" />
                        <span className="truncate" data-testid={`text-notification-${notif.id}`}>{getNotificationText(notif.notificationJson)}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-muted-foreground max-w-xs truncate" data-testid={`text-title-${notif.id}`}>
                      {(notif.notificationJson["android.title"] as string) || "-"}
                    </td>
                    <td className="px-6 py-4 text-right text-muted-foreground text-xs" data-testid={`text-received-${notif.id}`}>
                      {new Date(notif.receivedAt).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {notifications.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <AlertTriangle className="w-8 h-8 text-muted-foreground/40" />
                        <span>No unmapped notifications found.</span>
                        <span className="text-xs">All payments are being matched correctly.</span>
                      </div>
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

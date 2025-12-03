import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import Layout from "@/components/layout";
import { settingsApi } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function SettingsPage() {
  const [newDomain, setNewDomain] = useState("");
  const { toast } = useToast();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: settingsApi.get,
  });

  const regenerateApiKeyMutation = useMutation({
    mutationFn: settingsApi.regenerateApiKey,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "API Key Regenerated",
        description: "Your new API key is ready. Update your integrations.",
      });
    },
  });

  const regenerateListenerTokenMutation = useMutation({
    mutationFn: settingsApi.regenerateListenerToken,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Listener Token Regenerated",
        description: "Update your Android listener app with the new token.",
      });
    },
  });

  const addDomainMutation = useMutation({
    mutationFn: settingsApi.addDomain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      setNewDomain("");
      toast({
        title: "Domain Added",
        description: "The domain has been whitelisted.",
      });
    },
  });

  const removeDomainMutation = useMutation({
    mutationFn: settingsApi.removeDomain,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Domain Removed",
        description: "The domain has been removed from the whitelist.",
      });
    },
  });

  const handleAddDomain = (e: React.FormEvent) => {
    e.preventDefault();
    if (newDomain.trim()) {
      addDomainMutation.mutate(newDomain.trim());
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-3xl font-bold font-heading text-foreground tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure API access and security.</p>
      </div>

      <div className="space-y-6 max-w-4xl">
        {/* Merchant Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Merchant Configuration</CardTitle>
            <CardDescription>Your UPI and business details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Merchant UPI ID</Label>
              <Input readOnly value={settings?.merchantUpiId || ""} className="font-mono bg-muted/50" data-testid="input-upi-id" />
            </div>
            <div className="space-y-2">
              <Label>Merchant Name</Label>
              <Input readOnly value={settings?.merchantName || ""} className="bg-muted/50" data-testid="input-merchant-name" />
            </div>
          </CardContent>
        </Card>

        {/* API Keys */}
        <Card>
          <CardHeader>
            <CardTitle>API Access</CardTitle>
            <CardDescription>Manage your static API keys for integration.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Static API Key</Label>
              <div className="flex gap-2">
                <Input 
                  readOnly 
                  value={settings?.staticApiKey || ""} 
                  className="font-mono bg-muted/50" 
                  data-testid="input-api-key"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => regenerateApiKeyMutation.mutate()}
                  disabled={regenerateApiKeyMutation.isPending}
                  data-testid="button-regenerate-api-key"
                >
                  {regenerateApiKeyMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Used for server-side order creation.</p>
            </div>

            <div className="space-y-2">
              <Label>Listener Token</Label>
              <div className="flex gap-2">
                <Input 
                  readOnly 
                  value={settings?.listenerToken || ""} 
                  className="font-mono bg-muted/50"
                  data-testid="input-listener-token"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => regenerateListenerTokenMutation.mutate()}
                  disabled={regenerateListenerTokenMutation.isPending}
                  data-testid="button-regenerate-listener"
                >
                  {regenerateListenerTokenMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Used by the Android Listener App.</p>
            </div>
          </CardContent>
        </Card>

        {/* Domain Whitelist */}
        <Card>
          <CardHeader>
            <CardTitle>Domain Whitelist</CardTitle>
            <CardDescription>Control which domains can create orders via API (FR-2).</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleAddDomain} className="flex gap-2">
              <Input 
                placeholder="https://example.com" 
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                data-testid="input-new-domain"
              />
              <Button 
                type="submit" 
                variant="secondary"
                disabled={addDomainMutation.isPending}
                data-testid="button-add-domain"
              >
                {addDomainMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Add
              </Button>
            </form>

            <div className="space-y-2 mt-4">
              {settings?.allowedDomains && settings.allowedDomains.length > 0 ? (
                settings.allowedDomains.map((domain) => (
                  <div key={domain} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20" data-testid={`domain-${domain}`}>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">{domain}</span>
                      <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Active</Badge>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => removeDomainMutation.mutate(domain)}
                      disabled={removeDomainMutation.isPending}
                      data-testid={`button-remove-${domain}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No domains whitelisted. All API requests require a valid API key.
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

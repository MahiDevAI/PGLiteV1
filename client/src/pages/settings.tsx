import Layout from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, RefreshCw } from "lucide-react";

export default function SettingsPage() {
  return (
    <Layout>
      <div className="mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <h1 className="text-3xl font-bold font-heading text-foreground tracking-tight">Settings</h1>
        <p className="text-muted-foreground mt-1">Configure API access and security.</p>
      </div>

      <div className="space-y-6 max-w-4xl">
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
                <Input readOnly value="pk_live_51Mz...Xy7z" className="font-mono bg-muted/50" />
                <Button variant="outline" size="icon">
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Used for server-side order creation.</p>
            </div>

             <div className="space-y-2">
              <Label>Listener Token</Label>
              <div className="flex gap-2">
                <Input readOnly value="lst_8823...99aa" className="font-mono bg-muted/50" />
                 <Button variant="outline" size="icon">
                  <RefreshCw className="w-4 h-4" />
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
            <div className="flex gap-2">
               <Input placeholder="https://example.com" />
               <Button variant="secondary">
                 <Plus className="w-4 h-4 mr-2" />
                 Add
               </Button>
            </div>

            <div className="space-y-2 mt-4">
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">https://myshop.com</span>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Active</Badge>
                </div>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                 <div className="flex items-center gap-2">
                  <span className="font-mono text-sm">https://staging.myshop.com</span>
                  <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">Active</Badge>
                </div>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}

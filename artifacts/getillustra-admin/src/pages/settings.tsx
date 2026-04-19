import { useState, useEffect } from "react";
import { useGetSettings, useUpdateSettings, getGetSettingsQueryKey } from "@/lib/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Save } from "lucide-react";

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useGetSettings();
  const [form, setForm] = useState({
    siteName: "",
    logoUrl: "",
    contactEmail: "",
    featuredItemsCount: 6,
    seoTitle: "",
    seoDescription: "",
  });

  useEffect(() => {
    if (settings) {
      setForm({
        siteName: settings.siteName ?? "",
        logoUrl: settings.logoUrl ?? "",
        contactEmail: settings.contactEmail ?? "",
        featuredItemsCount: settings.featuredItemsCount ?? 6,
        seoTitle: settings.seoTitle ?? "",
        seoDescription: settings.seoDescription ?? "",
      });
    }
  }, [settings]);

  const updateSettings = useUpdateSettings({
    mutation: {
      onSuccess: () => {
        toast.success("Settings saved");
        queryClient.invalidateQueries({ queryKey: getGetSettingsQueryKey() });
      },
      onError: () => toast.error("Failed to save settings"),
    },
  });

  const handleSave = () => {
    updateSettings.mutate({
      data: {
        siteName: form.siteName,
        logoUrl: form.logoUrl || null,
        contactEmail: form.contactEmail || null,
        featuredItemsCount: form.featuredItemsCount,
        seoTitle: form.seoTitle || null,
        seoDescription: form.seoDescription || null,
      },
    });
  };

  const update = (key: string, value: string | number) => setForm((prev) => ({ ...prev, [key]: value }));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl" data-testid="settings-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-1">Configure your site settings</p>
        </div>
        <Button data-testid="save-settings" onClick={handleSave} disabled={updateSettings.isPending}>
          <Save className="h-4 w-4 mr-2" />
          {updateSettings.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">General</CardTitle><CardDescription>Basic site configuration</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Site Name</Label>
            <Input data-testid="setting-site-name" value={form.siteName} onChange={(e) => update("siteName", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Logo URL</Label>
            <Input data-testid="setting-logo-url" value={form.logoUrl} onChange={(e) => update("logoUrl", e.target.value)} placeholder="https://..." />
          </div>
          <div className="space-y-1.5">
            <Label>Contact Email</Label>
            <Input data-testid="setting-contact-email" type="email" value={form.contactEmail} onChange={(e) => update("contactEmail", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Featured Items Count</Label>
            <Input data-testid="setting-featured-count" type="number" min={1} max={24} value={form.featuredItemsCount} onChange={(e) => update("featuredItemsCount", parseInt(e.target.value, 10))} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">SEO Defaults</CardTitle><CardDescription>Default meta tags for search engines</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Meta Title</Label>
            <Input data-testid="setting-seo-title" value={form.seoTitle} onChange={(e) => update("seoTitle", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label>Meta Description</Label>
            <Textarea data-testid="setting-seo-description" value={form.seoDescription} onChange={(e) => update("seoDescription", e.target.value)} rows={3} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

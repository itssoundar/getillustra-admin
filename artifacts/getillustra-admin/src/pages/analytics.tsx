import { useGetMostViewedProjects, useGetMostDownloadedAssets, useGetUserGrowth, useGetSavesTrend, useGetUploadTrend } from "@workspace/api-client-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { format } from "date-fns";

export default function AnalyticsPage() {
  const { data: mostViewed = [], isLoading: loadingViewed } = useGetMostViewedProjects();
  const { data: mostDownloaded = [], isLoading: loadingDownloaded } = useGetMostDownloadedAssets();
  const { data: userGrowth = [], isLoading: loadingGrowth } = useGetUserGrowth();
  const { data: savesTrend = [], isLoading: loadingSaves } = useGetSavesTrend();
  const { data: uploadTrend = [], isLoading: loadingUploads } = useGetUploadTrend();

  const formatDate = (date: string) => {
    try { return format(new Date(date), "MMM d"); } catch { return date; }
  };

  return (
    <div className="space-y-6" data-testid="analytics-page">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Analytics</h1>
        <p className="text-sm text-muted-foreground mt-1">Performance overview across your content</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">User Growth (90 days)</CardTitle></CardHeader>
          <CardContent>
            {loadingGrowth ? <Skeleton className="h-48 w-full" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={userGrowth.map((d) => ({ ...d, date: formatDate(d.date) }))}>
                  <defs><linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="value" name="New Users" stroke="hsl(var(--primary))" fill="url(#colorUsers)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Saves Trend (90 days)</CardTitle></CardHeader>
          <CardContent>
            {loadingSaves ? <Skeleton className="h-48 w-full" /> : (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={savesTrend.map((d) => ({ ...d, date: formatDate(d.date) }))}>
                  <defs><linearGradient id="colorSaves" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} /><stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} /></linearGradient></defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Area type="monotone" dataKey="value" name="Saves" stroke="hsl(var(--chart-2))" fill="url(#colorSaves)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Most Viewed Projects</CardTitle></CardHeader>
          <CardContent>
            {loadingViewed ? <Skeleton className="h-48 w-full" /> : mostViewed.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={mostViewed.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="title" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={120} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="viewCount" name="Views" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Most Downloaded Assets</CardTitle></CardHeader>
          <CardContent>
            {loadingDownloaded ? <Skeleton className="h-48 w-full" /> : mostDownloaded.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No data yet</p>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={mostDownloaded.slice(0, 8)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={120} />
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="downloadCount" name="Downloads" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

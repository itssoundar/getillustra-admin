import { 
  useGetDashboardStats, 
  useGetRecentActivity, 
  useGetUploadTrend, 
  useGetTopCategories 
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";
import { FileImage, FolderTree, Users, Download, Activity, Upload, Edit, Trash, Plus } from "lucide-react";
import { format } from "date-fns";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: recentActivity, isLoading: activityLoading } = useGetRecentActivity();
  const { data: uploadTrend, isLoading: trendLoading } = useGetUploadTrend();
  const { data: topCategories, isLoading: categoriesLoading } = useGetTopCategories();

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'upload': return <Upload className="h-4 w-4 text-blue-500" />;
      case 'edit': return <Edit className="h-4 w-4 text-orange-500" />;
      case 'new_user': return <Users className="h-4 w-4 text-green-500" />;
      case 'publish': return <Activity className="h-4 w-4 text-purple-500" />;
      case 'delete': return <Trash className="h-4 w-4 text-red-500" />;
      default: return <Plus className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground mt-1">Overview of your marketplace metrics and recent activity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statsLoading ? (
          Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-[120px] rounded-xl" />)
        ) : (
          <>
            <MetricCard 
              title="Total Projects" 
              value={stats?.totalProjects ?? 0} 
              icon={<FolderTree className="h-4 w-4 text-muted-foreground" />} 
              description={`${stats?.publishedProjects ?? 0} published`}
            />
            <MetricCard 
              title="Total Assets" 
              value={stats?.totalAssets ?? 0} 
              icon={<FileImage className="h-4 w-4 text-muted-foreground" />} 
            />
            <MetricCard 
              title="Downloads This Month" 
              value={stats?.downloadsThisMonth ?? 0} 
              icon={<Download className="h-4 w-4 text-muted-foreground" />} 
            />
            <MetricCard 
              title="Total Users" 
              value={stats?.totalUsers ?? 0} 
              icon={<Users className="h-4 w-4 text-muted-foreground" />} 
            />
          </>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-7">
        <Card className="col-span-4 lg:col-span-5">
          <CardHeader>
            <CardTitle>Upload Trend (30 Days)</CardTitle>
            <CardDescription>Daily asset uploads over time</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            {trendLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={uploadTrend || []}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(val) => format(new Date(val), 'MMM d')} 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    stroke="hsl(var(--muted-foreground))"
                    dy={10}
                  />
                  <YAxis 
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    stroke="hsl(var(--muted-foreground))"
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                    labelFormatter={(val) => format(new Date(val), 'MMM d, yyyy')}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="value" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorValue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest actions in the platform</CardDescription>
          </CardHeader>
          <CardContent>
            {activityLoading ? (
              <div className="space-y-4">
                {Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-3 w-[150px]" />
                      <Skeleton className="h-3 w-[100px]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                {(recentActivity || []).map((item) => (
                  <div key={item.id} className="flex items-start gap-3">
                    <div className="bg-muted p-2 rounded-full mt-0.5">
                      {getActivityIcon(item.type)}
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-medium leading-none">{item.description}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {item.userName && <span>{item.userName} • </span>}
                        <span>{format(new Date(item.timestamp), 'MMM d, h:mm a')}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {(!recentActivity || recentActivity.length === 0) && (
                  <p className="text-sm text-muted-foreground text-center py-4">No recent activity.</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-7">
          <CardHeader>
            <CardTitle>Top Categories</CardTitle>
            <CardDescription>Most populated project categories</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px] pt-4">
            {categoriesLoading ? (
              <Skeleton className="h-full w-full" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topCategories || []} layout="vertical" margin={{ left: 50, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    type="number"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    stroke="hsl(var(--muted-foreground))"
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category"
                    tick={{ fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    stroke="hsl(var(--foreground))"
                  />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', borderRadius: '8px' }}
                  />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, description }: { title: string, value: number | string, icon: React.ReactNode, description?: string }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value.toLocaleString()}</div>
        {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
      </CardContent>
    </Card>
  );
}

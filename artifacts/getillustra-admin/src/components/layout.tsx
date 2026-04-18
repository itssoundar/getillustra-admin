import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-provider";
import { 
  LayoutDashboard, 
  Image as ImageIcon, 
  FolderTree, 
  Palette, 
  Tags, 
  Users, 
  BarChart3, 
  Settings,
  LogOut,
  Search,
  Menu,
  Moon,
  Sun
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Input } from "./ui/input";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: FolderTree },
  { name: "Assets", href: "/assets", icon: ImageIcon },
  { name: "Categories", href: "/categories", icon: FolderTree },
  { name: "Styles", href: "/styles", icon: Palette },
  { name: "Tags", href: "/tags", icon: Tags },
  { name: "Users", href: "/users", icon: Users },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();

  const handleSignOut = async () => {
    await signOut();
  };

  const NavLinks = () => (
    <nav className="space-y-1 py-4">
      {navItems.map((item) => {
        const isActive = location.startsWith(item.href);
        return (
          <Link key={item.href} href={item.href}>
            <div
              data-testid={`nav-${item.name.toLowerCase()}`}
              className={`flex items-center px-4 py-2.5 mx-3 rounded-md text-sm font-medium transition-colors cursor-pointer ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="mr-3 h-4 w-4" />
              {item.name}
            </div>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background flex w-full">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col fixed inset-y-0 z-50 bg-sidebar border-r border-sidebar-border">
        <div className="flex h-14 items-center px-6 border-b border-sidebar-border">
          <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">GetIllustra Admin</span>
        </div>
        <div className="flex-1 overflow-y-auto py-2">
          <NavLinks />
        </div>
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarFallback>{user?.email?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-sidebar-foreground truncate w-24">{user?.email}</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="text-sidebar-foreground/70 hover:text-sidebar-foreground h-8 w-8">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col md:pl-64">
        {/* Topbar */}
        <header className="sticky top-0 z-40 flex h-14 w-full items-center gap-4 border-b bg-background/95 px-4 backdrop-blur sm:px-6">
          <div className="md:hidden flex items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64 p-0 bg-sidebar border-r-sidebar-border">
                <div className="flex h-14 items-center px-6 border-b border-sidebar-border">
                  <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">GetIllustra Admin</span>
                </div>
                <div className="flex-1 overflow-y-auto py-2">
                  <NavLinks />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex-1 flex items-center justify-end md:justify-between gap-4">
            <div className="hidden md:flex w-full max-w-sm items-center relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search everywhere... (Ctrl+K)"
                className="w-full bg-muted/50 pl-9 border-none focus-visible:ring-1"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="h-8 w-8 text-muted-foreground hover:text-foreground"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>
    </div>
  );
}

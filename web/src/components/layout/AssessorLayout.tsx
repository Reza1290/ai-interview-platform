import { useState } from "react";
import { Outlet, Link, useNavigate, useLocation } from "react-router-dom";
import { useAtomValue, useSetAtom } from "jotai";
import { tenantAtom } from "@/stores/tenantAtom";
import { authAtom, clearToken } from "@/stores/authAtom";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  ClipboardList,
  Briefcase,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/assessments", label: "Assessments", icon: ClipboardList },
  { href: "/vacancies", label: "Vacancies", icon: Briefcase },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function AssessorLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const tenant = useAtomValue(tenantAtom);
  const setAuth = useSetAtom(authAtom);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    clearToken();
    setAuth({ token: null });
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex bg-background">
      <aside
        data-testid="sidebar"
        className={cn(
          "bg-white border-r flex flex-col justify-between shrink-0 transition-all duration-200 sticky top-0 h-screen z-30",
          collapsed ? "w-16" : "w-64"
        )}
      >
        <div className="flex flex-col">
          <div className="h-14 border-b flex items-center justify-between px-3">
            {!collapsed && (
              <Link to="/assessments" className="flex items-center gap-2 overflow-hidden px-1">
                <LayoutDashboard className="h-5 w-5 text-primary shrink-0" />
                <span className="font-semibold text-sm truncate">Rakamin AI</span>
              </Link>
            )}
            {collapsed && (
              <Link to="/assessments" className="mx-auto flex items-center justify-center">
                <LayoutDashboard className="h-5 w-5 text-primary" />
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              data-testid="sidebar-toggle"
              aria-label="Toggle sidebar"
              className={cn("h-8 w-8 text-muted-foreground", collapsed && "mx-auto mt-1")}
              onClick={() => setCollapsed(!collapsed)}
            >
              {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>

          <nav className="p-2 space-y-1" aria-label="Main Navigation">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isActive = location.pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  to={href}
                  title={collapsed ? label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    collapsed && "justify-center px-0"
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && <span className="truncate">{label}</span>}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="border-t p-3 space-y-2">
          {!collapsed && tenant.name && (
            <div className="px-2 py-1 text-xs text-muted-foreground border rounded bg-muted/30 truncate">
              Tenant: {tenant.name}
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            data-testid="logout-button"
            className={cn(
              "w-full text-muted-foreground hover:text-foreground",
              collapsed ? "px-0 justify-center" : "justify-start"
            )}
            onClick={handleLogout}
            title={collapsed ? "Logout" : undefined}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="ml-2">Logout</span>}
          </Button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">
        <div className="max-w-7xl mx-auto w-full px-6 py-6 flex-1">
          <Outlet />
        </div>
      </main>
    </div>
  );
}

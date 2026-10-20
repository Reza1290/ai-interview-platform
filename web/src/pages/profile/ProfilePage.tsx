import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAtom, useAtomValue } from "jotai";
import { authAtom, clearToken } from "@/stores/authAtom";
import { tenantAtom } from "@/stores/tenantAtom";
import { authApi } from "@/services/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogOut, ShieldCheck, Building2, User } from "lucide-react";

export default function ProfilePage() {
  const [auth, setAuth] = useAtom(authAtom);
  const [tenant, setTenant] = useAtom(tenantAtom);
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Refresh current user and tenant context from backend API
    authApi
      .getMe()
      .then((res) => {
        if (res.data?.user) {
          setAuth((prev) => ({ ...prev, user: res.data.user }));
        }
        if (res.data?.tenant) {
          setTenant({
            id: res.data.tenant.id,
            name: res.data.tenant.name,
          });
        }
      })
      .catch(() => {
        // Fallback to local state if offline or token-only
      })
      .finally(() => setLoading(false));
  }, [setAuth, setTenant]);

  const handleLogout = () => {
    clearToken();
    setAuth({ token: null, user: null });
    navigate("/login");
  };

  const user = auth.user;
  const userEmail = user?.email || "admin@example.com";
  const userRole = user?.role || "admin";
  const userId = user?.id ?? 1;

  return (
    <div className="space-y-6 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account credentials, security permissions, and multi-tenant workspace context.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Account Details Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Account Details</CardTitle>
                <CardDescription>
                  Your authenticated assessor credentials and access privileges.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Email Address</Label>
                <div className="text-sm font-medium mt-1">{userEmail}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Role</Label>
                <div className="mt-1">
                  <Badge variant="secondary" className="capitalize text-xs font-semibold">
                    {userRole}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">User ID</Label>
                <div className="text-sm font-mono mt-1">#{userId}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-emerald-600">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Active Session
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tenant Profile Card (Moved from Settings) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Tenant Profile</CardTitle>
                <CardDescription>
                  Multi-tenant workspace identifiers used for role-based scoping and audit logging.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Organization Name</Label>
                <div className="text-sm font-medium mt-1">{tenant.name || "Test Corp"}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Tenant Identifier</Label>
                <div className="text-sm font-mono mt-1">{tenant.id || "test-corp"}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Actions Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Session Security</CardTitle>
                <CardDescription>
                  Authentication token lifecycle and data privacy policy enforcement.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-sm text-muted-foreground space-y-1">
              <p>• Your session is authenticated via signed HMAC-SHA256 JWT bearer credentials.</p>
              <p>• Scoped multi-tenant data access enforced under UU PDP No. 27/2022 standards.</p>
            </div>
            <div className="pt-2">
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 border-destructive/20 gap-2"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" /> Log out
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

import { useAtomValue } from "jotai";
import { tenantAtom } from "@/stores/tenantAtom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import AiSettingsSection from "./AiSettingsSection";

export default function SettingsPage() {
  const tenant = useAtomValue(tenantAtom);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Organization Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your organization profile, assessment preferences, and data privacy policies.
        </p>
      </div>

      <div className="grid gap-6">
        <AiSettingsSection />

        <Card>
          <CardHeader>
            <CardTitle>Tenant Profile</CardTitle>
            <CardDescription>
              Multi-tenant workspace identifiers used for role-based scoping and audit logging.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Organization Name</Label>
                <div className="text-sm font-medium mt-1">{tenant.name || "Default Organization"}</div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Tenant Identifier</Label>
                <div className="text-sm font-mono mt-1">{tenant.id || "system-default"}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Compliance & Privacy</CardTitle>
            <CardDescription>
              Data protection standards enforced across candidate evaluations.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              • All candidate audio sessions require explicit UU PDP No. 27/2022 pre-flight consent before capture.
            </p>
            <p>
              • Sensitive PII (emails, phone numbers, contact info) is scrubbed in application logging tiers.
            </p>
            <p>
              • Portfolio assessment exports are isolated to authenticated assessors within your tenant.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

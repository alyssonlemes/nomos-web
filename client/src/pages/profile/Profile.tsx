import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserService, UserResponse } from "@/services/user.service";
import { OrganizationService, Organization } from "@/services/organization.service";

export default function Profile() {
  const [user, setUser] = useState<UserResponse | null>(UserService.getStoredUser());
  const [loading, setLoading] = useState<boolean>(!user);
  const [error, setError] = useState<string | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [orgLoading, setOrgLoading] = useState<boolean>(false);
  const [orgError, setOrgError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const data = await UserService.getMe();
        if (!mounted) return;
        setUser(data);
        setError(null);
      } catch (err) {
        if (err instanceof Error) setError(err.message);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    if (!user) load();

    return () => {
      mounted = false;
    };
  }, [user]);

  useEffect(() => {
    let mounted = true;

    async function loadOrg() {
      setOrgLoading(true);
      try {
        const data = await OrganizationService.getUserOrganization();
        if (!mounted) return;
        setOrganization(data);
        setOrgError(null);
      } catch (err) {
        if (err instanceof Error) setOrgError(err.message);
      } finally {
        if (mounted) setOrgLoading(false);
      }
    }

    if (user) loadOrg();

    return () => {
      mounted = false;
    };
  }, [user]);

  return (
    <div className="p-8 min-h-full">
      <Card>
        <CardHeader className="flex items-center gap-4">
          <Avatar>
            <AvatarFallback>
              {user?.full_name ? user.full_name.trim().charAt(0) : "U"}
            </AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>{user ? user.full_name : (loading ? 'Carregando...' : 'Usuário')}</CardTitle>
            <CardDescription>{user ? user.email : (error ?? '')}</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Nome</div>
              <div className="font-medium">{user?.full_name ?? '—'}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">E-mail</div>
              <div className="font-medium">{user?.email ?? '—'}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Role</div>
              <div className="font-medium uppercase">{user?.role ?? '—'}</div>
            </div>

            <div>
              <div className="text-sm text-muted-foreground">Organização</div>
                <div className="font-medium">{organization ? organization.name : (orgLoading ? 'Carregando...' : (orgError ?? (user?.organization_id ?? '—')))}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

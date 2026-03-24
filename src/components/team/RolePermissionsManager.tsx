import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CompanyPermissions, PermissionKey, ROLE_PERMISSIONS } from '@/types/advanced-features';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Shield, AlertCircle, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";

interface RolePermissionsManagerProps {
    companyId: string;
}

export function RolePermissionsManager({ companyId }: RolePermissionsManagerProps) {
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [isAddRoleModalOpen, setIsAddRoleModalOpen] = useState(false);
    const [newRoleName, setNewRoleName] = useState('');

    const { data: roles = [], isLoading } = useQuery({
        queryKey: ['company-roles', companyId],
        queryFn: async () => {
            const { data, error } = await (supabase
                .from('company_roles' as any)
                .select('*')
                .eq('company_id', companyId)
                .order('role_name', { ascending: true }) as any);

            if (error) throw error;
            return data;
        },
    });

    const updatePermissionMutation = useMutation({
        mutationFn: async ({ roleId, permissions }: { roleId: string, permissions: CompanyPermissions }) => {
            const { error } = await (supabase
                .from('company_roles' as any)
                .update({ permissions, updated_at: new Date().toISOString() })
                .eq('id', roleId) as any);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company-roles'] });
            toast({ title: 'Permissions updated', description: 'Role permissions have been saved.' });
        },
    });

    const createRoleMutation = useMutation({
        mutationFn: async (name: string) => {
            const { error } = await (supabase
                .from('company_roles' as any)
                .insert({
                    company_id: companyId,
                    role_name: name.toLowerCase(),
                    permissions: ROLE_PERMISSIONS['coordinator'], // Default to coordinator perms
                    is_system_role: false
                }) as any);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company-roles'] });
            setIsAddRoleModalOpen(false);
            setNewRoleName('');
            toast({ title: 'Role created', description: 'Custom role has been added successfully.' });
        },
        onError: (err: any) => {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        }
    });

    const deleteRoleMutation = useMutation({
        mutationFn: async (roleId: string) => {
            const { error } = await (supabase
                .from('company_roles' as any)
                .delete()
                .eq('id', roleId) as any);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['company-roles'] });
            toast({ title: 'Role deleted', description: 'The custom role has been removed.' });
        },
    });

    const togglePermission = (role: any, permission: PermissionKey) => {
        const newPermissions = {
            ...(role.permissions as CompanyPermissions),
            [permission]: !role.permissions[permission]
        };
        updatePermissionMutation.mutate({ roleId: role.id, permissions: newPermissions });
    };

    const permissionLabels: Record<PermissionKey, string> = {
        canPostJobs: 'Post Jobs',
        canEditJobs: 'Edit Jobs',
        canDeleteJobs: 'Delete Jobs',
        canManageCandidates: 'Manage Candidates',
        canManageInterviews: 'Manage Interviews',
        canRecordVoice: 'Record Voice Notes',
        canManageTeam: 'Manage Team',
        canEditCompany: 'Edit Company Profile',
        viewFullDashboard: 'View Full Dashboard'
    };

    if (isLoading) return <div className="p-4 text-center">Loading permissions...</div>;

    return (
        <Card className="mt-8 border-primary/20 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <Shield className="h-5 w-5 text-primary" />
                        Role Permissions
                    </CardTitle>
                    <CardDescription>
                        Customize what each role can do within your organization.
                    </CardDescription>
                </div>
                <Dialog open={isAddRoleModalOpen} onOpenChange={setIsAddRoleModalOpen}>
                    <DialogTrigger asChild>
                        <Button className="gap-2">
                            <Plus className="h-4 w-4" />
                            Create Custom Role
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create Custom Role</DialogTitle>
                            <DialogDescription>
                                Add a new role type for your organization. You can customize its permissions after creating it.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="py-4">
                            <Label htmlFor="role-name">Role Name</Label>
                            <Input
                                id="role-name"
                                value={newRoleName}
                                onChange={(e) => setNewRoleName(e.target.value)}
                                placeholder="e.g. Hiring Manager"
                                className="mt-2"
                            />
                        </div>
                        <DialogFooter>
                            <Button
                                onClick={() => createRoleMutation.mutate(newRoleName)}
                                disabled={!newRoleName || createRoleMutation.isPending}
                            >
                                Create Role
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[200px]">Permission</TableHead>
                                {roles.map((role: any) => (
                                    <TableHead key={role.id} className="text-center min-w-[120px]">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="capitalize font-bold">{role.role_name}</span>
                                            {!role.is_system_role && (
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 text-destructive"
                                                    onClick={() => deleteRoleMutation.mutate(role.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </Button>
                                            )}
                                        </div>
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(Object.keys(permissionLabels) as PermissionKey[]).map((perm) => (
                                <TableRow key={perm}>
                                    <TableCell className="font-medium">{permissionLabels[perm]}</TableCell>
                                    {roles.map((role: any) => (
                                        <TableCell key={role.id} className="text-center">
                                            <Switch
                                                checked={!!role.permissions[perm]}
                                                onCheckedChange={() => togglePermission(role, perm)}
                                                disabled={role.role_name === 'admin' || updatePermissionMutation.isPending}
                                            />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>

                <div className="mt-6 p-4 bg-muted/50 rounded-lg flex items-start gap-3">
                    <Info className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div className="text-sm text-muted-foreground">
                        <p className="font-medium text-foreground mb-1">About Permissions</p>
                        <ul className="list-disc list-inside space-y-1">
                            <li><strong>Admin</strong> role always has full access and cannot be modified.</li>
                            <li><strong>System roles</strong> (Admin, Recruiter, Coordinator) cannot be deleted.</li>
                            <li>Changes to permissions take effect immediately for all users assigned to that role.</li>
                        </ul>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

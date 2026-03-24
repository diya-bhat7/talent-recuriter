import { useState } from 'react';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { useDebouncedMutation } from '@/hooks/useDebouncedMutation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';
import { notifyTeamMemberAdded } from '@/services/notifications';
import { Header } from '@/components/layout/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Users, UserPlus, Shield, Mail, Trash2, ArrowLeft, Loader2, Key } from 'lucide-react';
import { useNavigate, Navigate } from 'react-router-dom';
import { TeamRole } from '@/types/advanced-features';
import { RolePermissionsManager } from '@/components/team/RolePermissionsManager';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function TeamManagement() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const { company, profile } = useAuth();
    const { isAdmin, canManageTeam } = usePermissions();

    if (!isAdmin && !canManageTeam) {
        return <Navigate to="/dashboard" replace />;
    }

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
    const [memberToRemove, setMemberToRemove] = useState<any | null>(null);
    const [selectedMemberForPassword, setSelectedMemberForPassword] = useState<any | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [newMember, setNewMember] = useState({
        name: '',
        email: '',
        role: 'coordinator' as TeamRole,
        password: ''
    });

    const { data: companyRoles = [], isLoading: isLoadingRoles } = useQuery({
        queryKey: ['company-roles', company?.id],
        queryFn: async () => {
            if (!company?.id) return [];
            const { data, error } = await (supabase
                .from('company_roles' as any)
                .select('*')
                .eq('company_id', company.id)
                .order('role_name', { ascending: true }) as any);
            if (error) throw error;
            return data;
        },
        enabled: !!company?.id,
    });

    const { data: members = [], isLoading } = useQuery({
        queryKey: ['team-members', company?.id],
        queryFn: async () => {
            if (!company?.id) return [];
            const { data, error } = await supabase
                .from('team_members')
                .select('*')
                .eq('company_id', company.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data;
        },
        enabled: !!company?.id,
    });

    const updateRoleMutation = useDebouncedMutation({
        mutationFn: async ({ memberId, role }: { memberId: string, role: TeamRole }) => {
            const { error } = await supabase
                .from('team_members')
                .update({ role, updated_at: new Date().toISOString() })
                .eq('id', memberId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['team-members'] });
            toast({ title: 'Role updated', description: 'The team member role has been updated.' });
        },
        onError: (error: any) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    const removeMemberMutation = useDebouncedMutation({
        mutationFn: async (memberId: string) => {
            const { error } = await supabase
                .from('team_members')
                .delete()
                .eq('id', memberId);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['team-members'] });
            toast({ title: 'Member removed', description: 'The member has been removed from the team.' });
        },
        onError: (error: any) => {
            toast({ title: 'Error', description: error.message, variant: 'destructive' });
        }
    });

    const updatePasswordMutation = useDebouncedMutation({
        mutationFn: async ({ targetUserId, password }: { targetUserId: string, password: string }) => {
            if (!company?.id) return;
            const { data, error } = await supabase.functions.invoke('manage-teammate', {
                body: {
                    action: 'update-password',
                    targetUserId,
                    password,
                    companyId: company.id
                }
            });
            if (error) throw error;
            if (data?.error) throw new Error(data.error);
            return data;
        },
        onSuccess: () => {
            setIsPasswordModalOpen(false);
            setNewPassword('');
            setSelectedMemberForPassword(null);
            toast({ title: 'Password updated', description: 'The team member password has been updated successfully.' });
        },
        onError: (error: any) => {
            console.error('Password Update Failed:', error);
            let errorMessage = error.message || 'Unknown error occurred';

            // Check for specific Supabase Function error patterns
            if (error.context?.json?.error) {
                errorMessage = error.context.json.error;
            } else if (error.message?.includes('Failed to send a request')) {
                errorMessage = 'Could not reach the Edge Function. Please ensure "manage-teammate" is deployed to Supabase.';
            }

            toast({
                title: 'Error updating password',
                description: errorMessage,
                variant: 'destructive'
            });
        }
    });

    const handleAddMember = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!company?.id) return;

        setIsCreating(true);
        try {
            const { data, error } = await supabase.functions.invoke('create-teammate', {
                body: {
                    email: newMember.email,
                    password: newMember.password,
                    full_name: newMember.name,
                    role: newMember.role,
                    company_id: company.id
                }
            });

            if (error) throw error;

            if (data.error) {
                if (data.is_diag) {
                    const diagMsg = `DIAGNOSTIC: ${data.error} (Token Length: ${data.token_length})`;
                    throw new Error(diagMsg);
                }
                throw new Error(data.error);
            }

            toast({
                title: 'Success',
                description: 'Team member added successfully. They will receive a welcome email shortly.'
            });

            // Send welcome notification to the new team member
            if (data?.user_id || data?.tempPassword) {
                // The edge function returns user info - notify if we got a user_id
                const newUserId = data.user_id;
                if (newUserId && company?.company_name) {
                    notifyTeamMemberAdded({
                        userId: newUserId,
                        companyId: company.id,
                        companyName: company.company_name,
                        role: newMember.role,
                    }).catch(() => { });
                }
            }

            setIsAddModalOpen(false);
            setNewMember({ name: '', email: '', role: 'coordinator', password: '' });
            queryClient.invalidateQueries({ queryKey: ['team-members'] });
        } catch (err: any) {
            console.error('--- EDGE FUNCTION INVOCATION FAILED ---');
            console.error('Detailed Error Object:', err);

            let errorMessage = err.message || 'Unknown error occurred';
            const status = err.status || err.context?.status || 'No Status';

            // Handle Supabase FunctionsHttpError specifically
            if (err.context?.json?.error) {
                errorMessage = err.context.json.error;
            } else if (err.context?.json?.message) {
                errorMessage = err.context.json.message;
            } else if (status === 403 || errorMessage.toLowerCase().includes('forbidden')) {
                // Keep the specific error message from the server (which now includes ID and role)
                errorMessage = errorMessage || 'Access Denied: You do not have permission to perform this action.';
            } else if (status === 401 || errorMessage.toLowerCase().includes('unauthorized')) {
                // Prioritize the detailed error from the server
                errorMessage = errorMessage || 'Session Expired: Please log out and back in.';
            } else if (errorMessage.includes('non-2xx')) {
                errorMessage = `Supabase Error (${status}). This usually means the function crashed. Please check the "Logs" tab in Supabase for "create-teammate".`;
            } else if (status === 'No Status' && errorMessage.includes('Failed to fetch')) {
                errorMessage = 'Connection Error: Could not reach Supabase. Check your internet or if the function is active.';
            }

            toast({
                title: 'Membership Action Failed',
                description: errorMessage,
                variant: 'destructive'
            });
        } finally {
            setIsCreating(false);
        }
    };

    const getInitials = (name: string | null) => {
        if (!name) return '??';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto py-8 px-4">
                <div className="flex items-center gap-4 mb-8">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/dashboard')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                            <Users className="h-8 w-8 text-primary" />
                            Team Management
                        </h1>
                        <p className="text-muted-foreground">Manage your company members and their roles.</p>
                    </div>
                    <div className="ml-auto">
                        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                            <DialogTrigger asChild>
                                <Button className="gap-2">
                                    <UserPlus className="h-4 w-4" />
                                    Add Member
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <form onSubmit={handleAddMember}>
                                    <DialogHeader>
                                        <DialogTitle>Add Team Member</DialogTitle>
                                        <DialogDescription>
                                            Create a new account for your teammate. They will be able to login immediately.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid gap-4 py-4">
                                        <div className="grid gap-2">
                                            <Label htmlFor="name">Full Name</Label>
                                            <Input
                                                id="name"
                                                placeholder="Jane Doe"
                                                value={newMember.name}
                                                onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="email">Email</Label>
                                            <Input
                                                id="email"
                                                type="email"
                                                placeholder="jane@example.com"
                                                value={newMember.email}
                                                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                                                required
                                            />
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="role">Role</Label>
                                            <Select
                                                value={newMember.role}
                                                onValueChange={(value) => setNewMember({ ...newMember, role: value as TeamRole })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select role" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {companyRoles.map((r: any) => (
                                                        <SelectItem key={r.id} value={r.role_name} className="capitalize">
                                                            {r.role_name}
                                                        </SelectItem>
                                                    ))}
                                                    {companyRoles.length === 0 && (
                                                        <>
                                                            <SelectItem value="admin">Admin</SelectItem>
                                                            <SelectItem value="recruiter">Recruiter</SelectItem>
                                                            <SelectItem value="coordinator">Coordinator</SelectItem>
                                                        </>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="grid gap-2">
                                            <Label htmlFor="password">Initial Password</Label>
                                            <div className="relative">
                                                <Input
                                                    id="password"
                                                    type="text"
                                                    placeholder="••••••••"
                                                    value={newMember.password}
                                                    onChange={(e) => setNewMember({ ...newMember, password: e.target.value })}
                                                    required
                                                    minLength={6}
                                                    className="pr-10"
                                                />
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="icon"
                                                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                                    onClick={() => {
                                                        const randomPass = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
                                                        setNewMember({ ...newMember, password: randomPass });
                                                    }}
                                                    title="Generate random password"
                                                >
                                                    <Key className="h-4 w-4 text-muted-foreground" />
                                                </Button>
                                            </div>
                                            <p className="text-[11px] text-muted-foreground">
                                                Share this password with the user. They can change it after logging in.
                                            </p>
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button type="submit" disabled={isCreating}>
                                            {isCreating ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Creating...
                                                </>
                                            ) : (
                                                'Create Account'
                                            )}
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Team Members</CardTitle>
                            <CardDescription>
                                {members.length} members in your organization.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Member</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {members.map((member) => (
                                        <TableRow key={member.id}>
                                            <TableCell>
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-10 w-10 border border-border">
                                                        <AvatarFallback>{getInitials(member.name)}</AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <div className="font-medium">{member.name || 'Pending Invite'}</div>
                                                        <div className="text-sm text-muted-foreground flex items-center gap-1">
                                                            <Mail className="h-3 w-3" />
                                                            {member.email}
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Select
                                                    value={member.role}
                                                    onValueChange={(value) => updateRoleMutation.mutate({ memberId: member.id, role: value as TeamRole })}
                                                    disabled={member.user_id === profile?.id || updateRoleMutation.isPending}
                                                >
                                                    <SelectTrigger className="w-[140px]">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {companyRoles.map((r: any) => (
                                                            <SelectItem key={r.id} value={r.role_name} className="capitalize">
                                                                {r.role_name}
                                                            </SelectItem>
                                                        ))}
                                                        {companyRoles.length === 0 && (
                                                            <>
                                                                <SelectItem value="admin">Admin</SelectItem>
                                                                <SelectItem value="recruiter">Recruiter</SelectItem>
                                                                <SelectItem value="coordinator">Coordinator</SelectItem>
                                                            </>
                                                        )}
                                                    </SelectContent>
                                                </Select>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant={member.accepted_at ? "outline" : "secondary"} className={member.accepted_at ? "bg-emerald-50 text-emerald-700 border-emerald-200" : ""}>
                                                    {member.accepted_at ? 'Active' : 'Invited'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {isAdmin && (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
                                                            onClick={() => {
                                                                setSelectedMemberForPassword(member);
                                                                setIsPasswordModalOpen(true);
                                                            }}
                                                            title="Change Password"
                                                        >
                                                            <Key className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => setMemberToRemove(member)}
                                                        disabled={member.user_id === profile?.id || removeMemberMutation.isPending}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-primary" />
                                    Admin
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">Full access to all features including team management and company settings.</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-emerald-500" />
                                    Recruiter
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">Manage jobs and candidates. Cannot manage team or edit company profile.</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium flex items-center gap-2">
                                    <Shield className="h-4 w-4 text-blue-500" />
                                    Coordinator
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">View-only access to jobs and candidates. Can manage interviews.</p>
                            </CardContent>
                        </Card>
                    </div>

                    {company?.id && (
                        <RolePermissionsManager companyId={company.id} />
                    )}
                </div>
            </main>

            <ConfirmDialog
                open={!!memberToRemove}
                onOpenChange={(open) => { if (!open) setMemberToRemove(null); }}
                title="Remove team member?"
                description={`Are you sure you want to remove ${memberToRemove?.profiles?.full_name || 'this member'} from the team? This action cannot be undone.`}
                confirmLabel="Remove"
                onConfirm={() => {
                    if (memberToRemove) removeMemberMutation.mutate(memberToRemove.id);
                }}
            />

            <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        if (selectedMemberForPassword && newPassword) {
                            updatePasswordMutation.mutate({
                                targetUserId: selectedMemberForPassword.user_id,
                                password: newPassword
                            });
                        }
                    }}>
                        <DialogHeader>
                            <DialogTitle>Change Password</DialogTitle>
                            <DialogDescription>
                                Set a new password for {selectedMemberForPassword?.name || 'this member'}.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="new-password"
                                        type="text"
                                        placeholder="••••••••"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        minLength={6}
                                        className="pr-10"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => {
                                            const randomPass = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-4).toUpperCase();
                                            setNewPassword(randomPass);
                                        }}
                                        title="Generate random password"
                                    >
                                        <Key className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                </div>
                                <p className="text-[11px] text-muted-foreground">
                                    Share this new password with the user.
                                </p>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="submit" disabled={updatePasswordMutation.isPending || !newPassword}>
                                {updatePasswordMutation.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Update Password'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </div>
    );
}

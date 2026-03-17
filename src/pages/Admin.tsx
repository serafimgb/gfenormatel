import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth, AppRole } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Shield, UserCheck, UserX, Trash2, Plus, ArrowLeft, Eye, Users, Settings, Crown, ChevronDown, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  is_approved: boolean;
  created_at: string;
  role?: AppRole;
}

const ROLE_OPTIONS: { value: AppRole; label: string; description: string; icon: React.ReactNode }[] = [
  { value: 'viewer', label: 'Visualizador', description: 'Só visualiza agendamentos', icon: <Eye className="w-3.5 h-3.5" /> },
  { value: 'user', label: 'Operador', description: 'Agenda e cancela os próprios', icon: <Users className="w-3.5 h-3.5" /> },
  { value: 'manager', label: 'Gestor', description: 'Agenda, cancela e edita todos', icon: <Settings className="w-3.5 h-3.5" /> },
  { value: 'admin', label: 'Admin', description: 'Acesso total + painel admin', icon: <Crown className="w-3.5 h-3.5" /> },
];

const ROLE_BADGE_COLORS: Record<string, string> = {
  admin: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
  manager: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
  user: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-800',
  viewer: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600',
};

const Admin: React.FC = () => {
  const { toast } = useToast();
  const { isAdmin, user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [equipmentTypes, setEquipmentTypes] = useState<any[]>([]);
  const [newEquipment, setNewEquipment] = useState({ id: '', name: '', color: '#57B952' });

  const [projects, setProjects] = useState<any[]>([]);
  const [newProject, setNewProject] = useState({ id: '', name: '', description: '' });

  const [activeTab, setActiveTab] = useState<'users' | 'equipment' | 'projects'>('users');

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (!profiles) return;

    const { data: roles } = await supabase.from('user_roles').select('*');
    
    const enriched: UserProfile[] = profiles.map(p => {
      const userRoles = roles?.filter(r => r.user_id === p.id) ?? [];
      let role: AppRole = 'user';
      if (userRoles.some(r => r.role === 'admin')) role = 'admin';
      else if (userRoles.some(r => r.role === 'manager')) role = 'manager';
      else if (userRoles.some(r => r.role === 'viewer')) role = 'viewer';
      
      return { ...p, role };
    });
    
    setUsers(enriched);
    setLoading(false);
  };

  const fetchEquipment = async () => {
    const { data } = await supabase.from('equipment_types').select('*').order('name');
    if (data) setEquipmentTypes(data);
  };

  const fetchProjects = async () => {
    const { data } = await supabase.from('projects').select('*').order('name');
    if (data) setProjects(data);
  };

  useEffect(() => {
    fetchUsers();
    fetchEquipment();
    fetchProjects();
  }, []);

  const toggleApproval = async (userId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('profiles')
      .update({ is_approved: !currentStatus })
      .eq('id', userId);

    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: !currentStatus ? "Usuário aprovado!" : "Acesso revogado." });
      fetchUsers();
    }
  };

  const changeRole = async (userId: string, newRole: AppRole) => {
    await supabase.from('user_roles').delete().eq('user_id', userId);
    
    if (newRole !== 'user') {
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: newRole });
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
        return;
      }
    }
    
    toast({ title: `Perfil alterado para ${ROLE_OPTIONS.find(r => r.value === newRole)?.label}` });
    fetchUsers();
  };

  const deleteUser = async (userId: string) => {
    setDeletingUserId(userId);
    try {
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: { userId },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({ title: "Usuário excluído com sucesso." });
      setConfirmDeleteId(null);
      fetchUsers();
    } catch (err: any) {
      toast({ title: "Erro ao excluir", description: err.message, variant: "destructive" });
    } finally {
      setDeletingUserId(null);
    }
  };

  const addEquipment = async () => {
    if (!newEquipment.id || !newEquipment.name) return;
    const { error } = await supabase.from('equipment_types').insert({
      id: newEquipment.id.toUpperCase().replace(/\s+/g, '_'),
      name: newEquipment.name,
      color: newEquipment.color,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Equipamento adicionado!" });
      setNewEquipment({ id: '', name: '', color: '#57B952' });
      fetchEquipment();
    }
  };

  const deleteEquipment = async (id: string) => {
    const { error } = await supabase.from('equipment_types').delete().eq('id', id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Equipamento removido." });
      fetchEquipment();
    }
  };

  const addProject = async () => {
    if (!newProject.id || !newProject.name) return;
    const { error } = await supabase.from('projects').insert(newProject);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Projeto adicionado!" });
      setNewProject({ id: '', name: '', description: '' });
      fetchProjects();
    }
  };

  const deleteProject = async (id: string) => {
    const { error } = await supabase.from('projects').delete().eq('id', id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Projeto removido." });
      fetchProjects();
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-muted-foreground font-bold">Acesso negado.</p>
      </div>
    );
  }

  const tabs = [
    { key: 'users' as const, label: 'Usuários', icon: <Users className="w-4 h-4" /> },
    { key: 'equipment' as const, label: 'Equipamentos', icon: <Settings className="w-4 h-4" /> },
    { key: 'projects' as const, label: 'Projetos', icon: <Shield className="w-4 h-4" /> },
  ];

  return (
    <Layout>
      <div className="flex flex-col h-full bg-card">
        <div className="bg-normatel-gradient px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-primary-foreground hover:bg-primary-foreground/10 h-8 w-8 sm:h-9 sm:w-9">
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </Button>
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            <h2 className="text-sm sm:text-lg font-black text-primary-foreground uppercase tracking-wider">
              Painel Admin
            </h2>
          </div>
        </div>

        <div className="flex bg-muted border-b border-border px-2 sm:px-6 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 sm:px-4 py-3 text-[10px] sm:text-xs font-black uppercase tracking-wider border-b-4 transition-all flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-3 sm:p-6">
          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-3 max-w-4xl">
              {loading ? (
                <p className="text-muted-foreground text-sm">Carregando...</p>
              ) : users.map(u => (
                <div key={u.id} className="bg-card border border-border rounded-xl p-3 sm:p-4">
                  {/* Mobile: stacked layout / Desktop: row layout */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    {/* User info */}
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-foreground truncate">{u.full_name || 'Sem nome'}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {u.is_approved ? (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">Aprovado</span>
                        ) : (
                          <span className="text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">Pendente</span>
                        )}
                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${ROLE_BADGE_COLORS[u.role || 'user']}`}>
                          {ROLE_OPTIONS.find(r => r.value === u.role)?.label || 'Operador'}
                        </span>
                        <span className="text-[10px] text-muted-foreground py-0.5">
                          {new Date(u.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center shrink-0">
                      {/* Role selector */}
                      <div className="relative">
                        <select
                          value={u.role || 'user'}
                          onChange={(e) => changeRole(u.id, e.target.value as AppRole)}
                          className="w-full sm:w-auto text-xs font-bold bg-muted border border-border rounded-lg px-3 pr-8 py-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary/30 appearance-none"
                        >
                          {ROLE_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
                      </div>

                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={u.is_approved ? "destructive" : "default"}
                          onClick={() => toggleApproval(u.id, u.is_approved)}
                          className="text-xs font-bold gap-1 flex-1 sm:flex-none"
                        >
                          {u.is_approved ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                          {u.is_approved ? 'Revogar' : 'Aprovar'}
                        </Button>

                        {/* Delete button */}
                        {u.id !== user?.id && (
                          confirmDeleteId === u.id ? (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteUser(u.id)}
                                disabled={deletingUserId === u.id}
                                className="text-xs font-bold gap-1"
                              >
                                {deletingUserId === u.id ? '...' : 'Confirmar'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-xs font-bold"
                              >
                                Não
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setConfirmDeleteId(u.id)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
                            >
                              <Trash2 className="w-3 h-3" />
                              <span className="hidden sm:inline">Excluir</span>
                            </Button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Equipment Tab */}
          {activeTab === 'equipment' && (
            <div className="space-y-4 max-w-2xl">
              <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                <div className="flex-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">ID</label>
                  <Input value={newEquipment.id} onChange={e => setNewEquipment(p => ({ ...p, id: e.target.value }))} placeholder="PEMT_40M" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome</label>
                  <Input value={newEquipment.name} onChange={e => setNewEquipment(p => ({ ...p, name: e.target.value }))} placeholder="PEMT 40 metros" />
                </div>
                <div className="flex gap-2 items-end">
                  <div className="w-16 sm:w-20">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cor</label>
                    <Input type="color" value={newEquipment.color} onChange={e => setNewEquipment(p => ({ ...p, color: e.target.value }))} />
                  </div>
                  <Button onClick={addEquipment} className="bg-normatel-gradient font-bold gap-1">
                    <Plus className="w-4 h-4" /> <span className="hidden sm:inline">Adicionar</span>
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                {equipmentTypes.map(eq => (
                  <div key={eq.id} className="flex items-center justify-between bg-card border border-border rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: eq.color }} />
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{eq.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{eq.id}</p>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => deleteEquipment(eq.id)} className="text-destructive hover:text-destructive shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <div className="space-y-4 max-w-2xl">
              <div className="flex flex-col sm:flex-row gap-2 sm:items-end">
                <div className="w-full sm:w-24">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">ID</label>
                  <Input value={newProject.id} onChange={e => setNewProject(p => ({ ...p, id: e.target.value }))} placeholder="744" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome</label>
                  <Input value={newProject.name} onChange={e => setNewProject(p => ({ ...p, name: e.target.value }))} placeholder="Projeto 744" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Descrição</label>
                  <Input value={newProject.description} onChange={e => setNewProject(p => ({ ...p, description: e.target.value }))} placeholder="Descrição do projeto" />
                </div>
                <Button onClick={addProject} className="bg-normatel-gradient font-bold gap-1 w-full sm:w-auto">
                  <Plus className="w-4 h-4" /> Adicionar
                </Button>
              </div>
              <div className="space-y-2">
                {projects.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-card border border-border rounded-lg p-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.description || p.id}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => deleteProject(p.id)} className="text-destructive hover:text-destructive shrink-0">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Admin;

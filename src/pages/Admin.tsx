import React, { useState, useEffect } from 'react';
import { Layout } from '@/components/Layout';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Shield, UserCheck, UserX, Trash2, Plus, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface UserProfile {
  id: string;
  email: string | null;
  full_name: string | null;
  is_approved: boolean;
  created_at: string;
  isAdmin?: boolean;
}

const Admin: React.FC = () => {
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  // Equipment management
  const [equipmentTypes, setEquipmentTypes] = useState<any[]>([]);
  const [newEquipment, setNewEquipment] = useState({ id: '', name: '', color: '#57B952' });

  // Project management
  const [projects, setProjects] = useState<any[]>([]);
  const [newProject, setNewProject] = useState({ id: '', name: '', description: '' });

  const [activeTab, setActiveTab] = useState<'users' | 'equipment' | 'projects'>('users');

  const fetchUsers = async () => {
    const { data: profiles } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (!profiles) return;

    const { data: roles } = await supabase.from('user_roles').select('*');
    
    const enriched = profiles.map(p => ({
      ...p,
      isAdmin: roles?.some(r => r.user_id === p.id && r.role === 'admin') ?? false,
    }));
    
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

  const toggleAdmin = async (userId: string, currentlyAdmin: boolean) => {
    if (currentlyAdmin) {
      const { error } = await supabase
        .from('user_roles')
        .delete()
        .eq('user_id', userId)
        .eq('role', 'admin');
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Permissão de admin removida." });
        fetchUsers();
      }
    } else {
      const { error } = await supabase
        .from('user_roles')
        .insert({ user_id: userId, role: 'admin' });
      if (error) {
        toast({ title: "Erro", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Admin adicionado!" });
        fetchUsers();
      }
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
    { key: 'users' as const, label: 'Usuários' },
    { key: 'equipment' as const, label: 'Equipamentos' },
    { key: 'projects' as const, label: 'Projetos' },
  ];

  return (
    <Layout>
      <div className="flex flex-col h-full bg-card">
        <div className="bg-normatel-gradient px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="text-primary-foreground hover:bg-primary-foreground/10">
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <Shield className="w-6 h-6 text-primary-foreground" />
            <h2 className="text-lg font-black text-primary-foreground uppercase tracking-wider">
              Painel Administrativo
            </h2>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-muted border-b border-border px-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-3 text-xs font-black uppercase tracking-wider border-b-4 transition-all ${
                activeTab === tab.key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-6">
          {/* Users Tab */}
          {activeTab === 'users' && (
            <div className="space-y-3 max-w-3xl">
              {loading ? (
                <p className="text-muted-foreground text-sm">Carregando...</p>
              ) : users.map(u => (
                <div key={u.id} className="bg-card border border-border rounded-xl p-4 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-foreground truncate">{u.full_name || 'Sem nome'}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    <div className="flex gap-2 mt-1">
                      {u.is_approved && (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full">Aprovado</span>
                      )}
                      {u.isAdmin && (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">Admin</span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <Button
                      size="sm"
                      variant={u.is_approved ? "destructive" : "default"}
                      onClick={() => toggleApproval(u.id, u.is_approved)}
                      className="text-xs font-bold gap-1"
                    >
                      {u.is_approved ? <UserX className="w-3 h-3" /> : <UserCheck className="w-3 h-3" />}
                      {u.is_approved ? 'Revogar' : 'Aprovar'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggleAdmin(u.id, u.isAdmin ?? false)}
                      className="text-xs font-bold gap-1"
                    >
                      <Shield className="w-3 h-3" />
                      {u.isAdmin ? 'Remover Admin' : 'Tornar Admin'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Equipment Tab */}
          {activeTab === 'equipment' && (
            <div className="space-y-4 max-w-2xl">
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">ID</label>
                  <Input value={newEquipment.id} onChange={e => setNewEquipment(p => ({ ...p, id: e.target.value }))} placeholder="PEMT_40M" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nome</label>
                  <Input value={newEquipment.name} onChange={e => setNewEquipment(p => ({ ...p, name: e.target.value }))} placeholder="PEMT 40 metros" />
                </div>
                <div className="w-20">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cor</label>
                  <Input type="color" value={newEquipment.color} onChange={e => setNewEquipment(p => ({ ...p, color: e.target.value }))} />
                </div>
                <Button onClick={addEquipment} className="bg-normatel-gradient font-bold gap-1">
                  <Plus className="w-4 h-4" /> Adicionar
                </Button>
              </div>
              <div className="space-y-2">
                {equipmentTypes.map(eq => (
                  <div key={eq.id} className="flex items-center justify-between bg-card border border-border rounded-lg p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-full" style={{ backgroundColor: eq.color }} />
                      <div>
                        <p className="text-sm font-bold text-foreground">{eq.name}</p>
                        <p className="text-xs text-muted-foreground">{eq.id}</p>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => deleteEquipment(eq.id)} className="text-destructive hover:text-destructive">
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
              <div className="flex gap-2 items-end">
                <div className="w-24">
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
                <Button onClick={addProject} className="bg-normatel-gradient font-bold gap-1">
                  <Plus className="w-4 h-4" /> Adicionar
                </Button>
              </div>
              <div className="space-y-2">
                {projects.map(p => (
                  <div key={p.id} className="flex items-center justify-between bg-card border border-border rounded-lg p-3">
                    <div>
                      <p className="text-sm font-bold text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.description || p.id}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => deleteProject(p.id)} className="text-destructive hover:text-destructive">
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

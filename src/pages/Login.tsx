import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { lovable } from '@/integrations/lovable/index';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Mail, Lock, User, LogIn, Building2 } from 'lucide-react';

const Login: React.FC = () => {
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [selectedProject, setSelectedProject] = useState('');
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [logoError, setLogoError] = useState(false);

  React.useEffect(() => {
    const fetchProjects = async () => {
      const { data } = await supabase.from('projects').select('id, name').order('name');
      if (data) setProjects(data);
    };
    fetchProjects();
  }, []);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        if (!selectedProject) {
          toast({ title: "Atenção", description: "Selecione o projeto ao qual você pertence.", variant: "destructive" });
          setLoading(false);
          return;
        }
        const { data: signUpData, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, project_id: selectedProject },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        // Auto-assign user to selected project after signup
        if (signUpData?.user) {
          await supabase.from('user_projects').insert({
            user_id: signUpData.user.id,
            project_id: selectedProject,
          });
        }
        toast({
          title: "Cadastro realizado!",
          description: "Verifique seu e-mail para confirmar a conta.",
        });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
    } catch (error: any) {
      const msg = error.message || '';
      let description = "Erro ao autenticar.";
      if (msg.includes('Email not confirmed')) {
        description = "E-mail ainda não confirmado. Verifique sua caixa de entrada (e o spam) e clique no link de confirmação.";
      } else if (msg.includes('Invalid login credentials')) {
        description = "E-mail ou senha incorretos. Verifique e tente novamente.";
      } else if (msg) {
        description = msg;
      }
      toast({
        title: "Erro",
        description,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const { error } = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (error) throw error;
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Erro ao conectar com Google.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <div className="bg-normatel-gradient rounded-2xl p-6 inline-flex flex-col items-center shadow-2xl mb-6">
            {!logoError && (
              <div className="bg-background p-2 rounded-xl mb-3">
                <img
                  src="/imgs/logo.png"
                  className="w-16 h-16 object-contain"
                  alt="Normatel"
                  onError={() => setLogoError(true)}
                />
              </div>
            )}
            <h1 className="text-2xl font-black text-primary-foreground tracking-tighter uppercase italic">
              Normatel
            </h1>
            <p className="text-xs text-primary-foreground/80 font-black uppercase tracking-widest mt-1">
              GFE - Gestão de Frota Especial
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-card border border-border rounded-2xl shadow-xl p-6 space-y-6">
          <h2 className="text-lg font-black text-center uppercase tracking-wider text-foreground">
            {isSignUp ? 'Criar Conta' : 'Entrar'}
          </h2>

          {/* Google Button */}
          <Button
            onClick={handleGoogleLogin}
            disabled={loading}
            variant="outline"
            className="w-full h-12 font-bold text-sm gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Entrar com Google
          </Button>

          <div className="flex items-center gap-3">
            <div className="h-px bg-border flex-1" />
            <span className="text-xs text-muted-foreground font-bold uppercase">ou</span>
            <div className="h-px bg-border flex-1" />
          </div>

          {/* Email Form */}
          <form onSubmit={handleEmailAuth} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-xs font-bold uppercase tracking-wider">Nome Completo</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Seu nome completo"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider">E-mail</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password" className="text-xs font-bold uppercase tracking-wider">Senha</Label>
                {!isSignUp && (
                  <button
                    type="button"
                    onClick={async () => {
                      if (!email) {
                        toast({ title: "Atenção", description: "Preencha o e-mail primeiro.", variant: "destructive" });
                        return;
                      }
                      setLoading(true);
                      try {
                        const { error } = await supabase.auth.resetPasswordForEmail(email, {
                          redirectTo: `${window.location.origin}/reset-password`,
                        });
                        if (error) throw error;
                        toast({ title: "E-mail enviado!", description: "Verifique sua caixa de entrada para redefinir a senha." });
                      } catch (error: any) {
                        toast({ title: "Erro", description: error.message || "Erro ao enviar e-mail.", variant: "destructive" });
                      } finally {
                        setLoading(false);
                      }
                    }}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    Esqueci minha senha
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-10"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-normatel-gradient font-black uppercase tracking-wider text-sm"
            >
              <LogIn className="w-4 h-4 mr-2" />
              {isSignUp ? 'Criar Conta' : 'Entrar'}
            </Button>
          </form>

          <div className="text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              {isSignUp ? 'Já tem conta? ' : 'Não tem conta? '}
              <span className="font-bold text-primary">{isSignUp ? 'Entrar' : 'Criar conta'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

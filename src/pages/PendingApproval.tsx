import React from 'react';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Clock, LogOut } from 'lucide-react';

const PendingApproval: React.FC = () => {
  const { signOut, profile } = useAuth();

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md text-center space-y-6">
        <div className="bg-normatel-gradient rounded-2xl p-6 inline-flex flex-col items-center shadow-2xl">
          <div className="bg-primary-foreground/20 rounded-full p-4 mb-3">
            <Clock className="w-12 h-12 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-black text-primary-foreground uppercase tracking-wider">
            Aguardando Aprovação
          </h1>
        </div>
        
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <p className="text-muted-foreground text-sm">
            Olá <span className="font-bold text-foreground">{profile?.full_name || profile?.email}</span>,
            sua conta foi criada com sucesso!
          </p>
          <p className="text-muted-foreground text-sm">
            Um administrador precisa aprovar seu acesso antes de você poder utilizar o sistema GFE.
          </p>
          <Button
            onClick={signOut}
            variant="outline"
            className="gap-2"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PendingApproval;

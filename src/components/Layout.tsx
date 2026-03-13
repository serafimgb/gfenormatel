import React, { useState } from 'react';
import { InstallAppButton } from './InstallAppButton';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Shield, FileDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
  onDownloadMonthly?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onDownloadMonthly }) => {
  const [logoError, setLogoError] = useState(false);
  const { signOut, isAdmin, profile } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background sm:bg-calendar-grid">
      <header className="bg-normatel-gradient px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 shadow-xl z-20 border-b border-foreground/10">
        <div className="flex items-center space-x-3">
          {!logoError && (
            <div className="bg-background p-1 rounded-lg shadow-sm flex items-center justify-center">
              <img 
                src="/imgs/logo.png" 
                className="w-10 h-10 object-contain" 
                alt="Normatel" 
                onError={() => setLogoError(true)}
              />
            </div>
          )}
          <div className="flex flex-col">
            <h1 className="text-xl font-black text-primary-foreground tracking-tighter leading-none uppercase italic drop-shadow-md">
              Normatel
            </h1>
            <p className="text-[10px] text-primary-foreground font-black uppercase tracking-[0.15em] mt-0.5 leading-none drop-shadow-sm">
              GFE - GESTÃO DE FROTA ESPECIAL
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onDownloadMonthly && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onDownloadMonthly}
              className="text-primary-foreground hover:bg-primary-foreground/10 gap-1 text-xs font-bold"
              title="Download PDFs do mês"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">PDFs do Mês</span>
            </Button>
          )}
          {isAdmin && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/admin')}
              className="text-primary-foreground hover:bg-primary-foreground/10"
              title="Painel Admin"
            >
              <Shield className="w-5 h-5" />
            </Button>
          )}
          <InstallAppButton />
          <div className="hidden sm:flex items-center gap-2 text-primary-foreground/80 text-xs font-bold">
            <span>{profile?.full_name || profile?.email}</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={signOut}
            className="text-primary-foreground hover:bg-primary-foreground/10"
            title="Sair"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>
    </div>
  );
};

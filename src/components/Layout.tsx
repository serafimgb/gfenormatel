import React, { useState } from 'react';
import { InstallAppButton } from './InstallAppButton';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { LogOut, Shield, FileDown, User, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DownloadProgress } from '@/utils/generateMonthlyPdfs';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  manager: 'Gestor',
  user: 'Operador',
  viewer: 'Visualizador',
};

const ROLE_COLORS: Record<string, string> = {
  admin: 'bg-red-500/20 text-red-100 border-red-400/30',
  manager: 'bg-amber-500/20 text-amber-100 border-amber-400/30',
  user: 'bg-emerald-500/20 text-emerald-100 border-emerald-400/30',
  viewer: 'bg-slate-500/20 text-slate-200 border-slate-400/30',
};

interface LayoutProps {
  children: React.ReactNode;
  onDownloadMonthly?: (onProgress: (p: DownloadProgress) => void) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, onDownloadMonthly }) => {
  const [logoError, setLogoError] = useState(false);
  const { signOut, isAdmin, profile, role } = useAuth();
  const navigate = useNavigate();
  const [downloadProgress, setDownloadProgress] = useState<DownloadProgress | null>(null);

  const handleDownload = () => {
    if (!onDownloadMonthly) return;
    onDownloadMonthly((progress) => {
      setDownloadProgress(progress);
      if (progress.status === 'done') {
        setTimeout(() => setDownloadProgress(null), 2000);
      }
    });
  };

  const isDownloading = downloadProgress && downloadProgress.status !== 'done';

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
        
        <div className="flex items-center gap-1.5">
          {/* Download PDFs Button */}
          {onDownloadMonthly && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              disabled={!!isDownloading}
              className="text-primary-foreground/90 hover:bg-primary-foreground/10 hover:text-primary-foreground gap-1.5 text-xs font-bold rounded-lg h-9 px-3 transition-all"
              title="Download PDFs do mês"
            >
              {isDownloading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              <span className="hidden sm:inline">
                {isDownloading
                  ? `${downloadProgress!.current}/${downloadProgress!.total}`
                  : 'PDFs do Mês'}
              </span>
            </Button>
          )}

          {/* Admin Panel */}
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin')}
              className="text-primary-foreground/90 hover:bg-primary-foreground/10 hover:text-primary-foreground gap-1.5 text-xs font-bold rounded-lg h-9 px-3 transition-all"
              title="Painel Admin"
            >
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Admin</span>
            </Button>
          )}

          <InstallAppButton />

          {/* User Profile Chip */}
          <div className="hidden sm:flex items-center gap-2 ml-1 bg-primary-foreground/10 rounded-full pl-1 pr-3 py-1 border border-primary-foreground/15">
            <div className="w-7 h-7 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-primary-foreground" />
            </div>
            <div className="flex flex-col">
              <span className="text-primary-foreground text-[11px] font-bold leading-tight truncate max-w-[120px]">
                {profile?.full_name || profile?.email}
              </span>
              <span className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0 rounded-sm border inline-block w-fit mt-0.5 ${ROLE_COLORS[role] || ROLE_COLORS.user}`}>
                {ROLE_LABELS[role] || role}
              </span>
            </div>
          </div>

          {/* Logout */}
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-primary-foreground/70 hover:bg-red-500/20 hover:text-red-200 gap-1.5 text-xs font-bold rounded-lg h-9 px-3 transition-all"
            title="Sair"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden lg:inline">Sair</span>
          </Button>
        </div>
      </header>

      {/* Download Progress Bar */}
      {downloadProgress && downloadProgress.status !== 'done' && (
        <div className="bg-normatel-dark/90 px-4 py-2 flex items-center gap-3 text-primary-foreground text-xs font-bold">
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between mb-1">
              <span>
                {downloadProgress.status === 'generating'
                  ? `Gerando PDF ${downloadProgress.current} de ${downloadProgress.total}...`
                  : 'Compactando arquivos...'}
              </span>
              <span>{Math.round((downloadProgress.current / downloadProgress.total) * 100)}%</span>
            </div>
            <div className="w-full bg-primary-foreground/20 rounded-full h-1.5">
              <div
                className="bg-primary-foreground h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${(downloadProgress.current / downloadProgress.total) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>
    </div>
  );
};

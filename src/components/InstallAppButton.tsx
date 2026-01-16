import { useState } from 'react';
import { Download, Share, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export function InstallAppButton() {
  const { isInstallable, isInstalled, isIOS, installApp } = usePWAInstall();
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  // Don't show if already installed
  if (isInstalled) return null;

  // Show iOS instructions dialog
  if (isIOS) {
    return (
      <>
        <Button
          onClick={() => setShowIOSInstructions(true)}
          className="gap-2"
          variant="default"
        >
          <Download className="h-4 w-4" />
          Instalar App
        </Button>

        <Dialog open={showIOSInstructions} onOpenChange={setShowIOSInstructions}>
          <DialogContent className="max-w-sm">
            <DialogHeader>
              <DialogTitle>Instalar GFE - NORMATEL</DialogTitle>
              <DialogDescription>
                Siga os passos abaixo para instalar o app no seu iPhone/iPad:
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  1
                </div>
                <div className="flex items-center gap-2">
                  <span>Toque no ícone</span>
                  <Share className="h-5 w-5 text-blue-500" />
                  <span>de compartilhar</span>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  2
                </div>
                <div className="flex items-center gap-2">
                  <span>Role e toque em</span>
                  <span className="inline-flex items-center gap-1 rounded bg-muted px-2 py-1 text-sm">
                    <Plus className="h-4 w-4" />
                    Adicionar à Tela de Início
                  </span>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  3
                </div>
                <span>Toque em "Adicionar" no canto superior direito</span>
              </div>
            </div>

            <Button onClick={() => setShowIOSInstructions(false)} className="w-full">
              Entendi
            </Button>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Show install button for Android/Chrome
  if (isInstallable) {
    return (
      <Button onClick={installApp} className="gap-2" variant="default">
        <Download className="h-4 w-4" />
        Instalar App
      </Button>
    );
  }

  // Not installable (maybe already in browser that doesn't support PWA)
  return null;
}

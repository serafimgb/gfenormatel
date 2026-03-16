import { useEffect, useState } from 'react';
// @ts-ignore - virtual module from vite-plugin-pwa
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';

export function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(swUrl, registration) {
      // Check for updates every 60 seconds
      if (registration) {
        setInterval(() => {
          registration.update();
        }, 60 * 1000);
      }
    },
    onRegisterError(error) {
      console.error('SW registration error', error);
    },
  });

  useEffect(() => {
    if (needRefresh) {
      setShowPrompt(true);
    }
  }, [needRefresh]);

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 z-[100] flex justify-center">
      <div className="bg-card border border-border rounded-xl shadow-2xl p-4 flex items-center gap-3 max-w-md w-full">
        <RefreshCw className="w-5 h-5 text-primary shrink-0" />
        <p className="text-sm text-foreground flex-1">
          Nova versão disponível!
        </p>
        <Button
          size="sm"
          onClick={() => updateServiceWorker(true)}
          className="shrink-0"
        >
          Atualizar
        </Button>
      </div>
    </div>
  );
}

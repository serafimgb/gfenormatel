import React, { useState } from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [logoError, setLogoError] = useState(false);

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
        
        <div className="flex items-center">
          {/* Header clean */}
        </div>
      </header>
      <main className="flex-1 overflow-hidden relative">
        {children}
      </main>
    </div>
  );
};

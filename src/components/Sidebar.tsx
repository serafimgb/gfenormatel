import React from 'react';
import { BookingEvent, EquipmentType } from '../types';
import { MapPin, Clock, Info, X, Ban, AlertTriangle, Truck } from 'lucide-react';
import { Button } from './ui/button';
import { InstallAppButton } from './InstallAppButton';

interface SidebarProps {
  selectedEvent: BookingEvent | null;
  onClose: () => void;
  aiInsights: string;
  loadingInsights: boolean;
  onCancelClick?: () => void;
  equipmentTypes?: EquipmentType[];
}

export const Sidebar: React.FC<SidebarProps> = ({ selectedEvent, onClose, aiInsights, loadingInsights, onCancelClick, equipmentTypes = [] }) => {
  const getEquipmentName = (equipmentTypeId: string) => {
    const equipment = equipmentTypes.find(eq => eq.id === equipmentTypeId);
    return equipment?.name || equipmentTypeId;
  };

  const getEquipmentColor = (equipmentTypeId: string) => {
    const equipment = equipmentTypes.find(eq => eq.id === equipmentTypeId);
    return equipment?.color || '#6b7280';
  };

  return (
    <div className={`fixed inset-y-0 right-0 w-80 bg-card border-l border-border shadow-2xl transition-transform duration-300 z-30 flex flex-col lg:relative lg:translate-x-0 ${
      selectedEvent ? 'translate-x-0' : 'translate-x-full'
    }`}>
      <div className="p-4 border-b border-border flex justify-between items-center bg-muted shrink-0">
        <h2 className="font-black text-[10px] uppercase tracking-widest text-normatel-dark">
          DETALHES DA RESERVA
        </h2>
        <button 
          onClick={onClose} 
          className="p-1.5 hover:bg-secondary rounded-full transition-colors text-foreground"
        >
          <X className="w-5 h-5" strokeWidth={2.5} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-card no-scrollbar">
        {selectedEvent ? (
          <div className="space-y-5 animate-slide-in-from-right">
            {selectedEvent.isCancelled && (
              <div className="bg-destructive/10 border-2 border-destructive/30 p-4 rounded-xl">
                <div className="flex items-center gap-2 text-destructive font-black text-xs uppercase mb-2">
                  <AlertTriangle className="w-4 h-4" />
                  Agendamento Cancelado
                </div>
                <p className="text-xs text-foreground/80 font-medium">
                  <span className="font-black">Motivo:</span> {selectedEvent.cancellationReason}
                </p>
                {selectedEvent.cancelledAt && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Cancelado em: {selectedEvent.cancelledAt.toLocaleDateString('pt-BR')} às {selectedEvent.cancelledAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                )}
              </div>
            )}

            {/* Equipment Type Badge */}
            <div 
              className="flex items-center gap-2 p-3 rounded-xl border-2"
              style={{ 
                backgroundColor: `${getEquipmentColor(selectedEvent.equipmentType)}20`,
                borderColor: `${getEquipmentColor(selectedEvent.equipmentType)}40`
              }}
            >
              <Truck className="w-5 h-5" style={{ color: getEquipmentColor(selectedEvent.equipmentType) }} />
              <span className="font-black text-sm" style={{ color: getEquipmentColor(selectedEvent.equipmentType) }}>
                {getEquipmentName(selectedEvent.equipmentType)}
              </span>
            </div>

            <div className="pb-3 border-b border-border">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-1 block">
                Responsável
              </label>
              <div className={`text-xl font-black leading-tight ${selectedEvent.isCancelled ? 'text-muted-foreground line-through' : 'text-normatel-dark'}`}>
                {selectedEvent.solicitante}
              </div>
            </div>
             
            <div className="space-y-4">
              <div className="bg-card p-4 rounded-xl border-2 border-normatel-light/20 shadow-sm">
                <div className="flex items-start space-x-3">
                  <div className="mt-1 text-normatel-dark">
                    <MapPin className="w-4 h-4" strokeWidth={2.5} />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-normatel-dark uppercase mb-1 block">
                      Unidade / Setor
                    </label>
                    <div className="text-sm font-black text-foreground leading-snug">
                      {selectedEvent.local}
                    </div>
                    <div className="text-[11px] text-normatel-dark font-black mt-1 bg-normatel-light/10 px-2 py-0.5 rounded inline-block border border-normatel-light/20">
                      {selectedEvent.carteira}
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-xl border border-border">
                <label className="text-[9px] font-black text-muted-foreground uppercase mb-2 block">
                  Motivo do Agendamento
                </label>
                <div className="text-xs font-bold text-foreground leading-relaxed italic">
                  "{selectedEvent.servicoTipo}"
                </div>
              </div>

              <div className="bg-card p-3 rounded-xl border-2 border-border shadow-sm flex items-center justify-between">
                <label className="text-[9px] font-black text-muted-foreground uppercase block">
                  Tempo de Uso
                </label>
                <div className="text-lg font-black text-normatel-dark">
                  {selectedEvent.tempoServicoHoras} Horas
                </div>
              </div>
            </div>

            <div className="pt-1">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-wider block">
                Cronograma
              </label>
              <div className="flex items-center text-base font-black text-normatel-dark mt-2 bg-normatel-light/5 p-3 rounded-xl border border-normatel-light/20">
                <Clock className="w-4 h-4 mr-2.5 text-normatel-light" strokeWidth={2.5} />
                {selectedEvent.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} — {selectedEvent.end.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </div>
            </div>

            {!selectedEvent.isCancelled && onCancelClick && (
              <div className="pt-4">
                <Button 
                  variant="outline"
                  onClick={onCancelClick}
                  className="w-full border-destructive/50 text-destructive hover:bg-destructive/10 font-black uppercase tracking-tighter text-xs"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Cancelar Agendamento
                </Button>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-20 px-8">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-5 border border-border shadow-inner">
              <Info className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-[11px] font-black text-muted-foreground uppercase tracking-widest leading-relaxed">
              Selecione uma reserva para visualizar os dados técnicos.
            </p>
          </div>
        )}

        <div className="pt-8 mt-4 border-t border-border pb-10">
          <div className="flex items-center mb-4 space-x-2">
            <div className="w-2 h-2 rounded-full bg-normatel-light animate-pulse-dot" />
            <h3 className="text-[10px] font-black text-normatel-dark uppercase tracking-[0.2em]">
              NORA HUB
            </h3>
          </div>
          <div className={`p-4 rounded-2xl bg-foreground text-background text-[12px] font-medium leading-relaxed shadow-xl relative border border-background/10 whitespace-pre-wrap ${
            loadingInsights ? 'animate-pulse opacity-80' : ''
          }`}>
            {loadingInsights ? 'Processando dados...' : aiInsights}
          </div>
        </div>

        {/* Install App Button */}
        <div className="pt-4 border-t border-border">
          <div className="text-center">
            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-wider mb-3">
              Instale o aplicativo
            </p>
            <InstallAppButton />
          </div>
        </div>
      </div>
    </div>
  );
};

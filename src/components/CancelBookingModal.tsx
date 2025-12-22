import React, { useState } from 'react';
import { BookingEvent } from '../types';
import { AlertTriangle, X } from 'lucide-react';
import { Button } from './ui/button';

interface CancelBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  event: BookingEvent;
}

export const CancelBookingModal: React.FC<CancelBookingModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  event 
}) => {
  const [reason, setReason] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim()) {
      onConfirm(reason.trim());
    }
  };

  return (
    <div className="fixed inset-0 bg-foreground/60 z-[100] flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-zoom-in border-2 border-destructive/50">
        <div className="px-6 py-4 bg-destructive text-destructive-foreground flex justify-between items-center">
          <h3 className="font-bold flex items-center uppercase tracking-tighter text-sm">
            <AlertTriangle className="w-5 h-5 mr-2" strokeWidth={2.5} />
            Cancelar Agendamento
          </h3>
          <button 
            onClick={onClose} 
            className="hover:rotate-90 transition-transform duration-200 font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 bg-card">
          <div className="bg-muted p-4 rounded-lg border border-border">
            <p className="text-sm font-bold text-foreground">
              Você está prestes a cancelar o agendamento de:
            </p>
            <p className="text-lg font-black text-normatel-dark mt-1">
              {event.solicitante}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {event.start.toLocaleDateString('pt-BR')} às {event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </p>
          </div>

          <div>
            <label className="block text-[10px] font-black text-normatel-dark uppercase mb-1 tracking-wider">
              Motivo do Cancelamento *
            </label>
            <textarea 
              required 
              rows={3} 
              className="w-full border-destructive/30 border-2 rounded-lg px-3 py-2 text-sm focus:border-destructive outline-none bg-card font-bold text-foreground resize-none" 
              value={reason} 
              onChange={e => setReason(e.target.value)} 
              placeholder="Descreva o motivo do cancelamento..." 
            />
          </div>

          <div className="pt-4 flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 font-black uppercase tracking-tighter"
            >
              Voltar
            </Button>
            <Button 
              type="submit" 
              variant="destructive"
              className="flex-1 font-black uppercase tracking-tighter"
              disabled={!reason.trim()}
            >
              Confirmar Cancelamento
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

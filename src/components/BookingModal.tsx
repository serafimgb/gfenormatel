import React, { useState } from 'react';
import { BookingEvent, PEMT } from '../types';
import { CARTEIRA_OPTIONS } from '../constants';
import { Calendar, X } from 'lucide-react';
import { Button } from './ui/button';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: BookingEvent) => void;
  selectedPemt: PEMT;
  initialDate: Date;
}

export const BookingModal: React.FC<BookingModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  selectedPemt, 
  initialDate 
}) => {
  const getLocalDateString = (date: Date) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState({
    solicitante: '',
    carteira: CARTEIRA_OPTIONS[0],
    local: '',
    motivo: '',
    data: getLocalDateString(initialDate),
    horaInicio: '08:00',
    tempoServicoHoras: '1'
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const [year, month, day] = formData.data.split('-').map(Number);
    const [hours, minutes] = formData.horaInicio.split(':').map(Number);
    
    const start = new Date(year, month - 1, day, hours, minutes, 0, 0);
    const end = new Date(start);
    end.setMinutes(start.getMinutes() + (Number(formData.tempoServicoHoras) * 60));

    const newEvent: BookingEvent = {
      id: Math.random().toString(36).substr(2, 9),
      pemtId: selectedPemt.id,
      solicitante: formData.solicitante,
      carteira: formData.carteira,
      local: formData.local,
      servicoTipo: formData.motivo,
      start,
      end,
      tempoServicoHoras: Number(formData.tempoServicoHoras)
    };

    onSave(newEvent);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-foreground/60 z-[100] flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-zoom-in border-2 border-normatel-light">
        <div className="px-6 py-4 bg-normatel-gradient text-primary-foreground flex justify-between items-center">
          <h3 className="font-bold flex items-center uppercase tracking-tighter text-sm">
            <Calendar className="w-5 h-5 mr-2" strokeWidth={2.5} />
            Agendar {selectedPemt.name}
          </h3>
          <button 
            onClick={onClose} 
            className="hover:rotate-90 transition-transform duration-200 font-bold"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto bg-card">
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-black text-normatel-dark uppercase mb-1 tracking-wider">
                Data do Agendamento
              </label>
              <input 
                type="date" 
                required 
                className="w-full border-normatel-light/30 border-2 rounded-lg px-3 py-2 text-sm focus:border-normatel-light outline-none bg-card font-bold text-foreground shadow-sm" 
                value={formData.data} 
                onChange={e => setFormData(prev => ({ ...prev, data: e.target.value }))} 
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-normatel-dark uppercase mb-1 tracking-wider">
                Solicitante
              </label>
              <input 
                required 
                className="w-full border-normatel-light/30 border-2 rounded-lg px-3 py-2 text-sm focus:border-normatel-light outline-none bg-card font-bold text-foreground" 
                value={formData.solicitante} 
                onChange={e => setFormData(prev => ({ ...prev, solicitante: e.target.value }))} 
                placeholder="Nome do Responsável" 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-normatel-dark uppercase mb-1 tracking-wider">
                  Carteira
                </label>
                <select 
                  className="w-full border-normatel-light/30 border-2 rounded-lg px-3 py-2 text-sm focus:border-normatel-light outline-none bg-card font-bold text-foreground cursor-pointer" 
                  value={formData.carteira} 
                  onChange={e => setFormData(prev => ({ ...prev, carteira: e.target.value }))}
                >
                  {CARTEIRA_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-normatel-dark uppercase mb-1 tracking-wider">
                  Unidade / Setor
                </label>
                <input 
                  required 
                  className="w-full border-normatel-light/30 border-2 rounded-lg px-3 py-2 text-sm focus:border-normatel-light outline-none bg-card font-bold text-foreground" 
                  value={formData.local} 
                  onChange={e => setFormData(prev => ({ ...prev, local: e.target.value }))} 
                  placeholder="Ex: Galpão A" 
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-normatel-dark uppercase mb-1 tracking-wider">
                Motivo do Agendamento
              </label>
              <textarea 
                required 
                rows={3} 
                className="w-full border-normatel-light/30 border-2 rounded-lg px-3 py-2 text-sm focus:border-normatel-light outline-none bg-card font-bold text-foreground resize-none" 
                value={formData.motivo} 
                onChange={e => setFormData(prev => ({ ...prev, motivo: e.target.value }))} 
                placeholder="Descreva a atividade..." 
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-normatel-dark uppercase mb-1 tracking-wider">
                  Horário Início
                </label>
                <input 
                  type="time" 
                  required 
                  className="w-full border-normatel-light/30 border-2 rounded-lg px-3 py-2 text-sm focus:border-normatel-light outline-none bg-card font-bold text-foreground cursor-pointer" 
                  value={formData.horaInicio} 
                  onChange={e => setFormData(prev => ({ ...prev, horaInicio: e.target.value }))} 
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-normatel-dark uppercase mb-1 tracking-wider">
                  Tempo de Serviço (Horas)
                </label>
                <input 
                  type="number" 
                  step="0.5" 
                  required 
                  min="0.5" 
                  className="w-full border-normatel-light/30 border-2 rounded-lg px-3 py-2 text-sm focus:border-normatel-light outline-none bg-card font-bold text-foreground" 
                  value={formData.tempoServicoHoras} 
                  onChange={e => setFormData(prev => ({ ...prev, tempoServicoHoras: e.target.value }))} 
                />
              </div>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 font-black uppercase tracking-tighter"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1 bg-normatel-gradient font-black uppercase tracking-tighter hover:brightness-110"
            >
              Agendar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useState } from 'react';
import { BookingEvent, EquipmentType } from '../types';
import { CARTEIRA_OPTIONS } from '../constants';
import { Pencil, X, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';

interface EditBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (updates: Partial<BookingEvent>, previousValues: Record<string, any>) => void;
  event: BookingEvent;
  equipmentTypes: EquipmentType[];
}

export const EditBookingModal: React.FC<EditBookingModalProps> = ({
  isOpen,
  onClose,
  onSave,
  event,
  equipmentTypes,
}) => {
  const getLocalDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTimeString = (date: Date) => {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const [formData, setFormData] = useState({
    equipmentType: event.equipmentType,
    solicitante: event.solicitante,
    carteira: event.carteira,
    local: event.local,
    motivo: event.servicoTipo,
    numeroOm: event.numeroOm || '',
    data: getLocalDateString(event.start),
    horaInicio: getTimeString(event.start),
    tempoServicoHoras: String(event.tempoServicoHoras),
  });

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const [year, month, day] = formData.data.split('-').map(Number);
    const [hours, minutes] = formData.horaInicio.split(':').map(Number);
    const start = new Date(year, month - 1, day, hours, minutes, 0, 0);
    const end = new Date(start);
    end.setMinutes(start.getMinutes() + Number(formData.tempoServicoHoras) * 60);

    const updates: Partial<BookingEvent> = {};
    const previousValues: Record<string, any> = {};

    if (formData.equipmentType !== event.equipmentType) {
      updates.equipmentType = formData.equipmentType;
      previousValues.equipment_type = event.equipmentType;
    }
    if (formData.solicitante !== event.solicitante) {
      updates.solicitante = formData.solicitante;
      previousValues.solicitante = event.solicitante;
    }
    if (formData.carteira !== event.carteira) {
      updates.carteira = formData.carteira;
      previousValues.carteira = event.carteira;
    }
    if (formData.local !== event.local) {
      updates.local = formData.local;
      previousValues.local = event.local;
    }
    if (formData.motivo !== event.servicoTipo) {
      updates.servicoTipo = formData.motivo;
      previousValues.servico_tipo = event.servicoTipo;
    }
    if (formData.numeroOm !== (event.numeroOm || '')) {
      updates.numeroOm = formData.numeroOm;
      previousValues.numero_om = event.numeroOm;
    }
    if (start.getTime() !== event.start.getTime()) {
      updates.start = start;
      previousValues.start_time = event.start.toISOString();
    }
    if (end.getTime() !== event.end.getTime()) {
      updates.end = end;
      previousValues.end_time = event.end.toISOString();
    }
    if (Number(formData.tempoServicoHoras) !== event.tempoServicoHoras) {
      updates.tempoServicoHoras = Number(formData.tempoServicoHoras);
      previousValues.tempo_servico_horas = event.tempoServicoHoras;
    }

    if (Object.keys(updates).length === 0) {
      onClose();
      return;
    }

    onSave(updates, previousValues);
    onClose();
  };

  const selectedEquipment = equipmentTypes.find(eq => eq.id === formData.equipmentType);

  return (
    <div className="fixed inset-0 bg-foreground/60 z-[100] flex items-center justify-center p-2 sm:p-4 backdrop-blur-sm">
      <div className="bg-card rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-zoom-in border-2 border-normatel-light">
        <div className="px-6 py-4 bg-normatel-gradient text-primary-foreground flex justify-between items-center">
          <h3 className="font-bold flex items-center uppercase tracking-tighter text-sm">
            <Pencil className="w-5 h-5 mr-2" strokeWidth={2.5} />
            Editar Agendamento
          </h3>
          <button onClick={onClose} className="hover:rotate-90 transition-transform duration-200 font-bold">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[85vh] overflow-y-auto bg-card">
          <div className="space-y-3">
            <div>
              <label className="block text-[10px] font-black text-normatel-dark uppercase mb-1 tracking-wider">
                Tipo de Equipamento
              </label>
              <div className="relative">
                <select
                  className="appearance-none w-full border-normatel-light/30 border-2 rounded-lg px-3 pr-10 py-2 text-sm focus:border-normatel-light outline-none bg-card font-bold text-foreground cursor-pointer"
                  value={formData.equipmentType}
                  onChange={e => setFormData(prev => ({ ...prev, equipmentType: e.target.value }))}
                >
                  {equipmentTypes.map(eq => (
                    <option key={eq.id} value={eq.id}>{eq.name}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-normatel-dark pointer-events-none" strokeWidth={3} />
              </div>
              {selectedEquipment && (
                <div className="mt-2 h-1 rounded-full" style={{ backgroundColor: selectedEquipment.color }} />
              )}
            </div>

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

            <div>
              <label className="block text-[10px] font-black text-normatel-dark uppercase mb-1 tracking-wider">
                Número de OM
              </label>
              <input
                required
                className="w-full border-normatel-light/30 border-2 rounded-lg px-3 py-2 text-sm focus:border-normatel-light outline-none bg-card font-bold text-foreground"
                value={formData.numeroOm}
                onChange={e => setFormData(prev => ({ ...prev, numeroOm: e.target.value }))}
                placeholder="Ex: OM-2024-001"
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
            <Button type="button" variant="outline" onClick={onClose} className="flex-1 font-black uppercase tracking-tighter">
              Cancelar
            </Button>
            <Button type="submit" className="flex-1 bg-normatel-gradient font-black uppercase tracking-tighter hover:brightness-110">
              Salvar Alterações
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

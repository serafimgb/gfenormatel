export interface PEMT {
  id: string;
  name: string;
  color: string;
  mailbox: string;
}

export interface EquipmentType {
  id: string;
  name: string;
  color: string;
  icon?: string;
}

export interface Project {
  id: string;
  name: string;
  description?: string;
}

export interface BookingEvent {
  id: string;
  pemtId: string;
  equipmentType: string;
  projectId: string;
  solicitante: string;
  carteira: string;
  local: string;
  servicoTipo: string;
  start: Date;
  end: Date;
  tempoServicoHoras: number;
  descricao?: string;
  isCancelled?: boolean;
  cancelledAt?: Date;
  cancellationReason?: string;
}

export interface Filters {
  carteira: string;
  equipmentType: string;
}

export enum ViewType {
  Week = 'WEEK',
  Month = 'MONTH'
}

// Database type for Supabase
export interface BookingEventDB {
  id: string;
  pemt_id: string;
  equipment_type: string;
  project_id: string;
  solicitante: string;
  carteira: string;
  local: string;
  servico_tipo: string;
  start_time: string;
  end_time: string;
  tempo_servico_horas: number;
  descricao?: string;
  created_at?: string;
}

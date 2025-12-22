export interface PEMT {
  id: string;
  name: string;
  color: string;
  mailbox: string;
}

export interface BookingEvent {
  id: string;
  pemtId: string;
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
}

export enum ViewType {
  Week = 'WEEK',
  Month = 'MONTH'
}

// Database type for Supabase
export interface BookingEventDB {
  id: string;
  pemt_id: string;
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

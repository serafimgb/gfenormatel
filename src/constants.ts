import { PEMT } from './types';

export const PEMT_LIST: PEMT[] = [
  { id: 'P1', name: 'PEMT 16 metros', color: '#57B952', mailbox: 'p1@normatel.com.br' },
  { id: 'P2', name: 'PEMT 28 metros', color: '#4F8C0D', mailbox: 'p2@normatel.com.br' },
];

export const CARTEIRA_OPTIONS = [
  'Civil', 
  'Elétrica', 
  'Mecânica', 
  'Áreas Verdes', 
  'Conservação e Limpeza', 
  'Automação'
];

export const SERVICE_COLORS: Record<string, string> = {
  'Civil': 'service-civil',
  'Elétrica': 'service-eletrica',
  'Mecânica': 'service-mecanica',
  'DEFAULT': 'service-default'
};

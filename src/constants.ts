import { PEMT, EquipmentType, Project } from './types';

// Legacy PEMT list - will be replaced by equipment types from database
export const PEMT_LIST: PEMT[] = [
  { id: 'P1', name: 'PEMT 16 metros', color: '#57B952', mailbox: 'p1@normatel.com.br' },
  { id: 'P2', name: 'PEMT 28 metros', color: '#4F8C0D', mailbox: 'p2@normatel.com.br' },
];

// Default equipment types - will be fetched from database
export const DEFAULT_EQUIPMENT_TYPES: EquipmentType[] = [
  { id: 'PEMT', name: 'PEMT 16 metros', color: '#57B952', icon: 'crane' },
  { id: 'PEMT_28M', name: 'PEMT 28 metros', color: '#4F8C0D', icon: 'crane' },
  { id: 'RETROESCAVADEIRA', name: 'Retroescavadeira', color: '#E67E22', icon: 'construction' },
  { id: 'CAMINHAO_COMPACTADOR', name: 'Caminhão Compactador', color: '#9B59B6', icon: 'truck' },
  { id: 'TRATOR', name: 'Trator', color: '#3498DB', icon: 'tractor' },
  { id: 'CAMINHAO_MUNCK', name: 'Caminhão Munck', color: '#E74C3C', icon: 'truck' },
  { id: 'CAMINHAO_CESTO', name: 'Caminhão Cesto', color: '#1ABC9C', icon: 'truck' },
  { id: 'BONGO', name: 'Bongo', color: '#F39C12', icon: 'truck' },
  { id: 'TRATOR_ARTICULADO', name: 'Trator Articulado', color: '#8E44AD', icon: 'tractor' },
  { id: 'TRATOR_ARRASTO', name: 'Trator de Arrasto', color: '#2980B9', icon: 'tractor' },
];

// Default projects - will be fetched from database
export const DEFAULT_PROJECTS: Project[] = [
  { id: '743', name: 'Projeto 743', description: 'Projeto 743' },
  { id: '741', name: 'Projeto 741', description: 'Projeto 741' },
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

// Equipment type colors for calendar display
export const EQUIPMENT_COLORS: Record<string, string> = {
  'PEMT': 'bg-green-500/20 border-l-green-500 text-green-900 dark:text-green-100',
  'PEMT_28M': 'bg-emerald-600/20 border-l-emerald-600 text-emerald-900 dark:text-emerald-100',
  'RETROESCAVADEIRA': 'bg-orange-500/20 border-l-orange-500 text-orange-900 dark:text-orange-100',
  'CAMINHAO_COMPACTADOR': 'bg-purple-500/20 border-l-purple-500 text-purple-900 dark:text-purple-100',
  'TRATOR': 'bg-blue-500/20 border-l-blue-500 text-blue-900 dark:text-blue-100',
  'CAMINHAO_MUNCK': 'bg-red-500/20 border-l-red-500 text-red-900 dark:text-red-100',
  'CAMINHAO_CESTO': 'bg-teal-500/20 border-l-teal-500 text-teal-900 dark:text-teal-100',
  'BONGO': 'bg-amber-500/20 border-l-amber-500 text-amber-900 dark:text-amber-100',
  'TRATOR_ARTICULADO': 'bg-violet-500/20 border-l-violet-500 text-violet-900 dark:text-violet-100',
  'TRATOR_ARRASTO': 'bg-sky-500/20 border-l-sky-500 text-sky-900 dark:text-sky-100',
  'DEFAULT': 'bg-muted border-l-muted-foreground text-foreground',
};

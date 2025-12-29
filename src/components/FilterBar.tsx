import React from 'react';
import { Filters, ViewType, EquipmentType } from '../types';
import { CARTEIRA_OPTIONS } from '../constants';
import { ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';

interface FilterBarProps {
  filters: Filters;
  setFilters: (f: Filters) => void;
  viewType: ViewType;
  setViewType: (v: ViewType) => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  currentLabel: string;
  equipmentTypes?: EquipmentType[];
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filters,
  setFilters,
  viewType,
  setViewType,
  onPrev,
  onNext,
  onToday,
  currentLabel,
  equipmentTypes = []
}) => {
  return (
    <div className="bg-card border-b border-border p-4 flex flex-wrap items-center gap-4 shadow-sm relative z-10">
      {/* Navigation */}
      <div className="flex items-center space-x-2 mr-4">
        <Button 
          variant="outline" 
          onClick={onToday}
          className="px-4 py-2 text-sm font-black uppercase tracking-tighter"
        >
          Hoje
        </Button>
        <div className="flex items-center bg-muted p-1 rounded-lg border border-border">
          <button 
            onClick={onPrev} 
            className="p-2 hover:bg-card rounded-md transition-all text-foreground"
          >
            <ChevronLeft className="w-5 h-5" strokeWidth={3.5} />
          </button>
          <button 
            onClick={onNext} 
            className="p-2 hover:bg-card rounded-md transition-all text-foreground"
          >
            <ChevronRight className="w-5 h-5" strokeWidth={3.5} />
          </button>
        </div>
        <span className="ml-4 font-black text-foreground text-sm uppercase tracking-tighter border-l-2 border-normatel-light pl-4 capitalize">
          {currentLabel}
        </span>
      </div>

      {/* View Switcher */}
      <div className="flex bg-muted p-1 rounded-xl border border-border mr-4">
        <button 
          onClick={() => setViewType(ViewType.Week)}
          className={`px-4 py-1.5 text-xs font-black uppercase rounded-lg transition-all ${
            viewType === ViewType.Week 
              ? 'bg-card text-normatel-dark shadow-md' 
              : 'text-muted-foreground'
          }`}
        >
          Semana
        </button>
        <button 
          onClick={() => setViewType(ViewType.Month)}
          className={`px-4 py-1.5 text-xs font-black uppercase rounded-lg transition-all ${
            viewType === ViewType.Month 
              ? 'bg-card text-normatel-dark shadow-md' 
              : 'text-muted-foreground'
          }`}
        >
          Mês
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-1 items-center gap-3 flex-wrap">
        {/* Filter by Carteira */}
        <div className="relative min-w-[200px]">
          <select 
            className="appearance-none border-2 border-normatel-light/20 rounded-xl px-5 pr-10 py-2 text-sm font-black text-foreground bg-card hover:border-normatel-light focus:border-normatel-light outline-none transition-all shadow-sm cursor-pointer w-full"
            value={filters.carteira}
            onChange={(e) => setFilters({...filters, carteira: e.target.value})}
          >
            <option value="" className="text-muted-foreground font-black">Todas Carteiras</option>
            {CARTEIRA_OPTIONS.map(opt => (
              <option key={opt} value={opt} className="text-foreground font-bold">{opt}</option>
            ))}
          </select>
          <div className="absolute right-3 top-2.5 pointer-events-none text-normatel-dark">
            <ChevronDown className="w-4 h-4" strokeWidth={4} />
          </div>
        </div>

        {/* Filter by Equipment Type */}
        <div className="relative min-w-[200px]">
          <select 
            className="appearance-none border-2 border-normatel-light/20 rounded-xl px-5 pr-10 py-2 text-sm font-black text-foreground bg-card hover:border-normatel-light focus:border-normatel-light outline-none transition-all shadow-sm cursor-pointer w-full"
            value={filters.equipmentType}
            onChange={(e) => setFilters({...filters, equipmentType: e.target.value})}
          >
            <option value="" className="text-muted-foreground font-black">Todos Equipamentos</option>
            {equipmentTypes.map(eq => (
              <option key={eq.id} value={eq.id} className="text-foreground font-bold">{eq.name}</option>
            ))}
          </select>
          <div className="absolute right-3 top-2.5 pointer-events-none text-normatel-dark">
            <ChevronDown className="w-4 h-4" strokeWidth={4} />
          </div>
        </div>
      </div>
    </div>
  );
};

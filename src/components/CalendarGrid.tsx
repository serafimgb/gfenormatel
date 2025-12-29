import React from 'react';
import { BookingEvent, ViewType, EquipmentType } from '../types';
import { EQUIPMENT_COLORS } from '../constants';

interface CalendarGridProps {
  events: BookingEvent[];
  startDate: Date;
  onEventClick: (e: BookingEvent) => void;
  viewType: ViewType;
  equipmentTypes?: EquipmentType[];
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({ events, startDate, onEventClick, viewType, equipmentTypes = [] }) => {
  const getEquipmentColor = (equipmentType: string) => {
    return EQUIPMENT_COLORS[equipmentType] || EQUIPMENT_COLORS.DEFAULT;
  };

  if (viewType === ViewType.Month) {
    const startOfMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
    const lastDayOfMonth = new Date(startDate.getFullYear(), startDate.getMonth() + 1, 0).getDate();
    const startDayOfWeek = startOfMonth.getDay();
    
    const daysInGrid: (Date | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      daysInGrid.push(null);
    }
    for (let i = 1; i <= lastDayOfMonth; i++) {
      daysInGrid.push(new Date(startDate.getFullYear(), startDate.getMonth(), i));
    }

    return (
      <div className="flex flex-col h-full bg-card overflow-hidden">
        <div className="grid grid-cols-7 border-b border-calendar-border bg-muted shrink-0">
          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
            <div key={d} className="py-2 text-center text-[10px] font-black text-muted-foreground uppercase border-r border-calendar-border last:border-r-0">
              {d}
            </div>
          ))}
        </div>
        <div className="flex-1 grid grid-cols-7 grid-rows-5 overflow-y-auto no-scrollbar">
          {daysInGrid.map((day, idx) => (
            <div 
              key={idx} 
              className={`min-h-[120px] border-b border-r border-calendar-border p-1 ${
                !day ? 'bg-muted/50' : 'bg-card'
              }`}
            >
              {day && (
                <>
                  <div className={`text-[11px] font-black mb-1 ${
                    day.toDateString() === new Date().toDateString() 
                      ? 'text-normatel-light bg-normatel-light/10 w-6 h-6 flex items-center justify-center rounded-full mx-auto' 
                      : 'text-muted-foreground text-center'
                  }`}>
                    {day.getDate()}
                  </div>
                  <div className="space-y-1">
                    {events
                      .filter(e => e.start.toDateString() === day.toDateString())
                      .slice(0, 3)
                      .map(event => (
                        <div 
                          key={event.id}
                          onClick={() => onEventClick(event)}
                          className={`text-[9px] font-black p-1 rounded truncate cursor-pointer border-l-2 shadow-sm ${
                            event.isCancelled 
                              ? 'bg-muted text-muted-foreground line-through opacity-60 border-l-destructive/50' 
                              : getEquipmentColor(event.equipmentType)
                          }`}
                        >
                          {event.isCancelled && <span className="text-destructive mr-1">✕</span>}
                          {event.solicitante}
                        </div>
                      ))}
                    {events.filter(e => e.start.toDateString() === day.toDateString()).length > 3 && (
                      <div className="text-[8px] font-black text-normatel-dark text-center">
                        +{events.filter(e => e.start.toDateString() === day.toDateString()).length - 3} mais
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Week View
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startDate);
    d.setDate(startDate.getDate() + i);
    return d;
  });

  const hours = Array.from({ length: 11 }, (_, i) => i + 8);

  return (
    <div className="flex flex-col h-full bg-card overflow-hidden">
      <div className="flex border-b border-calendar-border shrink-0 bg-muted">
        <div className="w-16 border-r border-calendar-border" />
        {days.map((day, idx) => (
          <div key={idx} className="flex-1 py-3 text-center border-r border-calendar-border last:border-r-0">
            <div className="text-[10px] font-black text-muted-foreground uppercase">
              {day.toLocaleDateString('pt-BR', { weekday: 'short' })}
            </div>
            <div className={`text-xl font-black mt-1 ${
              day.toDateString() === new Date().toDateString() 
                ? 'text-normatel-dark' 
                : 'text-foreground'
            }`}>
              {day.getDate()}
            </div>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto relative no-scrollbar">
        <div className="flex min-w-full">
          <div className="w-16 flex flex-col shrink-0">
            {hours.map(h => (
              <div 
                key={h} 
                className="h-20 border-b border-r border-calendar-grid text-[11px] font-black text-muted-foreground pr-2 pt-1 text-right bg-card z-10 box-border leading-none"
              >
                {h}:00
              </div>
            ))}
          </div>

          <div className="flex-1 flex relative">
            {days.map((day, dIdx) => (
              <div 
                key={dIdx} 
                className="flex-1 border-r border-calendar-border last:border-r-0 relative min-h-[880px] box-border"
              >
                {hours.map(h => (
                  <div key={h} className="h-20 border-b border-calendar-grid box-border" />
                ))}

                {events
                  .filter(e => e.start.toDateString() === day.toDateString())
                  .map(event => {
                    const startHour = event.start.getHours();
                    const startMin = event.start.getMinutes();
                    const top = ((startHour - 8) * 80) + (startMin * 80 / 60);
                    const durationMinutes = (event.end.getTime() - event.start.getTime()) / (1000 * 60);
                    const height = (durationMinutes * 80 / 60);
                    const colorClass = getEquipmentColor(event.equipmentType);

                    const isCancelled = event.isCancelled;

                    return (
                      <div
                        key={event.id}
                        onClick={() => onEventClick(event)}
                        style={{ top: `${top}px`, height: `${Math.max(height, 20)}px` }}
                        className={`absolute left-0.5 right-0.5 p-1.5 border-l-4 rounded shadow-sm text-[10px] cursor-pointer hover:brightness-95 transition-all overflow-hidden z-20 ${
                          isCancelled 
                            ? 'bg-muted border-l-destructive/50 opacity-60' 
                            : colorClass
                        } border-opacity-50 flex flex-col min-h-[20px]`}
                      >
                        <div className={`font-black truncate uppercase tracking-tighter leading-tight mb-0.5 ${isCancelled ? 'line-through text-muted-foreground' : ''}`}>
                          {isCancelled && <span className="text-destructive mr-1">✕</span>}
                          {event.solicitante}
                        </div>
                        {height > 30 && (
                          <div className={`font-bold truncate opacity-80 italic leading-none ${isCancelled ? 'line-through' : ''}`}>
                            {event.local}
                          </div>
                        )}
                        <div className="mt-auto font-black bg-card/40 px-1 inline-block rounded self-start border border-foreground/5 text-[9px]">
                          {event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    );
                  })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

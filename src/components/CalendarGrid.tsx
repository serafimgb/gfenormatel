import React from 'react';
import { BookingEvent, ViewType, EquipmentType } from '../types';
import { EQUIPMENT_COLORS } from '../constants';
import { doTimesOverlap } from '@/hooks/useOtherProjectBookings';
import { Layers } from 'lucide-react';

interface CalendarGridProps {
  events: BookingEvent[];
  startDate: Date;
  onEventClick: (e: BookingEvent) => void;
  viewType: ViewType;
  equipmentTypes?: EquipmentType[];
  otherProjectEvents?: BookingEvent[];
  currentProjectId?: string;
  selectedEventId?: string;
}

export const CalendarGrid: React.FC<CalendarGridProps> = ({ 
  events, 
  startDate, 
  onEventClick, 
  viewType, 
  equipmentTypes = [],
  otherProjectEvents = [],
  currentProjectId,
  selectedEventId
}) => {
  const getEquipmentColor = (equipmentType: string) => {
    return EQUIPMENT_COLORS[equipmentType] || EQUIPMENT_COLORS.DEFAULT;
  };

  // Check if an event has overlapping booking in another project
  const hasOverlapInOtherProject = (event: BookingEvent): boolean => {
    return otherProjectEvents.some(other => 
      other.equipmentType === event.equipmentType &&
      doTimesOverlap(event.start, event.end, other.start, other.end)
    );
  };

  // Get overlapping events from other projects for a given event
  const getOverlappingOtherEvents = (event: BookingEvent): BookingEvent[] => {
    return otherProjectEvents.filter(other => 
      other.equipmentType === event.equipmentType &&
      doTimesOverlap(event.start, event.end, other.start, other.end)
    );
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
          {daysInGrid.map((day, idx) => {
            // Get ghost events for this day (from other projects, not already in current project events)
            const dayGhostEvents = day ? otherProjectEvents.filter(e => 
              e.start.toDateString() === day.toDateString() &&
              !events.some(ce => 
                ce.equipmentType === e.equipmentType &&
                doTimesOverlap(ce.start, ce.end, e.start, e.end)
              )
            ) : [];

            return (
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
                      {/* Ghost events from other projects */}
                      {dayGhostEvents.slice(0, 2).map(event => (
                        <div 
                          key={`ghost-${event.id}`}
                          className="text-[9px] font-black p-1 rounded truncate border-l-2 opacity-40 bg-muted/50 border-l-muted-foreground border-dashed"
                          title={`${event.solicitante} (Projeto ${event.projectId})`}
                        >
                          <span className="text-muted-foreground">👻 {event.solicitante}</span>
                        </div>
                      ))}
                      
                      {/* Current project events */}
                      {events
                        .filter(e => e.start.toDateString() === day.toDateString())
                        .slice(0, 3 - dayGhostEvents.slice(0, 2).length)
                        .map(event => {
                          const hasOverlap = hasOverlapInOtherProject(event);
                            const isSelected = event.id === selectedEventId;
                          return (
                            <div 
                              key={event.id}
                              onClick={() => onEventClick(event)}
                                className={`text-[9px] font-black p-1 rounded truncate cursor-pointer border-l-2 shadow-sm relative transition-all ${
                                event.isCancelled 
                                  ? 'bg-muted text-muted-foreground line-through opacity-60 border-l-destructive/50' 
                                  : getEquipmentColor(event.equipmentType)
                                } ${hasOverlap ? 'ring-2 ring-amber-500 ring-offset-1' : ''} ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 z-30' : ''}`}
                            >
                              {hasOverlap && (
                                <Layers className="w-3 h-3 absolute -top-1 -right-1 text-amber-500 bg-card rounded-full p-0.5" />
                              )}
                              {event.isCancelled && <span className="text-destructive mr-1">✕</span>}
                              {event.solicitante}
                            </div>
                          );
                        })}
                      {events.filter(e => e.start.toDateString() === day.toDateString()).length > 3 && (
                        <div className="text-[8px] font-black text-normatel-dark text-center">
                          +{events.filter(e => e.start.toDateString() === day.toDateString()).length - 3} mais
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
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
            {days.map((day, dIdx) => {
              // Get ghost events for this day (from other projects)
              const dayGhostEvents = otherProjectEvents.filter(e => 
                e.start.toDateString() === day.toDateString() &&
                !events.some(ce => 
                  ce.equipmentType === e.equipmentType &&
                  doTimesOverlap(ce.start, ce.end, e.start, e.end)
                )
              );

              return (
                <div 
                  key={dIdx} 
                  className="flex-1 border-r border-calendar-border last:border-r-0 relative min-h-[880px] box-border"
                >
                  {hours.map(h => (
                    <div key={h} className="h-20 border-b border-calendar-grid box-border" />
                  ))}

                  {/* Ghost events from other projects */}
                  {dayGhostEvents.map(event => {
                    const startHour = event.start.getHours();
                    const startMin = event.start.getMinutes();
                    const top = ((startHour - 8) * 80) + (startMin * 80 / 60);
                    const durationMinutes = (event.end.getTime() - event.start.getTime()) / (1000 * 60);
                    const height = (durationMinutes * 80 / 60);
                    const colorClass = getEquipmentColor(event.equipmentType);

                    return (
                      <div
                        key={`ghost-${event.id}`}
                        style={{ top: `${top}px`, height: `${Math.max(height, 20)}px` }}
                        className={`absolute left-0.5 right-0.5 p-1.5 border-l-4 rounded text-[10px] overflow-hidden z-10 opacity-30 border-dashed ${colorClass} flex flex-col min-h-[20px]`}
                        title={`${event.solicitante} (Projeto ${event.projectId})`}
                      >
                        <div className="font-black truncate uppercase tracking-tighter leading-tight mb-0.5 flex items-center gap-1">
                          <span className="text-xs">👻</span>
                          {event.solicitante}
                        </div>
                        {height > 30 && (
                          <div className="font-bold truncate opacity-80 italic leading-none">
                            Proj. {event.projectId}
                          </div>
                        )}
                        <div className="mt-auto font-black bg-card/40 px-1 inline-block rounded self-start border border-foreground/5 text-[9px]">
                          {event.start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </div>
                      </div>
                    );
                  })}

                  {/* Current project events */}
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
                      const hasOverlap = hasOverlapInOtherProject(event);
                      const overlappingEvents = hasOverlap ? getOverlappingOtherEvents(event) : [];
                      const isSelected = event.id === selectedEventId;

                      return (
                        <div
                          key={event.id}
                          onClick={() => onEventClick(event)}
                          style={{ top: `${top}px`, height: `${Math.max(height, 20)}px` }}
                          className={`absolute left-0.5 right-0.5 p-1.5 border-l-4 rounded shadow-sm text-[10px] cursor-pointer hover:brightness-95 transition-all overflow-hidden ${
                            isCancelled 
                              ? 'bg-muted border-l-destructive/50 opacity-60' 
                              : colorClass
                          } ${hasOverlap ? 'ring-2 ring-amber-500 ring-offset-1' : ''} ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background scale-[1.02] z-50 shadow-xl' : 'z-20'} border-opacity-50 flex flex-col min-h-[20px]`}
                          title={hasOverlap ? `Também agendado em: Proj. ${overlappingEvents.map(e => e.projectId).join(', ')}` : undefined}
                        >
                          {hasOverlap && (
                            <div className="absolute -top-1 -right-1 bg-amber-500 rounded-full p-0.5" title={`Também em Proj. ${overlappingEvents.map(e => e.projectId).join(', ')}`}>
                              <Layers className="w-3 h-3 text-white" />
                            </div>
                          )}
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
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
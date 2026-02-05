import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Layout } from '../components/Layout';
import { FilterBar } from '../components/FilterBar';
import { CalendarGrid } from '../components/CalendarGrid';
import { Sidebar } from '../components/Sidebar';
import { BookingModal } from '../components/BookingModal';
import { CancelBookingModal } from '../components/CancelBookingModal';
import { BookingEvent, Filters, ViewType, EquipmentType, Project } from '../types';
import { Plus, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBookings, useCreateBooking, useCheckConflict, useCancelBooking } from '@/hooks/useBookings';
import { useOtherProjectBookings } from '@/hooks/useOtherProjectBookings';
import { useProjects } from '@/hooks/useProjects';
import { useEquipmentTypes } from '@/hooks/useEquipmentTypes';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_PROJECTS, DEFAULT_EQUIPMENT_TYPES, EQUIPMENT_COLORS } from '@/constants';

const Index: React.FC = () => {
  const { toast } = useToast();
  
  // Fetch projects and equipment types
  const { data: projects = DEFAULT_PROJECTS } = useProjects();
  const { data: equipmentTypes = DEFAULT_EQUIPMENT_TYPES } = useEquipmentTypes();
  
  // Current project selection
  const [selectedProject, setSelectedProject] = useState<Project>(projects[0] || DEFAULT_PROJECTS[0]);
  const [selectedEquipmentType, setSelectedEquipmentType] = useState<EquipmentType | null>(null);
  
  // Update selected project when projects load
  useEffect(() => {
    if (projects.length > 0 && !projects.find(p => p.id === selectedProject.id)) {
      setSelectedProject(projects[0]);
    }
  }, [projects]);

  const { data: allEvents = [], isLoading } = useBookings(selectedProject.id);
  const { data: otherProjectEvents = [] } = useOtherProjectBookings(selectedProject.id);
  const createBooking = useCreateBooking();
  const checkConflict = useCheckConflict();
  const cancelBooking = useCancelBooking();

  const [viewType, setViewType] = useState<ViewType>(ViewType.Week);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<BookingEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  
  const [filters, setFilters] = useState<Filters>({
    carteira: '',
    equipmentType: ''
  });
  
  const [aiInsights, setAiInsights] = useState<string>('Analisando dados...');
  const [loadingInsights, setLoadingInsights] = useState(false);

  const fetchInsights = useCallback(async () => {
    setLoadingInsights(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-insights', {
        body: { 
          projectId: selectedProject.id,
          equipmentType: selectedEquipmentType?.id,
          selectedEvent: selectedEvent ? {
            solicitante: selectedEvent.solicitante,
            local: selectedEvent.local,
            carteira: selectedEvent.carteira,
            servicoTipo: selectedEvent.servicoTipo,
            tempoServicoHoras: selectedEvent.tempoServicoHoras
          } : null
        }
      });

      if (error) throw error;
      
      if (data?.insight) {
        setAiInsights(data.insight);
      } else if (data?.error) {
        setAiInsights(`⚠️ ${data.error}`);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
      setAiInsights('❌ Erro ao gerar insights. Tente novamente.');
    } finally {
      setLoadingInsights(false);
    }
  }, [selectedProject.id, selectedEquipmentType?.id, selectedEvent]);

  useEffect(() => {
    if (!isLoading) {
      fetchInsights();
    }
  }, [selectedProject.id, isLoading]);

  useEffect(() => {
    if (selectedEvent) {
      fetchInsights();
    }
  }, [selectedEvent]);

  const viewStart = useMemo(() => {
    const d = new Date(currentDate);
    if (viewType === ViewType.Week) {
      const day = d.getDay();
      const diff = d.getDate() - day;
      d.setDate(diff);
    } else {
      d.setDate(1);
    }
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentDate, viewType]);

  const filteredEvents = useMemo(() => {
    return allEvents.filter(e => {
      const matchesEquipmentType = !filters.equipmentType || e.equipmentType === filters.equipmentType;
      const matchesCarteira = !filters.carteira || e.carteira === filters.carteira;
      return matchesEquipmentType && matchesCarteira;
    });
  }, [allEvents, filters]);

  // Filter other project events by equipment type too
  const filteredOtherProjectEvents = useMemo(() => {
    return otherProjectEvents.filter(e => {
      const matchesEquipmentType = !filters.equipmentType || e.equipmentType === filters.equipmentType;
      return matchesEquipmentType;
    });
  }, [otherProjectEvents, filters]);

  const handleSaveEvent = async (newEvent: BookingEvent, bookBothProjects?: boolean) => {
    try {
      // Check conflict for current project
      const hasConflict = await checkConflict(
        newEvent.pemtId,
        newEvent.equipmentType,
        newEvent.projectId,
        newEvent.start,
        newEvent.end
      );

      if (hasConflict) {
        toast({
          title: "Conflito operacional!",
          description: "Este equipamento já está ocupado neste horário no projeto atual.",
          variant: "destructive"
        });
        return;
      }

      // If booking both projects, check conflicts in other projects too
      if (bookBothProjects) {
        const otherProjects = projects.filter(p => p.id !== newEvent.projectId);
        
        for (const otherProject of otherProjects) {
          const hasOtherConflict = await checkConflict(
            newEvent.pemtId,
            newEvent.equipmentType,
            otherProject.id,
            newEvent.start,
            newEvent.end
          );

          if (hasOtherConflict) {
            toast({
              title: "Conflito operacional!",
              description: `Este equipamento já está ocupado neste horário no ${otherProject.name}.`,
              variant: "destructive"
            });
            return;
          }
        }
      }

      // Create booking in current project
      await createBooking.mutateAsync(newEvent);

      // If booking both projects, create in other projects too
      if (bookBothProjects) {
        const otherProjects = projects.filter(p => p.id !== newEvent.projectId);
        
        for (const otherProject of otherProjects) {
          const otherEvent: BookingEvent = {
            ...newEvent,
            id: Math.random().toString(36).substr(2, 9),
            projectId: otherProject.id
          };
          await createBooking.mutateAsync(otherEvent);
        }
      }
      
      toast({
        title: "Agendamento criado!",
        description: bookBothProjects 
          ? `Reserva para ${newEvent.solicitante} criada em todos os projetos.`
          : `Reserva para ${newEvent.solicitante} criada com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao criar agendamento",
        description: "Ocorreu um erro ao salvar. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleCancelBooking = async (reason: string) => {
    if (!selectedEvent) return;
    
    try {
      await cancelBooking.mutateAsync({ id: selectedEvent.id, reason });
      
      toast({
        title: "Agendamento cancelado",
        description: `O agendamento de ${selectedEvent.solicitante} foi cancelado.`,
      });
      
      setIsCancelModalOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      toast({
        title: "Erro ao cancelar",
        description: "Ocorreu um erro ao cancelar o agendamento.",
        variant: "destructive"
      });
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-full bg-card">
        {/* Project Selector Header */}
        <div className="bg-normatel-gradient px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <select
                value={selectedProject.id}
                onChange={(e) => {
                  const project = projects.find(p => p.id === e.target.value);
                  if (project) setSelectedProject(project);
                }}
                className="appearance-none bg-primary-foreground/10 border-2 border-primary-foreground/30 rounded-xl px-4 pr-10 py-2 text-sm font-black text-primary-foreground cursor-pointer focus:outline-none focus:border-primary-foreground/60 transition-all"
              >
                {projects.map(p => (
                  <option key={p.id} value={p.id} className="text-foreground bg-card">
                    {p.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-2.5 w-4 h-4 text-primary-foreground pointer-events-none" strokeWidth={3} />
            </div>
            <span className="text-primary-foreground/80 text-xs font-bold hidden sm:block">
              {selectedProject.description}
            </span>
          </div>
        </div>

        {/* Equipment Type Tabs */}
        <div className="flex bg-muted px-4 sm:px-6 border-b border-border items-center justify-between shadow-sm">
          <div className="flex overflow-x-auto no-scrollbar scroll-smooth">
            <button
              onClick={() => {
                setSelectedEquipmentType(null);
                setFilters(prev => ({ ...prev, equipmentType: '' }));
              }}
              className={`px-4 py-4 text-xs font-black transition-all border-b-4 uppercase tracking-wider whitespace-nowrap ${
                !selectedEquipmentType 
                ? 'border-normatel-light text-normatel-dark' 
                : 'border-transparent text-foreground hover:text-normatel-dark hover:border-muted-foreground'
              }`}
            >
              Todos
            </button>
            {equipmentTypes.map(eq => (
              <button
                key={eq.id}
                onClick={() => {
                  setSelectedEquipmentType(eq);
                  setFilters(prev => ({ ...prev, equipmentType: eq.id }));
                }}
                className={`px-4 py-4 text-xs font-black transition-all border-b-4 uppercase tracking-wider whitespace-nowrap ${
                  selectedEquipmentType?.id === eq.id 
                  ? 'border-normatel-light text-normatel-dark' 
                  : 'border-transparent text-foreground hover:text-normatel-dark hover:border-muted-foreground'
                }`}
              >
                {eq.name}
              </button>
            ))}
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-normatel-gradient text-primary-foreground px-4 sm:px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest flex items-center shadow-lg hover:brightness-110 active:brightness-95 transition-all shrink-0 ml-4"
          >
            <Plus className="w-4 h-4 mr-2" strokeWidth={3} />
            Agendar
          </button>
        </div>

        <FilterBar 
          filters={filters} 
          setFilters={setFilters} 
          viewType={viewType}
          setViewType={setViewType}
          onPrev={() => {
            const d = new Date(currentDate);
            if (viewType === ViewType.Week) d.setDate(d.getDate() - 7);
            else d.setMonth(d.getMonth() - 1);
            setCurrentDate(d);
          }}
          onNext={() => {
            const d = new Date(currentDate);
            if (viewType === ViewType.Week) d.setDate(d.getDate() + 7);
            else d.setMonth(d.getMonth() + 1);
            setCurrentDate(d);
          }}
          onToday={() => setCurrentDate(new Date())}
          currentLabel={viewStart.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
          equipmentTypes={equipmentTypes}
        />

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 overflow-hidden relative bg-calendar-grid">
            {isLoading ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="w-8 h-8 border-4 border-normatel-light border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                  <p className="text-sm font-black text-muted-foreground uppercase tracking-wider">
                    Carregando agendamentos...
                  </p>
                </div>
              </div>
            ) : (
              <CalendarGrid 
                events={filteredEvents} 
                startDate={viewStart} 
                onEventClick={setSelectedEvent}
                viewType={viewType}
                equipmentTypes={equipmentTypes}
                otherProjectEvents={filteredOtherProjectEvents}
                currentProjectId={selectedProject.id}
                selectedEventId={selectedEvent?.id}
              />
            )}
          </div>

          <Sidebar 
            selectedEvent={selectedEvent} 
            onClose={() => setSelectedEvent(null)}
            aiInsights={aiInsights}
            loadingInsights={loadingInsights}
            onCancelClick={() => setIsCancelModalOpen(true)}
            equipmentTypes={equipmentTypes}
            currentDate={currentDate}
          />
        </div>
      </div>

      {isModalOpen && (
        <BookingModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveEvent}
          selectedProject={selectedProject}
          selectedEquipmentType={selectedEquipmentType}
          equipmentTypes={equipmentTypes}
          initialDate={currentDate}
          allProjects={projects}
        />
      )}

      {isCancelModalOpen && selectedEvent && (
        <CancelBookingModal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          onConfirm={handleCancelBooking}
          event={selectedEvent}
        />
      )}
    </Layout>
  );
};

export default Index;

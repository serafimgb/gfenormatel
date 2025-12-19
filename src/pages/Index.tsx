import React, { useState, useMemo } from 'react';
import { Layout } from '../components/Layout';
import { FilterBar } from '../components/FilterBar';
import { CalendarGrid } from '../components/CalendarGrid';
import { Sidebar } from '../components/Sidebar';
import { BookingModal } from '../components/BookingModal';
import { PEMT_LIST } from '../constants';
import { BookingEvent, Filters, ViewType, PEMT } from '../types';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useBookings, useCreateBooking, useCheckConflict } from '@/hooks/useBookings';

const Index: React.FC = () => {
  const { toast } = useToast();
  const { data: allEvents = [], isLoading } = useBookings();
  const createBooking = useCreateBooking();
  const checkConflict = useCheckConflict();

  const [selectedPemt, setSelectedPemt] = useState<PEMT>(PEMT_LIST[0]);
  const [viewType, setViewType] = useState<ViewType>(ViewType.Week);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<BookingEvent | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [filters, setFilters] = useState<Filters>({
    carteira: ''
  });
  
  const [aiInsights] = useState<string>('Sistema de Gestão PEMT Normatel conectado ao Cloud. Os agendamentos são salvos automaticamente no banco de dados.');
  const [loadingInsights] = useState(false);

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
      const isSamePemt = e.pemtId === selectedPemt.id;
      const matchesCarteira = !filters.carteira || e.carteira === filters.carteira;
      return isSamePemt && matchesCarteira;
    });
  }, [allEvents, selectedPemt, filters]);

  const handleSaveEvent = async (newEvent: BookingEvent) => {
    try {
      // Check for conflicts
      const hasConflict = await checkConflict(newEvent.pemtId, newEvent.start, newEvent.end);

      if (hasConflict) {
        toast({
          title: "Conflito operacional!",
          description: "Esta PEMT já está ocupada neste horário.",
          variant: "destructive"
        });
        return;
      }

      await createBooking.mutateAsync(newEvent);
      
      toast({
        title: "Agendamento criado!",
        description: `Reserva para ${newEvent.solicitante} criada com sucesso.`,
      });
    } catch (error) {
      toast({
        title: "Erro ao criar agendamento",
        description: "Ocorreu um erro ao salvar. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  return (
    <Layout>
      <div className="flex flex-col h-full bg-card">
        <div className="flex bg-muted px-4 sm:px-6 border-b border-border items-center justify-between shadow-sm">
          <div className="flex overflow-x-auto no-scrollbar scroll-smooth">
            {PEMT_LIST.map(p => (
              <button
                key={p.id}
                onClick={() => setSelectedPemt(p)}
                className={`px-4 py-4 text-xs font-black transition-all border-b-4 uppercase tracking-wider whitespace-nowrap ${
                  selectedPemt.id === p.id 
                  ? 'border-normatel-light text-normatel-dark' 
                  : 'border-transparent text-foreground hover:text-normatel-dark hover:border-muted-foreground'
                }`}
              >
                {p.name}
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
              />
            )}
          </div>

          <Sidebar 
            selectedEvent={selectedEvent} 
            onClose={() => setSelectedEvent(null)}
            aiInsights={aiInsights}
            loadingInsights={loadingInsights}
          />
        </div>
      </div>

      {isModalOpen && (
        <BookingModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveEvent}
          selectedPemt={selectedPemt}
          initialDate={currentDate}
        />
      )}
    </Layout>
  );
};

export default Index;

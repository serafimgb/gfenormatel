import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { projectId, equipmentType, selectedEvent } = await req.json();

    // Build context for the query
    let query = supabase
      .from('bookings')
      .select('*')
      .order('start_time', { ascending: false })
      .limit(50);

    // Filter by project if provided
    if (projectId) {
      query = query.eq('project_id', projectId);
    }

    // Filter by equipment type if provided
    if (equipmentType) {
      query = query.eq('equipment_type', equipmentType);
    }

    // Fetch recent bookings for the selected PEMT
    const { data: bookings, error } = await query;

    if (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }

    // Get equipment type name for better context
    let equipmentTypeName = 'Todos os Equipamentos';
    if (equipmentType) {
      const { data: eqData } = await supabase
        .from('equipment_types')
        .select('name')
        .eq('id', equipmentType)
        .single();
      if (eqData) {
        equipmentTypeName = eqData.name;
      }
    }

    // Build context for AI
    const bookingSummary = bookings?.map(b => ({
      solicitante: b.solicitante,
      local: b.local,
      carteira: b.carteira,
      servicoTipo: b.servico_tipo,
      tempoHoras: b.tempo_servico_horas,
      data: new Date(b.start_time).toLocaleDateString('pt-BR'),
      horario: `${new Date(b.start_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${new Date(b.end_time).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    })) || [];

    // Count by carteira
    const carteiraCount: Record<string, number> = {};
    const localCount: Record<string, number> = {};
    let totalHoras = 0;

    bookings?.forEach(b => {
      carteiraCount[b.carteira] = (carteiraCount[b.carteira] || 0) + 1;
      localCount[b.local] = (localCount[b.local] || 0) + 1;
      totalHoras += Number(b.tempo_servico_horas);
    });

    const selectedEventContext = selectedEvent 
      ? `\n\nEVENTO SELECIONADO:\n- Solicitante: ${selectedEvent.solicitante}\n- Local: ${selectedEvent.local}\n- Carteira: ${selectedEvent.carteira}\n- Serviço: ${selectedEvent.servicoTipo}\n- Duração: ${selectedEvent.tempoServicoHoras}h`
      : '';

    const systemPrompt = `Você é um analista de operações da Normatel especializado em gestão de equipamentos (PEMT, Caminhão Munck, Caminhão Cesto, Retroescavadeira, Trator, Bongo, etc.). 
Analise os dados de agendamento e forneça insights acionáveis para o equipamento específico ou visão geral.

Seja CONCISO e DIRETO. Use bullet points. Máximo 4-5 linhas.
Foque em: padrões de uso, otimizações, alertas importantes.
Use emojis para destacar pontos importantes.`;

    const userPrompt = `Analise os dados de agendamento - Projeto ${projectId || 'Todos'} - Equipamento: ${equipmentTypeName}:

RESUMO:
- Total de agendamentos: ${bookings?.length || 0}
- Horas totais de uso: ${totalHoras.toFixed(1)}h
- Carteiras: ${JSON.stringify(carteiraCount)}
- Locais mais frequentes: ${JSON.stringify(localCount)}

ÚLTIMOS AGENDAMENTOS:
${bookingSummary.slice(0, 10).map(b => `• ${b.data} ${b.horario} - ${b.solicitante} (${b.carteira})`).join('\n')}
${selectedEventContext}

Forneça 2-3 insights práticos sobre utilização e possíveis otimizações.`;

    console.log('Calling Lovable AI for insights...');

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ 
          error: "Limite de requisições excedido. Tente novamente em alguns instantes." 
        }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ 
          error: "Créditos de IA esgotados. Adicione créditos ao workspace." 
        }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const insight = data.choices?.[0]?.message?.content || 'Não foi possível gerar insights.';

    console.log('Insight generated successfully');

    return new Response(JSON.stringify({ insight }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in generate-insights:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Erro ao gerar insights' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

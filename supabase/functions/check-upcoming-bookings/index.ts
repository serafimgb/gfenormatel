import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Responsáveis por carteira
const CARTEIRA_RESPONSAVEIS: Record<string, string[]> = {
  'Civil': ['responsavel.civil@normatel.com.br'],
  'Elétrica': ['responsavel.eletrica@normatel.com.br'],
  'Mecânica': ['responsavel.mecanica@normatel.com.br'],
  'Áreas Verdes': ['responsavel.areasverdes@normatel.com.br'],
  'Conservação e Limpeza': ['responsavel.conservacao@normatel.com.br'],
  'Automação': ['responsavel.automacao@normatel.com.br'],
};

const FROM_EMAIL = 'notificacoes@norahub.com.br';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
    if (!RESEND_API_KEY) {
      throw new Error('RESEND_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Find bookings starting in ~48 hours (window of 47-49h to avoid duplicates with hourly cron)
    const now = new Date();
    const from48h = new Date(now.getTime() + 47 * 60 * 60 * 1000);
    const to48h = new Date(now.getTime() + 49 * 60 * 60 * 1000);

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select('*')
      .eq('is_cancelled', false)
      .gte('start_time', from48h.toISOString())
      .lte('start_time', to48h.toISOString());

    if (error) {
      console.error('Error fetching upcoming bookings:', error);
      throw error;
    }

    console.log(`Found ${bookings?.length || 0} bookings starting in ~48h`);

    let sentCount = 0;

    for (const booking of bookings || []) {
      const recipients = CARTEIRA_RESPONSAVEIS[booking.carteira] || [];
      if (recipients.length === 0) continue;

      // Get equipment name
      let equipmentName = booking.equipment_type;
      const { data: eqData } = await supabase
        .from('equipment_types')
        .select('name')
        .eq('id', booking.equipment_type)
        .single();
      if (eqData) equipmentName = eqData.name;

      // Get project name
      let projectName = booking.project_id;
      const { data: projData } = await supabase
        .from('projects')
        .select('name')
        .eq('id', booking.project_id)
        .single();
      if (projData) projectName = projData.name;

      const startDate = new Date(booking.start_time);
      const endDate = new Date(booking.end_time);

      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #F39C12, #E67E22); padding: 20px; border-radius: 12px 12px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 20px;">⏰ Lembrete de Reserva (48h)</h1>
          </div>
          <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0;">
            <p style="color: #333; margin-bottom: 16px;">A seguinte reserva acontecerá em <strong>48 horas</strong>:</p>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Solicitante:</td><td style="padding: 8px 0;">${booking.solicitante}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Equipamento:</td><td style="padding: 8px 0;">${equipmentName}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Projeto:</td><td style="padding: 8px 0;">${projectName}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Carteira:</td><td style="padding: 8px 0;">${booking.carteira}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Local:</td><td style="padding: 8px 0;">${booking.local}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Data:</td><td style="padding: 8px 0;">${startDate.toLocaleDateString('pt-BR')}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Horário:</td><td style="padding: 8px 0;">${startDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - ${endDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td></tr>
            </table>
          </div>
          <p style="color: #999; font-size: 12px; text-align: center; margin-top: 16px;">GFE Normatel - Sistema de Agendamento</p>
        </div>
      `;

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: `GFE Normatel <${FROM_EMAIL}>`,
          to: recipients,
          subject: `⏰ Lembrete: Reserva em 48h - ${equipmentName} | ${booking.solicitante}`,
          html,
        }),
      });

      if (response.ok) {
        sentCount++;
        console.log(`Reminder sent for booking ${booking.id} to ${recipients.join(', ')}`);
      } else {
        const errData = await response.json();
        console.error(`Failed to send reminder for booking ${booking.id}:`, errData);
      }
    }

    return new Response(JSON.stringify({ success: true, reminders_sent: sentCount }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in check-upcoming-bookings:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

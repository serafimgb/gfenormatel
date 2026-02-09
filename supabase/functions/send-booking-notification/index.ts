import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface BookingNotification {
  solicitante: string;
  carteira: string;
  local: string;
  servicoTipo: string;
  equipmentType: string;
  numeroOm: string;
  start: string;
  end: string;
  tempoServicoHoras: number;
  projectName: string;
  responsaveis: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const booking: BookingNotification = await req.json();

    if (!booking.responsaveis || booking.responsaveis.length === 0) {
      return new Response(
        JSON.stringify({ error: "Nenhum responsável informado" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const startDate = new Date(booking.start);
    const formattedDate = startDate.toLocaleDateString("pt-BR");
    const formattedTime = startDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    const emailResponse = await resend.emails.send({
      // IMPORTANTE: Troque para seu domínio verificado no Resend
      // Ex: "Normatel <agendamentos@normatel.com.br>"
      from: "onboarding@resend.dev",
      to: booking.responsaveis,
      subject: `Novo Agendamento - ${booking.equipmentType} - ${booking.projectName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #FF6B00, #FF8C33); padding: 20px; border-radius: 8px 8px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 18px;">📋 Novo Agendamento</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0;">${booking.projectName}</p>
          </div>
          <div style="border: 1px solid #e5e7eb; border-top: none; padding: 20px; border-radius: 0 0 8px 8px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px 0; font-weight: bold; color: #666; width: 40%;">Equipamento</td><td style="padding: 8px 0;">${booking.equipmentType}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #666;">Solicitante</td><td style="padding: 8px 0;">${booking.solicitante}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #666;">Carteira</td><td style="padding: 8px 0;">${booking.carteira}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #666;">Local</td><td style="padding: 8px 0;">${booking.local}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #666;">Nº OM</td><td style="padding: 8px 0;">${booking.numeroOm}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #666;">Data</td><td style="padding: 8px 0;">${formattedDate}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #666;">Horário</td><td style="padding: 8px 0;">${formattedTime}</td></tr>
              <tr><td style="padding: 8px 0; font-weight: bold; color: #666;">Duração</td><td style="padding: 8px 0;">${booking.tempoServicoHoras}h</td></tr>
            </table>
            <div style="margin-top: 16px; padding: 12px; background: #f9fafb; border-radius: 6px;">
              <p style="margin: 0; font-weight: bold; color: #666; font-size: 12px;">MOTIVO</p>
              <p style="margin: 4px 0 0;">${booking.servicoTipo}</p>
            </div>
          </div>
        </div>
      `,
    });

    console.log("Notification email sent:", emailResponse);

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);

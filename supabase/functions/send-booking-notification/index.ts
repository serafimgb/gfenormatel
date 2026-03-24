import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const FROM_EMAIL = "notificacoes@norahub.com.br";

interface BookingData {
  solicitante: string;
  carteira: string;
  local: string;
  servicoTipo: string;
  equipmentType: string;
  equipmentName?: string;
  start: string;
  end: string;
  tempoServicoHoras: number;
  projectName?: string;
  projectId?: string;
  numeroOm?: string;
  cancellationReason?: string;
  cancelledBy?: string;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function buildCreatedEmail(data: BookingData): { subject: string; html: string } {
  return {
    subject: `✅ Nova Reserva - ${data.equipmentName || data.equipmentType} | ${data.solicitante}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #57B952, #4F8C0D); padding: 20px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">✅ Nova Reserva Criada</h1>
        </div>
        <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Solicitante:</td><td style="padding: 8px 0;">${data.solicitante}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Equipamento:</td><td style="padding: 8px 0;">${data.equipmentName || data.equipmentType}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Projeto:</td><td style="padding: 8px 0;">${data.projectName || "-"}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Carteira:</td><td style="padding: 8px 0;">${data.carteira}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Local:</td><td style="padding: 8px 0;">${data.local}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Serviço:</td><td style="padding: 8px 0;">${data.servicoTipo}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Data:</td><td style="padding: 8px 0;">${formatDate(data.start)}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Horário:</td><td style="padding: 8px 0;">${formatTime(data.start)} - ${formatTime(data.end)}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Duração:</td><td style="padding: 8px 0;">${data.tempoServicoHoras}h</td></tr>
            ${data.numeroOm ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Nº OM:</td><td style="padding: 8px 0;">${data.numeroOm}</td></tr>` : ""}
          </table>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 16px;">GFE Normatel - Sistema de Agendamento</p>
      </div>
    `,
  };
}

function buildCancelledEmail(data: BookingData): { subject: string; html: string } {
  return {
    subject: `❌ Reserva Cancelada - ${data.equipmentName || data.equipmentType} | ${data.solicitante}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #E74C3C, #C0392B); padding: 20px; border-radius: 12px 12px 0 0;">
          <h1 style="color: white; margin: 0; font-size: 20px;">❌ Reserva Cancelada</h1>
        </div>
        <div style="background: #f9f9f9; padding: 24px; border-radius: 0 0 12px 12px; border: 1px solid #e0e0e0;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Solicitante:</td><td style="padding: 8px 0;">${data.solicitante}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Equipamento:</td><td style="padding: 8px 0;">${data.equipmentName || data.equipmentType}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Data:</td><td style="padding: 8px 0;">${formatDate(data.start)}</td></tr>
            <tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Horário:</td><td style="padding: 8px 0;">${formatTime(data.start)} - ${formatTime(data.end)}</td></tr>
            ${data.cancelledBy ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Cancelado por:</td><td style="padding: 8px 0;">${data.cancelledBy}</td></tr>` : ""}
            ${data.cancellationReason ? `<tr><td style="padding: 8px 0; font-weight: bold; color: #555;">Motivo:</td><td style="padding: 8px 0;">${data.cancellationReason}</td></tr>` : ""}
          </table>
        </div>
        <p style="color: #999; font-size: 12px; text-align: center; margin-top: 16px;">GFE Normatel - Sistema de Agendamento</p>
      </div>
    `,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { type, booking } = (await req.json()) as {
      type: "created" | "cancelled";
      booking: BookingData;
    };

    const projectId = booking.projectId;

    // Fetch recipients filtered by project
    // 1. Carteira-specific recipients for this project
    let carteiraQuery = supabase
      .from("notification_recipients")
      .select("email")
      .eq("type", "carteira")
      .eq("carteira", booking.carteira);
    
    if (projectId) {
      carteiraQuery = carteiraQuery.eq("project_id", projectId);
    }
    const { data: carteiraRecipients } = await carteiraQuery;

    // 2. Gestão recipients for this project
    let gestaoQuery = supabase
      .from("notification_recipients")
      .select("email")
      .eq("type", "gestao");
    
    if (projectId) {
      gestaoQuery = gestaoQuery.eq("project_id", projectId);
    }
    const { data: gestaoRecipients } = await gestaoQuery;

    const allEmails = new Set<string>();
    (carteiraRecipients || []).forEach(r => allEmails.add(r.email));
    (gestaoRecipients || []).forEach(r => allEmails.add(r.email));

    const recipients = Array.from(allEmails);

    if (recipients.length === 0) {
      console.warn(`No recipients found for project: ${projectId}, carteira: ${booking.carteira}`);
      return new Response(JSON.stringify({ success: true, message: "No recipients configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let emailContent: { subject: string; html: string };
    switch (type) {
      case "created":
        emailContent = buildCreatedEmail(booking);
        break;
      case "cancelled":
        emailContent = buildCancelledEmail(booking);
        break;
      default:
        throw new Error(`Unknown notification type: ${type}`);
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `GFE Normatel <${FROM_EMAIL}>`,
        to: recipients,
        subject: emailContent.subject,
        html: emailContent.html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Resend API error:", response.status, JSON.stringify(data));
      throw new Error(`Resend API error [${response.status}]: ${JSON.stringify(data)}`);
    }

    console.log(`Email notification (${type}) sent to: ${recipients.join(", ")}`);

    return new Response(JSON.stringify({ success: true, emailId: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

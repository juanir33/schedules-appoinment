import { BusinessSettings } from '@/src/types/models.type';
import { getBusinessSettings } from '@/src/lib/firestore/businessSettings/businessSettings';

export interface CalendarInvite {
  summary: string;
  description?: string;
  startDateTime: string; // ISO string
  endDateTime: string; // ISO string
  location?: string;
  customerEmail?: string;
  customerName?: string;
}

/**
 * Servicio simplificado de calendario que envía invitaciones por email
 * usando el email del negocio configurado en BusinessSettings
 */
export class EmailCalendarService {
  private businessSettings: BusinessSettings | null = null;

  constructor(private businessId: string) {}

  /**
   * Inicializar el servicio cargando la configuración del negocio
   */
  async initialize(): Promise<boolean> {
    this.businessSettings = await getBusinessSettings(this.businessId);
    return this.businessSettings !== null && !!this.businessSettings.email;
  }

  /**
   * Crear invitación de calendario y enviarla por email
   */
  async createCalendarInvite(invite: CalendarInvite): Promise<boolean> {
    if (!this.businessSettings || !this.businessSettings.email) {
      console.log('Business email not configured for:', this.businessId);
      return false;
    }

    try {
      // Generar archivo ICS (iCalendar)
      const icsContent = this.generateICSContent(invite);
      
      // Enviar email con el archivo ICS adjunto
      const emailSent = await this.sendCalendarEmail(invite, icsContent);
      
      return emailSent;
    } catch (error) {
      console.error('Error creating calendar invite:', error);
      return false;
    }
  }

  /**
   * Generar contenido ICS (iCalendar) para la invitación
   */
  private generateICSContent(invite: CalendarInvite): string {
    const startDate = new Date(invite.startDateTime);
    const endDate = new Date(invite.endDateTime);
    
    // Formatear fechas para ICS (YYYYMMDDTHHMMSSZ)
    const formatICSDate = (date: Date): string => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const uid = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}@${this.businessSettings!.name.replace(/\s+/g, '').toLowerCase()}.com`;
    const now = formatICSDate(new Date());
    
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Salon App//Calendar Event//ES',
      'CALSCALE:GREGORIAN',
      'METHOD:REQUEST',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${formatICSDate(startDate)}`,
      `DTEND:${formatICSDate(endDate)}`,
      `SUMMARY:${invite.summary}`,
      `ORGANIZER;CN=${this.businessSettings!.name}:mailto:${this.businessSettings!.email}`
    ];

    if (invite.description) {
      icsContent.push(`DESCRIPTION:${invite.description.replace(/\n/g, '\\n')}`);
    }

    if (invite.location) {
      icsContent.push(`LOCATION:${invite.location}`);
    }

    if (invite.customerEmail) {
      icsContent.push(`ATTENDEE;CN=${invite.customerName || 'Cliente'};RSVP=TRUE:mailto:${invite.customerEmail}`);
    }

    icsContent.push(
      'STATUS:CONFIRMED',
      'SEQUENCE:0',
      'END:VEVENT',
      'END:VCALENDAR'
    );

    return icsContent.join('\r\n');
  }

  /**
   * Enviar email con invitación de calendario
   * Nota: Esta función necesitará integrarse con tu servicio de email preferido
   * (SendGrid, Nodemailer, etc.)
   */
  private async sendCalendarEmail(invite: CalendarInvite, icsContent: string): Promise<boolean> {
    // TODO: Implementar envío de email con tu servicio preferido
    // Por ahora, solo logueamos la información
    
    console.log('📅 Calendar invite ready to send:');
    console.log('From:', this.businessSettings!.email);
    console.log('To:', invite.customerEmail || 'No customer email provided');
    console.log('Subject:', `Invitación: ${invite.summary}`);
    console.log('ICS Content length:', icsContent.length);
    
    // Aquí integrarías con tu servicio de email:
    // - SendGrid
    // - Nodemailer con SMTP
    // - AWS SES
    // - Etc.
    
    return true; // Simular éxito por ahora
  }

  /**
   * Obtener información del negocio
   */
  getBusinessInfo() {
    return this.businessSettings;
  }
}

/**
 * Factory function para crear instancia del servicio
 */
export async function createEmailCalendarService(businessId: string): Promise<EmailCalendarService | null> {
  const service = new EmailCalendarService(businessId);
  const initialized = await service.initialize();
  
  if (!initialized) {
    console.error('Failed to initialize EmailCalendarService for business:', businessId);
    return null;
  }
  
  return service;
}
import { google } from 'googleapis';
import { CalendarSettings, GoogleCalendarConfig, OutlookCalendarConfig } from '@/src/types/models.type';
import { getCalendarSettingsByBusiness } from '@/src/lib/firestore/calendarSettings/calendarSettings';
import { getBusinessSettings } from '@/src/lib/firestore/businessSettings/businessSettings';

export interface CalendarEvent {
  summary: string;
  description?: string;
  startDateTime: string; // ISO string
  endDateTime: string; // ISO string
  attendees?: string[];
}

export interface CalendarEventResponse {
  id: string;
  htmlLink?: string;
  status: 'confirmed' | 'tentative' | 'cancelled';
}

/**
 * Servicio principal de calendario que maneja múltiples proveedores
 */
export class CalendarService {
  private settings: CalendarSettings | null = null;

  constructor(private businessId: string) {}

  /**
   * Inicializar el servicio cargando la configuración del negocio
   */
  async initialize(): Promise<boolean> {
    // Primero intentar obtener desde businessSettings.calendarIntegration
    const businessSettings = await getBusinessSettings(this.businessId);
    if (businessSettings?.calendarIntegration?.enabled) {
      this.settings = {
        id: businessSettings.calendarIntegration.id,
        businessId: businessSettings.calendarIntegration.businessId,
        provider: businessSettings.calendarIntegration.provider,
        enabled: businessSettings.calendarIntegration.enabled,
        config: businessSettings.calendarIntegration.config,
        createdAt: businessSettings.calendarIntegration.createdAt,
        updatedAt: businessSettings.calendarIntegration.updatedAt
      };
      return true;
    }
    
    // Fallback: intentar obtener desde calendarSettings (legacy)
    this.settings = await getCalendarSettingsByBusiness(this.businessId);
    return this.settings !== null && this.settings.enabled;
  }

  /**
   * Crear evento en el calendario
   */
  async createEvent(event: CalendarEvent): Promise<CalendarEventResponse | null> {
    if (!this.settings || !this.settings.enabled) {
      console.log('Calendar integration not enabled for business:', this.businessId);
      return null;
    }

    switch (this.settings.provider) {
      case 'google':
        return this.createGoogleEvent(event, this.settings.config as GoogleCalendarConfig);
      case 'outlook':
        return this.createOutlookEvent(event, this.settings.config as OutlookCalendarConfig);
      case 'none':
      default:
        console.log('No calendar provider configured');
        return null;
    }
  }

  /**
   * Actualizar evento en el calendario
   */
  async updateEvent(eventId: string, event: CalendarEvent): Promise<CalendarEventResponse | null> {
    if (!this.settings || !this.settings.enabled) {
      return null;
    }

    switch (this.settings.provider) {
      case 'google':
        return this.updateGoogleEvent(eventId, event, this.settings.config as GoogleCalendarConfig);
      case 'outlook':
        return this.updateOutlookEvent(eventId, event, this.settings.config as OutlookCalendarConfig);
      default:
        return null;
    }
  }

  /**
   * Eliminar evento del calendario
   */
  async deleteEvent(eventId: string): Promise<boolean> {
    if (!this.settings || !this.settings.enabled) {
      return false;
    }

    switch (this.settings.provider) {
      case 'google':
        return this.deleteGoogleEvent(eventId, this.settings.config as GoogleCalendarConfig);
      case 'outlook':
        return this.deleteOutlookEvent(eventId, this.settings.config as OutlookCalendarConfig);
      default:
        return false;
    }
  }

  /**
   * Crear evento en Google Calendar
   */
  private async createGoogleEvent(
    event: CalendarEvent,
    config: GoogleCalendarConfig
  ): Promise<CalendarEventResponse | null> {
    try {
      const oAuth2Client = new google.auth.OAuth2(
        config.clientId,
        config.clientSecret,
        config.redirectUri
      );
      
      // Configurar credenciales con access_token y refresh_token
      const credentials: { access_token?: string; refresh_token?: string; expiry_date?: number } = {};
      if (config.accessToken) {
        credentials.access_token = config.accessToken;
      }
      if (config.refreshToken) {
        credentials.refresh_token = config.refreshToken;
      }
      if (config.tokenExpiresAt) {
        credentials.expiry_date = new Date(config.tokenExpiresAt).getTime();
      }
      
      oAuth2Client.setCredentials(credentials);
      const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

      const response = await calendar.events.insert({
        calendarId: config.calendarId,
        requestBody: {
          summary: event.summary,
          description: event.description,
          start: { dateTime: event.startDateTime },
          end: { dateTime: event.endDateTime },
          attendees: event.attendees?.map(email => ({ email })),
        },
      });

      return {
        id: response.data.id!,
        htmlLink: response.data.htmlLink || undefined,
        status: response.data.status as 'confirmed' | 'tentative' | 'cancelled'
      };
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      return null;
    }
  }

  /**
   * Actualizar evento en Google Calendar
   */
  private async updateGoogleEvent(
    eventId: string,
    event: CalendarEvent,
    config: GoogleCalendarConfig
  ): Promise<CalendarEventResponse | null> {
    try {
      const oAuth2Client = new google.auth.OAuth2(
        config.clientId,
        config.clientSecret,
        config.redirectUri
      );
      
      // Configurar credenciales con access_token y refresh_token
      const credentials: { access_token?: string; refresh_token?: string; expiry_date?: number } = {};
      if (config.accessToken) {
        credentials.access_token = config.accessToken;
      }
      if (config.refreshToken) {
        credentials.refresh_token = config.refreshToken;
      }
      if (config.tokenExpiresAt) {
        credentials.expiry_date = new Date(config.tokenExpiresAt).getTime();
      }
      
      oAuth2Client.setCredentials(credentials);
      const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

      const response = await calendar.events.update({
        calendarId: config.calendarId,
        eventId: eventId,
        requestBody: {
          summary: event.summary,
          description: event.description,
          start: { dateTime: event.startDateTime },
          end: { dateTime: event.endDateTime },
          attendees: event.attendees?.map(email => ({ email })),
        },
      });

      return {
        id: response.data.id!,
        htmlLink: response.data.htmlLink || undefined,
        status: response.data.status as 'confirmed' | 'tentative' | 'cancelled'
      };
    } catch (error) {
      console.error('Error updating Google Calendar event:', error);
      return null;
    }
  }

  /**
   * Eliminar evento de Google Calendar
   */
  private async deleteGoogleEvent(
    eventId: string,
    config: GoogleCalendarConfig
  ): Promise<boolean> {
    try {
      const oAuth2Client = new google.auth.OAuth2(
        config.clientId,
        config.clientSecret,
        config.redirectUri
      );
      
      // Configurar credenciales con access_token y refresh_token
      const credentials: { access_token?: string; refresh_token?: string; expiry_date?: number } = {};
      if (config.accessToken) {
        credentials.access_token = config.accessToken;
      }
      if (config.refreshToken) {
        credentials.refresh_token = config.refreshToken;
      }
      if (config.tokenExpiresAt) {
        credentials.expiry_date = new Date(config.tokenExpiresAt).getTime();
      }
      
      oAuth2Client.setCredentials(credentials);
      const calendar = google.calendar({ version: 'v3', auth: oAuth2Client });

      await calendar.events.delete({
        calendarId: config.calendarId,
        eventId: eventId,
      });

      return true;
    } catch (error) {
      console.error('Error deleting Google Calendar event:', error);
      return false;
    }
  }

  /**
   * Crear evento en Outlook Calendar (Microsoft Graph API)
   */
  private async createOutlookEvent(
    event: CalendarEvent,
    config: OutlookCalendarConfig
  ): Promise<CalendarEventResponse | null> {
    try {
      // Implementación usando Microsoft Graph API
      const accessToken = await this.getOutlookAccessToken(config);
      
      const response = await fetch(`https://graph.microsoft.com/v1.0/me/calendars/${config.calendarId}/events`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: event.summary,
          body: {
            contentType: 'HTML',
            content: event.description || ''
          },
          start: {
            dateTime: event.startDateTime,
            timeZone: 'UTC'
          },
          end: {
            dateTime: event.endDateTime,
            timeZone: 'UTC'
          },
          attendees: event.attendees?.map(email => ({
            emailAddress: { address: email }
          }))
        })
      });

      if (!response.ok) {
        throw new Error(`Outlook API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        htmlLink: data.webLink,
        status: 'confirmed'
      };
    } catch (error) {
      console.error('Error creating Outlook Calendar event:', error);
      return null;
    }
  }

  /**
   * Actualizar evento en Outlook Calendar
   */
  private async updateOutlookEvent(
    eventId: string,
    event: CalendarEvent,
    config: OutlookCalendarConfig
  ): Promise<CalendarEventResponse | null> {
    try {
      const accessToken = await this.getOutlookAccessToken(config);
      
      const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: event.summary,
          body: {
            contentType: 'HTML',
            content: event.description || ''
          },
          start: {
            dateTime: event.startDateTime,
            timeZone: 'UTC'
          },
          end: {
            dateTime: event.endDateTime,
            timeZone: 'UTC'
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Outlook API error: ${response.statusText}`);
      }

      const data = await response.json();
      return {
        id: data.id,
        htmlLink: data.webLink,
        status: 'confirmed'
      };
    } catch (error) {
      console.error('Error updating Outlook Calendar event:', error);
      return null;
    }
  }

  /**
   * Eliminar evento de Outlook Calendar
   */
  private async deleteOutlookEvent(
    eventId: string,
    config: OutlookCalendarConfig
  ): Promise<boolean> {
    try {
      const accessToken = await this.getOutlookAccessToken(config);
      
      const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        }
      });

      return response.ok;
    } catch (error) {
      console.error('Error deleting Outlook Calendar event:', error);
      return false;
    }
  }

  /**
   * Obtener access token para Outlook usando refresh token
   */
  private async getOutlookAccessToken(config: OutlookCalendarConfig): Promise<string> {
    const response = await fetch(`https://login.microsoftonline.com/${config.tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: config.refreshToken,
        grant_type: 'refresh_token',
        scope: 'https://graph.microsoft.com/Calendars.ReadWrite'
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to refresh Outlook token: ${response.statusText}`);
    }

    const data = await response.json();
    return data.access_token;
  }
}

/**
 * Factory function para crear instancia del servicio de calendario
 */
export async function createCalendarService(businessId: string): Promise<CalendarService | null> {
  const service = new CalendarService(businessId);
  const initialized = await service.initialize();
  
  return initialized ? service : null;
}
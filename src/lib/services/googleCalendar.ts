import { google } from 'googleapis';
import { getOAuth2Client, refreshAccessToken, setCredentials } from './googleAuth';

// Helper para manejar errores de forma segura
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// Interfaz para los datos del evento
export interface CalendarEventData {
  summary: string;
  description?: string;
  startDateTime: string; // Formato ISO 8601
  endDateTime: string;   // Formato ISO 8601
  timeZone: string;
  attendeeEmail?: string;
  location?: string;
}

// Interfaz para la respuesta del evento creado
export interface CalendarEventResponse {
  id: string;
  htmlLink: string;
  summary: string;
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
}

/**
 * Crea un evento en Google Calendar
 * @param eventData - Datos del evento a crear
 * @param accessToken - Token de acceso válido
 * @param refreshToken - Token de refresco (opcional)
 * @returns Evento creado
 */
export async function createCalendarEvent(
  eventData: CalendarEventData,
  accessToken: string,
  refreshToken?: string
): Promise<CalendarEventResponse> {
  try {
    // Configurar credenciales
    const auth = getOAuth2Client();
    setCredentials(accessToken, refreshToken);
    
    // Crear cliente de Calendar API
    const calendar = google.calendar({ version: 'v3', auth });
    
    // Construir objeto del evento
    const event = {
      summary: eventData.summary,
      description: eventData.description,
      location: eventData.location,
      start: {
        dateTime: eventData.startDateTime,
        timeZone: eventData.timeZone,
      },
      end: {
        dateTime: eventData.endDateTime,
        timeZone: eventData.timeZone,
      },
      attendees: eventData.attendeeEmail ? [
        { email: eventData.attendeeEmail }
      ] : [],
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 }, // 1 día antes
          { method: 'popup', minutes: 30 },      // 30 minutos antes
        ],
      },
      // Configuración para enviar notificaciones
      sendUpdates: 'all',
    };
    
    // Crear el evento
    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });
    
    if (!response.data) {
      throw new Error('No se recibió respuesta del servidor');
    }
    
    return {
      id: response.data.id!,
      htmlLink: response.data.htmlLink!,
      summary: response.data.summary!,
      start: {
        dateTime: response.data.start!.dateTime!,
        timeZone: response.data.start!.timeZone!,
      },
      end: {
        dateTime: response.data.end!.dateTime!,
        timeZone: response.data.end!.timeZone!,
      },
    };
    
  } catch (error: unknown) {
    console.error('Error al crear evento en Google Calendar:', error);
    
    // Si el token expiró, intentar refrescarlo
    if (error && typeof error === 'object' && 'code' in error && error.code === 401 && refreshToken) {
      try {
        const newAccessToken = await refreshAccessToken(refreshToken);
        if (newAccessToken) {
          // Reintentar con el nuevo token
          return createCalendarEvent(eventData, newAccessToken, refreshToken);
        }
      } catch (refreshError) {
        console.error('Error al refrescar token:', refreshError);
        throw new Error('Token expirado y no se pudo refrescar');
      }
    }
    
    throw new Error(`Error al crear evento: ${getErrorMessage(error)}`);
  }
}

/**
 * Actualiza un evento existente en Google Calendar
 * @param eventId - ID del evento a actualizar
 * @param eventData - Nuevos datos del evento
 * @param accessToken - Token de acceso válido
 * @param refreshToken - Token de refresco (opcional)
 * @returns Evento actualizado
 */
export async function updateCalendarEvent(
  eventId: string,
  eventData: Partial<CalendarEventData>,
  accessToken: string,
  refreshToken?: string
): Promise<CalendarEventResponse> {
  try {
    const auth = getOAuth2Client();
    setCredentials(accessToken, refreshToken);
    
    const calendar = google.calendar({ version: 'v3', auth });
    
    const event: Record<string, unknown> = {};
    
    if (eventData.summary) event.summary = eventData.summary;
    if (eventData.description) event.description = eventData.description;
    if (eventData.location) event.location = eventData.location;
    
    if (eventData.startDateTime && eventData.timeZone) {
      event.start = {
        dateTime: eventData.startDateTime,
        timeZone: eventData.timeZone,
      };
    }
    
    if (eventData.endDateTime && eventData.timeZone) {
      event.end = {
        dateTime: eventData.endDateTime,
        timeZone: eventData.timeZone,
      };
    }
    
    if (eventData.attendeeEmail) {
      event.attendees = [{ email: eventData.attendeeEmail }];
    }
    
    const response = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      requestBody: event,
    });
    
    if (!response.data) {
      throw new Error('No se recibió respuesta del servidor');
    }
    
    return {
      id: response.data.id!,
      htmlLink: response.data.htmlLink!,
      summary: response.data.summary!,
      start: {
        dateTime: response.data.start!.dateTime!,
        timeZone: response.data.start!.timeZone!,
      },
      end: {
        dateTime: response.data.end!.dateTime!,
        timeZone: response.data.end!.timeZone!,
      },
    };
    
  } catch (error: unknown) {
    console.error('Error al actualizar evento:', error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 401 && refreshToken) {
      try {
        const newAccessToken = await refreshAccessToken(refreshToken);
        if (newAccessToken) {
          return updateCalendarEvent(eventId, eventData, newAccessToken, refreshToken);
        }
      } catch (refreshError) {
        console.error('Error al refrescar token:', refreshError);
        throw new Error('Token expirado y no se pudo refrescar');
      }
    }
    
    throw new Error(`Error al actualizar evento: ${getErrorMessage(error)}`);
  }
}

/**
 * Elimina un evento de Google Calendar
 * @param eventId - ID del evento a eliminar
 * @param accessToken - Token de acceso válido
 * @param refreshToken - Token de refresco (opcional)
 */
export async function deleteCalendarEvent(
  eventId: string,
  accessToken: string,
  refreshToken?: string
): Promise<void> {
  try {
    const auth = getOAuth2Client();
    setCredentials(accessToken, refreshToken);
    
    const calendar = google.calendar({ version: 'v3', auth });
    
    await calendar.events.delete({
      calendarId: 'primary',
      eventId: eventId,
    });
    
  } catch (error: unknown) {
    console.error('Error al eliminar evento:', error);
    
    if (error && typeof error === 'object' && 'code' in error && error.code === 401 && refreshToken) {
      try {
        const newAccessToken = await refreshAccessToken(refreshToken);
        if (newAccessToken) {
          return deleteCalendarEvent(eventId, newAccessToken, refreshToken);
        }
      } catch (refreshError) {
        console.error('Error al refrescar token:', refreshError);
        throw new Error('Token expirado y no se pudo refrescar');
      }
    }
    
    throw new Error(`Error al eliminar evento: ${getErrorMessage(error)}`);
  }
}

/**
 * Verifica si el usuario tiene acceso a Google Calendar
 * @param accessToken - Token de acceso
 * @param refreshToken - Token de refresco (opcional)
 * @returns true si tiene acceso
 */
export async function verifyCalendarAccess(
  accessToken: string,
  refreshToken?: string
): Promise<boolean> {
  try {
    const auth = getOAuth2Client();
    setCredentials(accessToken, refreshToken);
    
    const calendar = google.calendar({ version: 'v3', auth });
    
    // Intentar obtener información del calendario principal
    await calendar.calendars.get({ calendarId: 'primary' });
    
    return true;
  } catch (error) {
    console.error('Error al verificar acceso al calendario:', error);
    return false;
  }
}
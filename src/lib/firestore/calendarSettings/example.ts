/**
 * Ejemplo de cómo configurar la integración de calendario para un negocio
 * Este archivo muestra cómo usar las funciones de configuración de calendario
 */

import { createOrUpdateCalendarSettings } from './calendarSettings';
import { GoogleCalendarConfig, OutlookCalendarConfig } from '@/src/types/models.type';

/**
 * Ejemplo: Configurar Google Calendar para un negocio
 */
export async function setupGoogleCalendarForBusiness(businessId: string) {
  const googleConfig: GoogleCalendarConfig = {
    clientId: 'your-google-client-id.apps.googleusercontent.com',
    clientSecret: 'your-google-client-secret',
    refreshToken: 'your-refresh-token',
    calendarId: 'primary', // o un calendar ID específico
    redirectUri: 'http://localhost:3000/auth/google/callback'
  };

  const settingsId = await createOrUpdateCalendarSettings(
    businessId,
    'google',
    googleConfig,
    true // enabled
  );

  console.log(`Google Calendar configurado para negocio ${businessId}, settings ID: ${settingsId}`);
  return settingsId;
}

/**
 * Ejemplo: Configurar Outlook Calendar para un negocio
 */
export async function setupOutlookCalendarForBusiness(businessId: string) {
  const outlookConfig: OutlookCalendarConfig = {
    clientId: 'your-outlook-client-id',
    clientSecret: 'your-outlook-client-secret',
    refreshToken: 'your-refresh-token',
    calendarId: 'primary',
    tenantId: 'your-tenant-id'
  };

  const settingsId = await createOrUpdateCalendarSettings(
    businessId,
    'outlook',
    outlookConfig,
    true
  );

  console.log(`Outlook Calendar configurado para negocio ${businessId}, settings ID: ${settingsId}`);
  return settingsId;
}

/**
 * Ejemplo: Deshabilitar integración de calendario
 */
export async function disableCalendarForBusiness(businessId: string) {
  await createOrUpdateCalendarSettings(
    businessId,
    'none',
    null,
    false // disabled
  );

  console.log(`Integración de calendario deshabilitada para negocio ${businessId}`);
}

/**
 * Instrucciones para obtener las credenciales:
 * 
 * GOOGLE CALENDAR:
 * 1. Ir a Google Cloud Console (https://console.cloud.google.com/)
 * 2. Crear un proyecto o seleccionar uno existente
 * 3. Habilitar Google Calendar API
 * 4. Crear credenciales OAuth 2.0
 * 5. Configurar pantalla de consentimiento
 * 6. Obtener client_id, client_secret
 * 7. Usar OAuth flow para obtener refresh_token
 * 
 * OUTLOOK CALENDAR:
 * 1. Ir a Azure Portal (https://portal.azure.com/)
 * 2. Registrar una aplicación en Azure AD
 * 3. Configurar permisos para Microsoft Graph (Calendars.ReadWrite)
 * 4. Obtener client_id, client_secret, tenant_id
 * 5. Usar OAuth flow para obtener refresh_token
 */
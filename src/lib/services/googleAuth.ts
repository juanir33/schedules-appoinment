import { google } from 'googleapis';

// Configuración OAuth 2.0 para Google Calendar
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Scopes necesarios para Google Calendar
const SCOPES = [
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/calendar.readonly'
];

/**
 * Genera la URL de autorización para que el usuario autorice la aplicación
 * @param state - Parámetro de estado para seguridad (opcional)
 * @returns URL de autorización de Google
 */
export function getAuthUrl(state?: string): string {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline', // Importante: para obtener refresh_token
    scope: SCOPES,
    include_granted_scopes: true,
    state: state || 'default_state'
  });
  
  return authUrl;
}

/**
 * Intercambia el código de autorización por tokens de acceso
 * @param code - Código de autorización recibido de Google
 * @returns Objeto con access_token y refresh_token
 */
export async function getTokensFromCode(code: string) {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    return tokens;
  } catch (error) {
    console.error('Error al obtener tokens:', error);
    throw new Error('Error al intercambiar código por tokens');
  }
}

/**
 * Obtiene un nuevo access_token usando el refresh_token
 * @param refreshToken - Refresh token almacenado
 * @returns Nuevo access_token
 */
export async function refreshAccessToken(refreshToken: string) {
  try {
    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });
    
    const { credentials } = await oauth2Client.refreshAccessToken();
    return credentials.access_token;
  } catch (error) {
    console.error('Error al refrescar token:', error);
    throw new Error('Error al refrescar access token');
  }
}

/**
 * Configura las credenciales en el cliente OAuth
 * @param accessToken - Access token válido
 * @param refreshToken - Refresh token (opcional)
 */
export function setCredentials(accessToken: string, refreshToken?: string) {
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  });
}

/**
 * Obtiene el cliente OAuth configurado
 * @returns Cliente OAuth2 de Google
 */
export function getOAuth2Client() {
  return oauth2Client;
}

/**
 * Verifica si las credenciales están configuradas y son válidas
 * @returns true si las credenciales están configuradas
 */
export function hasValidCredentials(): boolean {
  const credentials = oauth2Client.credentials;
  return !!(credentials.access_token || credentials.refresh_token);
}
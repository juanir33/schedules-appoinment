import { NextRequest, NextResponse } from 'next/server';
import { getTokensFromCode } from '../../../../../lib/services/googleAuth';
import { verifyCalendarAccess } from '../../../../../lib/services/googleCalendar';
import { updateBusinessSettings, getBusinessSettings, createOrUpdateBusinessSettings } from '../../../../../lib/firestore/businessSettings/businessSettings';
import { cookies } from 'next/headers';
import { GoogleCalendarConfig } from '../../../../../types/models.type';

/**
 * GET /api/auth/google/callback
 * Maneja el callback de Google OAuth después de la autorización
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    // Verificar si hubo un error en la autorización
    if (error) {
      console.error('Error en autorización OAuth:', error);
      return NextResponse.redirect(
        new URL('/admin/settings?error=authorization_denied', request.url)
      );
    }

    // Verificar que se recibió el código
    if (!code) {
      return NextResponse.redirect(
        new URL('/admin/settings?error=missing_code', request.url)
      );
    }

    // Verificar el estado para prevenir CSRF
    const cookieStore = await cookies();
    const storedState = cookieStore.get('google_oauth_state')?.value;
    
    if (!storedState || storedState !== state) {
      console.error('Estado OAuth inválido');
      return NextResponse.redirect(
        new URL('/admin/settings?error=invalid_state', request.url)
      );
    }

    // Limpiar la cookie del estado
    cookieStore.delete('google_oauth_state');

    // Intercambiar código por tokens
    const tokens = await getTokensFromCode(code);
    console.log('Tokens recibidos:', { 
      hasAccessToken: !!tokens.access_token, 
      hasRefreshToken: !!tokens.refresh_token,
      tokenKeys: Object.keys(tokens)
    });
    
    if (!tokens.access_token) {
      console.error('No se recibió access_token válido');
      return NextResponse.redirect(
        new URL('/admin/settings?error=invalid_tokens', request.url)
      );
    }

    // Verificar acceso al calendario
    const hasAccess = await verifyCalendarAccess(
      tokens.access_token,
      tokens.refresh_token || undefined
    );

    if (!hasAccess) {
      console.error('No se pudo verificar acceso al calendario');
      return NextResponse.redirect(
        new URL('/admin/settings?error=calendar_access_denied', request.url)
      );
    }

    // Obtener configuración actual del negocio
    const businessSettings = await getBusinessSettings('default');
    
    if (!businessSettings) {
      console.error('No se encontró configuración del negocio');
      return NextResponse.redirect(
        new URL('/admin/settings?error=business_not_found', request.url)
      );
    }

    // Crear configuración de Google Calendar
    const googleConfig: GoogleCalendarConfig = {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      refreshToken: tokens.refresh_token || '',
      accessToken: tokens.access_token,
      tokenExpiresAt: tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : undefined,
      calendarId: 'primary',
      redirectUri: process.env.GOOGLE_REDIRECT_URI,
      authorizedAt: new Date().toISOString()
    };

    // Actualizar configuración del negocio con la integración de calendario
    const updatedSettings = {
      ...businessSettings,
      calendarIntegration: {
        id: businessSettings.calendarIntegration?.id || `cal_${Date.now()}`,
        businessId: businessSettings.id,
        provider: 'google' as const,
        enabled: true,
        config: googleConfig,
        createdAt: businessSettings.calendarIntegration?.createdAt || new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      updatedAt: new Date().toISOString()
    };

    // Guardar en Firestore
    try {
      await createOrUpdateBusinessSettings(updatedSettings.id, updatedSettings);
      console.log('✅ Configuración de Google Calendar guardada exitosamente en Firestore');
    } catch (firestoreError) {
      console.error('❌ Error al guardar en Firestore:', firestoreError);
      throw new Error('Error al guardar configuración en base de datos');
    }

    // Redirigir al panel de administración con éxito
    return NextResponse.redirect(
      new URL('/admin/settings?success=calendar_connected', request.url)
    );

  } catch (error) {
    console.error('Error en callback OAuth:', error);
    return NextResponse.redirect(
      new URL('/admin/settings?error=callback_error', request.url)
    );
  }
}
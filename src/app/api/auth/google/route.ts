import { NextRequest, NextResponse } from 'next/server';
import { getAuthUrl } from '../../../../lib/services/googleAuth';
import { cookies } from 'next/headers';
import { randomUUID } from 'crypto';

/**
 * GET /api/auth/google
 * Inicia el flujo de autorización OAuth 2.0 con Google
 */
export async function GET(request: NextRequest) {
  try {
    // Verificar que las variables de entorno estén configuradas
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Credenciales de Google no configuradas' },
        { status: 500 }
      );
    }

    // Generar un estado único para seguridad (previene CSRF)
    const state = randomUUID();
    
    // Guardar el estado en una cookie segura
    const cookieStore = await cookies();
    cookieStore.set('google_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutos
      path: '/'
    });

    // Generar URL de autorización
    const authUrl = getAuthUrl(state);

    // Redirigir al usuario a Google para autorización
    return NextResponse.redirect(authUrl);
    
  } catch (error) {
    console.error('Error al iniciar autorización OAuth:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/auth/google
 * Endpoint alternativo para obtener la URL de autorización sin redirección
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar que las variables de entorno estén configuradas
    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
      return NextResponse.json(
        { error: 'Credenciales de Google no configuradas' },
        { status: 500 }
      );
    }

    // Generar un estado único para seguridad
    const state = randomUUID();
    
    // Guardar el estado en una cookie segura
    const cookieStore = await cookies();
    cookieStore.set('google_oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 600, // 10 minutos
      path: '/'
    });

    // Generar URL de autorización
    const authUrl = getAuthUrl(state);

    // Devolver la URL para que el frontend pueda manejar la redirección
    return NextResponse.json({
      authUrl,
      message: 'URL de autorización generada exitosamente'
    });
    
  } catch (error) {
    console.error('Error al generar URL de autorización:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/src/lib/firebase/firebaseAdmin';

interface SetClaimsRequest {
  email: string;
  isAdmin: boolean;
}

interface FirebaseError {
  code?: string;
  message: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verificar que el usuario actual esté autenticado
    const authorization = request.headers.get('authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      );
    }

    const idToken = authorization.split('Bearer ')[1];
    
    // Verificar el token y obtener los claims del usuario actual
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Verificar que el usuario actual sea administrador
    if (!decodedToken.admin) {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo administradores pueden asignar roles.' },
        { status: 403 }
      );
    }

    // Obtener datos del request
    const { email, isAdmin }: SetClaimsRequest = await request.json();
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido' },
        { status: 400 }
      );
    }

    // Buscar usuario por email
    const targetUser = await adminAuth.getUserByEmail(email);
    
    // Asignar custom claims
    await adminAuth.setCustomUserClaims(targetUser.uid, {
      admin: isAdmin
    });

    return NextResponse.json({
      success: true,
      message: `Rol ${isAdmin ? 'asignado' : 'removido'} exitosamente para ${email}`,
      user: {
        uid: targetUser.uid,
        email: targetUser.email,
        admin: isAdmin
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const errorCode = (error as FirebaseError)?.code;
    console.error('Error al asignar custom claims:', errorMessage);
    
    if (errorCode === 'auth/user-not-found') {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }
    
    if (errorCode === 'auth/id-token-expired') {
      return NextResponse.json(
        { error: 'Token expirado' },
        { status: 401 }
      );
    }
    
    if (errorCode === 'auth/invalid-id-token') {
      return NextResponse.json(
        { error: 'Token inválido' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}

// Endpoint para verificar claims de un usuario
export async function GET(request: NextRequest) {
  try {
    const authorization = request.headers.get('authorization');
    
    if (!authorization || !authorization.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      );
    }

    const idToken = authorization.split('Bearer ')[1];
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (!email) {
      return NextResponse.json(
        { error: 'Email es requerido como parámetro de consulta' },
        { status: 400 }
      );
    }

    const decodedToken = await adminAuth.verifyIdToken(idToken);
    
    // Solo administradores pueden verificar claims de otros usuarios
    if (!decodedToken.admin) {
      return NextResponse.json(
        { error: 'Acceso denegado. Solo administradores pueden verificar roles.' },
        { status: 403 }
      );
    }

    const targetUser = await adminAuth.getUserByEmail(email);
    const userRecord = await adminAuth.getUser(targetUser.uid);

    return NextResponse.json({
      success: true,
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        customClaims: userRecord.customClaims || {},
        isAdmin: !!userRecord.customClaims?.admin
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
    const errorCode = (error as FirebaseError)?.code;
    console.error('Error al verificar custom claims:', errorMessage);
    
    if (errorCode === 'auth/user-not-found') {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
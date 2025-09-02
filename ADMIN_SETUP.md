# Configuración de Roles de Administrador

## Configurar Custom Claims de Firebase

Para asignar roles de administrador, necesitas configurar custom claims en Firebase. Esto debe hacerse desde el servidor usando Firebase Admin SDK.

### Opción 1: Firebase Functions (Recomendado)

Crea una función en Firebase Functions para gestionar roles:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

exports.setAdminClaim = functions.https.onCall(async (data, context) => {
  // Verificar que el usuario actual es admin
  if (!context.auth || !context.auth.token.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Solo admins pueden asignar roles');
  }
  
  const { email, isAdmin } = data;
  
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: isAdmin });
    return { success: true, message: `Rol actualizado para ${email}` };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});
```

### Opción 2: Script Local (Para desarrollo)

1. Instala Firebase Admin SDK:
```bash
npm install firebase-admin
```

2. Descarga las credenciales de servicio desde Firebase Console:
   - Ve a Configuración del proyecto > Cuentas de servicio
   - Genera una nueva clave privada
   - Guarda el archivo JSON en tu proyecto

3. Crea un script para asignar roles:

```javascript
const admin = require('firebase-admin');
const serviceAccount = require('./path/to/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function setAdminClaim(email) {
  try {
    const user = await admin.auth().getUserByEmail(email);
    await admin.auth().setCustomUserClaims(user.uid, { admin: true });
    console.log(`Admin role assigned to ${email}`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Usar la función
setAdminClaim('admin@ejemplo.com');
```

### Opción 3: Firebase Console (Manual)

Puedes usar la Firebase CLI para asignar custom claims:

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Autenticarse
firebase login

# Usar el emulador de autenticación para testing
firebase emulators:start --only auth
```

## API Endpoint para Gestión de Claims

Se ha creado un endpoint API para gestionar los custom claims de forma programática:

### Endpoint: `/api/admin/set-claims`

#### POST - Asignar/Remover Claims
```bash
curl -X POST http://localhost:3000/api/admin/set-claims \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN" \
  -d '{
    "email": "usuario@ejemplo.com",
    "claims": {
      "admin": true
    }
  }'
```

#### GET - Verificar Claims
```bash
curl -X GET "http://localhost:3000/api/admin/set-claims?email=usuario@ejemplo.com" \
  -H "Authorization: Bearer YOUR_FIREBASE_ID_TOKEN"
```

### Página de Gestión de Usuarios

Se ha creado una interfaz web para gestionar usuarios en `/admin/users` que permite:

- ✅ Asignar roles de administrador
- ✅ Remover roles de administrador  
- ✅ Buscar información de usuarios
- ✅ Ver el estado actual de los custom claims

## Verificar la Configuración

Después de asignar el rol de admin a un usuario:

1. El usuario debe cerrar sesión y volver a iniciar sesión
2. El token se actualizará con los nuevos custom claims
3. La aplicación detectará automáticamente el rol de admin
4. **Prueba la gestión de usuarios** en `/admin/users`

## Seguridad

- Los custom claims solo pueden ser modificados desde el servidor
- Nunca expongas las credenciales de servicio en el frontend
- Implementa validaciones adicionales en las funciones de Firebase
- Considera usar Firebase Security Rules para proteger datos sensibles

## Troubleshooting

### El usuario no ve las páginas de admin después de asignar el rol

1. Verifica que el usuario haya cerrado sesión y vuelto a iniciar
2. Comprueba que los custom claims se asignaron correctamente
3. Revisa la consola del navegador para errores

### Error de permisos al asignar roles

1. Verifica que las credenciales de servicio sean correctas
2. Asegúrate de que el proyecto de Firebase sea el correcto
3. Comprueba que el usuario existe en Firebase Authentication

## Ejemplo de Uso

Para asignar rol de admin a un usuario específico:

```bash
# Si usas el script local
node scripts/setAdminClaim.js admin@ejemplo.com set

# Para verificar los claims
node scripts/setAdminClaim.js admin@ejemplo.com check

# Para remover el rol
node scripts/setAdminClaim.js admin@ejemplo.com remove
```
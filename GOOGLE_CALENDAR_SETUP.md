# Configuración de Google Calendar para el Sistema de Reservas

Esta guía te ayudará a configurar Google Calendar para que funcione con tu sistema de reservas del salón de belleza.

## Paso 1: Configurar Google Cloud Platform

### 1.1 Crear un Proyecto en Google Cloud

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Haz clic en "Crear Proyecto" o selecciona un proyecto existente
3. Asigna un nombre a tu proyecto (ej: "salon-reservas")
4. Anota el **Project ID** que se genera automáticamente

### 1.2 Habilitar Google Calendar API

1. En Google Cloud Console, ve a "APIs y servicios" > "Biblioteca"
2. Busca "Google Calendar API"
3. Haz clic en "Google Calendar API" y luego en "HABILITAR"

### 1.3 Configurar Pantalla de Consentimiento OAuth

1. Ve a "APIs y servicios" > "Pantalla de consentimiento OAuth"
2. Selecciona "Externo" como tipo de usuario
3. Completa la información requerida:
   - **Nombre de la aplicación**: "Sistema de Reservas - [Nombre del Salón]"
   - **Email de soporte del usuario**: tu email
   - **Logotipo de la aplicación**: (opcional)
   - **Dominios autorizados**: tu dominio (ej: `tusalon.com`)
   - **Email de contacto del desarrollador**: tu email
4. En "Alcances", agrega:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
5. Guarda y continúa

### 1.4 Crear Credenciales OAuth 2.0

1. Ve a "APIs y servicios" > "Credenciales"
2. Haz clic en "+ CREAR CREDENCIALES" > "ID de cliente OAuth 2.0"
3. Selecciona "Aplicación web" como tipo de aplicación
4. Configura:
   - **Nombre**: "Cliente Web - Sistema de Reservas"
   - **Orígenes de JavaScript autorizados**:
     - `http://localhost:3000` (para desarrollo)
     - `https://tu-dominio.com` (para producción)
   - **URIs de redirección autorizados**:
     - `http://localhost:3000/api/auth/google/callback` (para desarrollo)
     - `https://tu-dominio.com/api/auth/google/callback` (para producción)
5. Haz clic en "CREAR"
6. **IMPORTANTE**: Guarda el **Client ID** y **Client Secret** que se muestran

## Paso 2: Configurar Variables de Entorno

Crea o actualiza tu archivo `.env.local` con las siguientes variables:

```env
# Google Calendar Configuration
GOOGLE_CLIENT_ID=tu_client_id_aqui
GOOGLE_CLIENT_SECRET=tu_client_secret_aqui
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback

# Para producción, cambia la URI:
# GOOGLE_REDIRECT_URI=https://tu-dominio.com/api/auth/google/callback
```

## Paso 3: Autorizar la Aplicación

### 3.1 Conectar Google Calendar desde el Panel Admin

1. Inicia tu aplicación: `npm run dev`
2. Ve al panel de administración: `http://localhost:3000/admin/settings`
3. Haz clic en la pestaña "Google Calendar"
4. Haz clic en "Conectar Google Calendar"
5. Serás redirigido a Google para autorizar la aplicación
6. Acepta los permisos solicitados
7. Serás redirigido de vuelta a tu aplicación

### 3.2 Verificar la Conexión

Después de la autorización exitosa:
- Verás el estado "Conectado" en el panel de administración
- El email de la cuenta autorizada se mostrará
- Las nuevas reservas crearán automáticamente eventos en Google Calendar

## Paso 4: Probar la Integración

### 4.1 Crear una Reserva de Prueba

1. Ve a la página de reservas: `http://localhost:3000/reservation`
2. Crea una nueva reserva con:
   - Cliente de prueba
   - Servicio disponible
   - Fecha y hora futuras
   - Email del cliente (opcional pero recomendado)
3. Confirma la reserva

### 4.2 Verificar en Google Calendar

1. Ve a [Google Calendar](https://calendar.google.com)
2. Verifica que el evento se haya creado automáticamente
3. El evento debe incluir:
   - Título: "[Nombre del Servicio] - [Nombre del Cliente]"
   - Descripción con detalles de la reserva
   - Hora correcta
   - Invitación al cliente (si se proporcionó email)

### 4.3 Probar Cancelación

1. Cancela la reserva desde el panel de administración o desde la vista del cliente
2. Verifica que el evento se elimine automáticamente de Google Calendar

## Solución de Problemas

### Error: "redirect_uri_mismatch"
- Verifica que las URIs de redirección en Google Cloud Console coincidan exactamente con las configuradas en tu aplicación
- Asegúrate de incluir tanto HTTP (desarrollo) como HTTPS (producción)

### Error: "invalid_client"
- Verifica que `GOOGLE_CLIENT_ID` y `GOOGLE_CLIENT_SECRET` estén correctamente configurados en `.env.local`
- Asegúrate de que no haya espacios extra en las variables de entorno

### Error: "insufficient_scope"
- Verifica que hayas agregado los alcances correctos en la pantalla de consentimiento OAuth
- Intenta desconectar y volver a conectar Google Calendar

### Los eventos no se crean en Google Calendar
- Verifica que Google Calendar esté conectado en el panel de administración
- Revisa los logs de la consola para errores específicos
- Asegúrate de que la API de Google Calendar esté habilitada

## Configuración para Producción

### Actualizar Variables de Entorno
```env
GOOGLE_REDIRECT_URI=https://tu-dominio.com/api/auth/google/callback
```

### Actualizar Google Cloud Console
1. Agrega tu dominio de producción a "Orígenes de JavaScript autorizados"
2. Agrega la URI de callback de producción a "URIs de redirección autorizados"
3. Si es necesario, actualiza la pantalla de consentimiento con tu dominio de producción

## Seguridad

- **NUNCA** compartas tu `GOOGLE_CLIENT_SECRET`
- Mantén tu archivo `.env.local` fuera del control de versiones
- Revisa regularmente los permisos otorgados en tu cuenta de Google
- Considera usar diferentes proyectos de Google Cloud para desarrollo y producción

## Soporte

Si encuentras problemas:
1. Revisa los logs de la aplicación
2. Verifica la configuración en Google Cloud Console
3. Asegúrate de que todas las variables de entorno estén correctamente configuradas
4. Consulta la [documentación oficial de Google Calendar API](https://developers.google.com/calendar/api/guides/overview)
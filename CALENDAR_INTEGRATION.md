# Integración de Calendario Parametrizable

Este documento explica la nueva arquitectura de integración de calendario que permite a múltiples clientes/negocios configurar sus propias integraciones de calendario de manera independiente.

## Problema Anterior

La implementación anterior tenía las credenciales de Google Calendar hardcodeadas en variables de entorno, lo que significaba:
- Un solo calendario para todos los clientes
- No escalable para múltiples negocios
- Configuración rígida y no parametrizable

## Nueva Arquitectura

### 1. Modelos de Datos

#### CalendarSettings
```typescript
interface CalendarSettings {
  id: string;
  businessId: string; // ID del negocio/cliente
  provider: 'google' | 'outlook' | 'none';
  enabled: boolean;
  config: GoogleCalendarConfig | OutlookCalendarConfig | null;
  createdAt: string;
  updatedAt: string;
}
```

#### GoogleCalendarConfig
```typescript
interface GoogleCalendarConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  calendarId: string;
  redirectUri?: string;
}
```

#### OutlookCalendarConfig
```typescript
interface OutlookCalendarConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  calendarId: string;
  tenantId: string;
}
```

### 2. Servicio de Calendario

La clase `CalendarService` maneja múltiples proveedores de calendario:

```typescript
const calendarService = new CalendarService(businessId);
await calendarService.initialize();

const event = await calendarService.createEvent({
  summary: 'Reunión con cliente',
  startDateTime: '2024-01-15T10:00:00Z',
  endDateTime: '2024-01-15T11:00:00Z'
});
```

### 3. Funciones de Firestore

#### Crear/Actualizar Configuración
```typescript
import { createOrUpdateCalendarSettings } from '@/src/lib/firestore/calendarSettings/calendarSettings';

const settingsId = await createOrUpdateCalendarSettings(
  'business-123',
  'google',
  googleConfig,
  true // enabled
);
```

#### Obtener Configuración
```typescript
import { getCalendarSettingsByBusiness } from '@/src/lib/firestore/calendarSettings/calendarSettings';

const settings = await getCalendarSettingsByBusiness('business-123');
```

## Configuración por Proveedor

### Google Calendar

1. **Google Cloud Console**
   - Crear proyecto en https://console.cloud.google.com/
   - Habilitar Google Calendar API
   - Crear credenciales OAuth 2.0
   - Configurar pantalla de consentimiento

2. **Obtener Credenciales**
   ```javascript
   const googleConfig = {
     clientId: 'your-client-id.apps.googleusercontent.com',
     clientSecret: 'your-client-secret',
     refreshToken: 'your-refresh-token',
     calendarId: 'primary' // o ID específico
   };
   ```

3. **Configurar en la App**
   ```typescript
   await createOrUpdateCalendarSettings(
     businessId,
     'google',
     googleConfig,
     true
   );
   ```

### Outlook Calendar

1. **Azure Portal**
   - Registrar aplicación en https://portal.azure.com/
   - Configurar permisos Microsoft Graph (Calendars.ReadWrite)
   - Obtener client_id, client_secret, tenant_id

2. **Obtener Credenciales**
   ```javascript
   const outlookConfig = {
     clientId: 'your-client-id',
     clientSecret: 'your-client-secret',
     refreshToken: 'your-refresh-token',
     calendarId: 'primary',
     tenantId: 'your-tenant-id'
   };
   ```

3. **Configurar en la App**
   ```typescript
   await createOrUpdateCalendarSettings(
     businessId,
     'outlook',
     outlookConfig,
     true
   );
   ```

## Uso en la API de Reservas

La API de reservas ahora usa el servicio parametrizable:

```typescript
// En /api/reservations/route.ts
const businessId = "default"; // TODO: Obtener del contexto del usuario
const calendarService = await createCalendarService(businessId);

if (calendarService) {
  const calendarEvent = await calendarService.createEvent({
    summary: `${serviceData.name} - ${customer}`,
    description: `Reserva de ${serviceData.name} para ${customer}`,
    startDateTime: toISO(start),
    endDateTime: toISO(end),
  });
  
  googleEventId = calendarEvent?.id;
}
```

## Beneficios

1. **Escalabilidad**: Cada negocio puede tener su propia configuración
2. **Flexibilidad**: Soporte para múltiples proveedores (Google, Outlook)
3. **Seguridad**: Credenciales almacenadas de forma segura en Firestore
4. **Mantenibilidad**: Código más limpio y modular
5. **Configurabilidad**: Fácil habilitación/deshabilitación por negocio

## Próximos Pasos

1. **Contexto de Usuario**: Implementar sistema para obtener `businessId` del contexto del usuario autenticado
2. **UI de Configuración**: Crear interfaz de administración para configurar integraciones
3. **Validación**: Agregar validación de credenciales al configurar
4. **Logs**: Implementar logging detallado para debugging
5. **Tests**: Crear tests unitarios para el servicio de calendario

## Migración

Para migrar de la implementación anterior:

1. Crear configuración para el negocio por defecto:
   ```typescript
   await createOrUpdateCalendarSettings(
     'default',
     'google',
     {
       clientId: process.env.GOOGLE_CLIENT_ID!,
       clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
       refreshToken: process.env.GOOGLE_REFRESH_TOKEN!,
       calendarId: process.env.GOOGLE_CALENDAR_ID || 'primary'
     },
     true
   );
   ```

2. Remover variables de entorno una vez confirmado el funcionamiento
3. Actualizar documentación y procesos de configuración
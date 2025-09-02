import { adminDb } from "@/src/lib/firebase/firebaseAdmin";
import { CalendarSettings, GoogleCalendarConfig, OutlookCalendarConfig } from "@/src/types/models.type";

const COLLECTION_NAME = "calendarSettings";
const calendarSettingsCol = adminDb.collection(COLLECTION_NAME);

/**
 * Crear o actualizar configuración de calendario para un negocio
 */
export async function createOrUpdateCalendarSettings(
  businessId: string,
  provider: 'google' | 'outlook' | 'none',
  config: GoogleCalendarConfig | OutlookCalendarConfig | null,
  enabled: boolean = true
): Promise<string> {
  const now = new Date().toISOString();
  
  // Buscar configuración existente
  const existingQuery = await calendarSettingsCol
    .where("businessId", "==", businessId)
    .limit(1)
    .get();
  
  const settingsData: Partial<CalendarSettings> = {
    businessId,
    provider,
    enabled,
    config,
    updatedAt: now
  };
  
  if (!existingQuery.empty) {
    // Actualizar existente
    const docId = existingQuery.docs[0].id;
    await calendarSettingsCol.doc(docId).update(settingsData);
    return docId;
  } else {
    // Crear nuevo
    const newSettings: Omit<CalendarSettings, 'id'> = {
      ...settingsData as CalendarSettings,
      createdAt: now
    };
    const docRef = await calendarSettingsCol.add(newSettings);
    return docRef.id;
  }
}

/**
 * Obtener configuración de calendario por businessId
 */
export async function getCalendarSettingsByBusiness(businessId: string): Promise<CalendarSettings | null> {
  const query = await calendarSettingsCol
    .where("businessId", "==", businessId)
    .where("enabled", "==", true)
    .limit(1)
    .get();
  
  if (query.empty) {
    return null;
  }
  
  const doc = query.docs[0];
  return {
    id: doc.id,
    ...doc.data()
  } as CalendarSettings;
}

/**
 * Listar todas las configuraciones de calendario
 */
export async function listCalendarSettings(): Promise<CalendarSettings[]> {
  const snapshot = await calendarSettingsCol.orderBy("createdAt", "desc").get();
  
  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as CalendarSettings[];
}

/**
 * Deshabilitar integración de calendario para un negocio
 */
export async function disableCalendarIntegration(businessId: string): Promise<void> {
  const query = await calendarSettingsCol
    .where("businessId", "==", businessId)
    .limit(1)
    .get();
  
  if (!query.empty) {
    const docId = query.docs[0].id;
    await calendarSettingsCol.doc(docId).update({
      enabled: false,
      updatedAt: new Date().toISOString()
    });
  }
}

/**
 * Eliminar configuración de calendario
 */
export async function deleteCalendarSettings(businessId: string): Promise<void> {
  const query = await calendarSettingsCol
    .where("businessId", "==", businessId)
    .get();
  
  const batch = adminDb.batch();
  query.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
}
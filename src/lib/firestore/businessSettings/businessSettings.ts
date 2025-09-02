import { db } from "@/src/lib/firebase/firebase";
import { collection, doc, getDoc, setDoc, updateDoc, getDocs, query, where, deleteDoc } from "firebase/firestore";
import { BusinessSettings } from "@/src/types/models.type";

const COLLECTION_NAME = "businessSettings";

/**
 * Crear o actualizar configuraciones del negocio
 */
export async function createOrUpdateBusinessSettings(
  businessId: string,
  settings: Partial<BusinessSettings>
): Promise<BusinessSettings> {
  const docRef = doc(db, COLLECTION_NAME, businessId);
  const now = new Date().toISOString();
  
  // Verificar si ya existe
  const existingDoc = await getDoc(docRef);
  
  const businessSettings: BusinessSettings = {
    id: businessId,
    name: settings.name || "Mi Negocio",
    description: settings.description,
    email: settings.email || "",
    phone: settings.phone,
    website: settings.website,
    address: settings.address || {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: ""
    },
    timezone: settings.timezone || "America/Mexico_City",
    businessHours: settings.businessHours || {
      monday: { enabled: true, openTime: "09:00", closeTime: "18:00" },
      tuesday: { enabled: true, openTime: "09:00", closeTime: "18:00" },
      wednesday: { enabled: true, openTime: "09:00", closeTime: "18:00" },
      thursday: { enabled: true, openTime: "09:00", closeTime: "18:00" },
      friday: { enabled: true, openTime: "09:00", closeTime: "18:00" },
      saturday: { enabled: true, openTime: "09:00", closeTime: "16:00" },
      sunday: { enabled: false, openTime: "09:00", closeTime: "16:00" }
    },
    reservationSettings: settings.reservationSettings || {
      maxAdvanceDays: 30,
      minAdvanceHours: 2,
      allowCancellation: true,
      cancellationHours: 24,
      requireConfirmation: false
    },
    notificationSettings: settings.notificationSettings || {
      emailNotifications: true,
      smsNotifications: false,
      reminderHours: 24
    },
    calendarIntegration: settings.calendarIntegration || null,
    createdAt: existingDoc.exists() ? existingDoc.data().createdAt : now,
    updatedAt: now,
    active: settings.active !== undefined ? settings.active : true
  }

  await setDoc(docRef, businessSettings);
  return businessSettings;
}

/**
 * Obtener configuraciones del negocio por ID
 */
export async function getBusinessSettings(businessId: string): Promise<BusinessSettings | null> {
  const docRef = doc(db, COLLECTION_NAME, businessId);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as BusinessSettings;
  }
  
  return null;
}

/**
 * Obtener configuraciones del negocio por email
 */
export async function getBusinessSettingsByEmail(email: string): Promise<BusinessSettings | null> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("email", "==", email),
    where("active", "==", true)
  );
  
  const querySnapshot = await getDocs(q);
  
  if (!querySnapshot.empty) {
    const doc = querySnapshot.docs[0];
    return doc.data() as BusinessSettings;
  }
  
  return null;
}

/**
 * Listar todas las configuraciones de negocios activos
 */
export async function listActiveBusinessSettings(): Promise<BusinessSettings[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where("active", "==", true)
  );
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data() as BusinessSettings);
}

/**
 * Actualizar configuraciones específicas del negocio
 */
export async function updateBusinessSettings(
  businessId: string,
  updates: Partial<BusinessSettings>
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, businessId);
  const updateData = {
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  await updateDoc(docRef, updateData);
}

/**
 * Actualizar horarios de atención
 */
export async function updateBusinessHours(
  businessId: string,
  businessHours: BusinessSettings['businessHours']
): Promise<void> {
  await updateBusinessSettings(businessId, { businessHours });
}

/**
 * Actualizar configuraciones de reservas
 */
export async function updateReservationSettings(
  businessId: string,
  reservationSettings: BusinessSettings['reservationSettings']
): Promise<void> {
  await updateBusinessSettings(businessId, { reservationSettings });
}

/**
 * Actualizar configuraciones de notificaciones
 */
export async function updateNotificationSettings(
  businessId: string,
  notificationSettings: BusinessSettings['notificationSettings']
): Promise<void> {
  await updateBusinessSettings(businessId, { notificationSettings });
}

/**
 * Deshabilitar negocio (soft delete)
 */
export async function disableBusinessSettings(businessId: string): Promise<void> {
  await updateBusinessSettings(businessId, { active: false });
}

/**
 * Eliminar configuraciones del negocio (hard delete)
 */
export async function deleteBusinessSettings(businessId: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, businessId);
  await deleteDoc(docRef);
}

/**
 * Verificar si un negocio está configurado y activo
 */
export async function isBusinessConfigured(businessId: string): Promise<boolean> {
  const settings = await getBusinessSettings(businessId);
  return settings !== null && settings.active && settings.email !== "";
}

/**
 * Obtener configuraciones por defecto para un nuevo negocio
 */
export function getDefaultBusinessSettings(businessId: string, email: string): Partial<BusinessSettings> {
  return {
    name: "Mi Negocio",
    email: email,
    timezone: "America/Mexico_City",
    businessHours: {
      monday: { enabled: true, openTime: "09:00", closeTime: "18:00" },
      tuesday: { enabled: true, openTime: "09:00", closeTime: "18:00" },
      wednesday: { enabled: true, openTime: "09:00", closeTime: "18:00" },
      thursday: { enabled: true, openTime: "09:00", closeTime: "18:00" },
      friday: { enabled: true, openTime: "09:00", closeTime: "18:00" },
      saturday: { enabled: true, openTime: "09:00", closeTime: "16:00" },
      sunday: { enabled: false, openTime: "09:00", closeTime: "16:00" }
    },
    reservationSettings: {
      maxAdvanceDays: 30,
      minAdvanceHours: 2,
      allowCancellation: true,
      cancellationHours: 24,
      requireConfirmation: false
    },
    notificationSettings: {
      emailNotifications: true,
      smsNotifications: false,
      reminderHours: 24
    },
    address: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "México"
    },
    active: true
  };
}
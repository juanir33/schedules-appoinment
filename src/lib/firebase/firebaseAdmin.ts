import * as admin from "firebase-admin";

if (!admin.apps.length) {
  try {
  
    admin.initializeApp({
      credential: admin.credential.cert('src/lib/firebase/schedules.json'),
    });
  } catch (error) {
    console.error('Error initializing Firebase Admin:', error);
    throw error;
  }
}

export const adminDb = admin.firestore();
export const adminAuth = admin.auth();

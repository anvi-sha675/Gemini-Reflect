import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
  });
}

export const auth = admin.auth();
export const firestore = admin.firestore();
export default admin;

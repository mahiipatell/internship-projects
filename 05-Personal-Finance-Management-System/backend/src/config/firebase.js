/**
 * Firebase Admin SDK — used server-side only to verify ID tokens issued by
 * the Firebase client SDK (email/password + Google Sign-In both issue the
 * same kind of ID token, so verification here is identical for both).
 *
 * Requires a Firebase service account. In the Firebase Console:
 * Project Settings → Service Accounts → Generate new private key.
 * Copy projectId / clientEmail / privateKey into your .env (see .env.example).
 */
const admin = require('firebase-admin');
require('dotenv').config();

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // .env stores the key with literal "\n" sequences; convert back to
      // real newlines or the PEM key fails to parse.
      privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
    }),
  });
}

module.exports = admin;

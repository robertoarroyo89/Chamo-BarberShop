import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Acceso a Firestore desde el servidor.
 *
 * Se usa el SDK de administrador —nunca el cliente— por dos motivos:
 *
 *   1. Las reglas de Firestore pueden quedarse cerradas a cal y canto
 *      (ver firestore.rules): nadie escribe en la colección de citas salvo
 *      este servidor. Con el SDK de cliente habría que abrir la escritura al
 *      público y confiar en las reglas para todo.
 *   2. Los huecos ocupados no se filtran al navegador. Con el SDK de cliente,
 *      cualquiera podría leerse la agenda entera con los teléfonos de los
 *      clientes.
 *
 * Si faltan las credenciales, devuelve null en lugar de reventar: la web
 * funciona igual y el formulario de reserva ofrece WhatsApp. Así el proyecto
 * se despliega y se ve desde el primer minuto, antes de tener Firebase.
 */

/** Se memoriza el resultado, incluido el "no configurado". */
let cached: Firestore | null | undefined;

export function getDb(): Firestore | null {
  if (cached !== undefined) return cached;

  const projectId = process.env.FIREBASE_PROJECT_ID;

  /*
   * Emulador local.
   *
   * Con FIRESTORE_EMULATOR_HOST definido, el SDK habla con el emulador y no
   * hace falta ninguna credencial. Sirve para desarrollar y probar la agenda
   * —incluida la prevención de solapamientos— sin tocar datos reales de
   * clientes. Ver README.md → "Probar las reservas en local".
   */
  if (process.env.FIRESTORE_EMULATOR_HOST) {
    const app =
      getApps()[0] ??
      initializeApp({ projectId: projectId ?? "demo-el-chamo" });
    cached = getFirestore(app);
    return cached;
  }
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // En los paneles de variables de entorno los saltos de línea de la clave
  // viajan escapados; hay que devolverlos a su forma real.
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    cached = null;
    return null;
  }

  try {
    const app =
      getApps()[0] ??
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    cached = getFirestore(app);
    return cached;
  } catch (error) {
    // Credenciales presentes pero mal formadas: se registra y se sigue en modo
    // degradado, sin tumbar la página entera.
    console.error("[firebase] No se ha podido inicializar Firestore:", error);
    cached = null;
    return null;
  }
}

/** true si el proyecto tiene agenda propia activa. */
export function isBookingConfigured(): boolean {
  return getDb() !== null;
}

/** Colección donde viven las citas. */
export const APPOINTMENTS = "citas";

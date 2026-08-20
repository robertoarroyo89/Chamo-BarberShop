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

/**
 * Limpia la clave privada de las formas en que suele llegar mal.
 *
 * Es el fallo más común al desplegar y el más difícil de diagnosticar, porque
 * `cert()` se limita a lanzar un error opaco. Se cubren tres casos:
 *
 *   · Comillas envolviendo el valor. En un archivo `.env` hacen falta, pero en
 *     el panel de Vercel se pega el valor pelado; si se copian las comillas del
 *     ejemplo, acaban dentro del texto de la clave.
 *   · Saltos de línea escapados como \n, que es como los guarda un `.env` de
 *     una sola línea.
 *   · Saltos de línea reales, que es como los guarda el panel de Vercel.
 *
 * Los dos últimos son válidos y hay que aceptar ambos.
 */
function normalisePrivateKey(raw: string | undefined): string | undefined {
  if (!raw) return undefined;

  let key = raw.trim();

  if (
    (key.startsWith('"') && key.endsWith('"')) ||
    (key.startsWith("'") && key.endsWith("'"))
  ) {
    key = key.slice(1, -1);
  }

  return key.replace(/\\n/g, "\n").trim();
}

/** Estado de la configuración. Nunca expone valores, solo si están bien. */
export interface FirebaseDiagnosis {
  projectId: "ok" | "falta";
  clientEmail: "ok" | "falta" | "formato";
  privateKey: "ok" | "falta" | "formato";
  /** Mensaje del SDK si las credenciales existen pero no sirven. */
  initError?: string;
}

let lastInitError: string | undefined;

/**
 * Revisa la configuración sin exponer secretos.
 *
 * Se muestra en el panel para que un despliegue mal configurado diga QUÉ falta,
 * en lugar de limitarse a no funcionar.
 */
export function diagnoseFirebase(): FirebaseDiagnosis {
  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = normalisePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

  // Se fuerza el intento de conexión para poder informar del error del SDK.
  getDb();

  return {
    projectId: projectId ? "ok" : "falta",
    clientEmail: !clientEmail
      ? "falta"
      : clientEmail.includes("@") &&
          clientEmail.endsWith(".iam.gserviceaccount.com")
        ? "ok"
        : "formato",
    privateKey: !privateKey
      ? "falta"
      : privateKey.includes("BEGIN PRIVATE KEY") &&
          privateKey.includes("END PRIVATE KEY")
        ? "ok"
        : "formato",
    initError: lastInitError,
  };
}

/** Se memoriza el resultado, incluido el "no configurado". */
let cached: Firestore | null | undefined;

export function getDb(): Firestore | null {
  if (cached !== undefined) return cached;

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();

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
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL?.trim();
  const privateKey = normalisePrivateKey(process.env.FIREBASE_PRIVATE_KEY);

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
    // Se guarda el mensaje —no el secreto— para poder mostrarlo en el panel.
    lastInitError =
      error instanceof Error
        ? error.message.slice(0, 200)
        : String(error).slice(0, 200);
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

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Acceso al panel interno de la barbería (/agenda).
 *
 * Deliberadamente sencillo: son tres personas compartiendo una contraseña, no
 * una plataforma con usuarios. Montar registro, recuperación de contraseña y
 * roles para esto sería carísimo de mantener y no daría más seguridad real.
 *
 * Lo que sí se hace bien:
 *   · La contraseña vive en una variable de entorno, nunca en el código.
 *   · La cookie no guarda la contraseña, sino una firma HMAC con caducidad, así
 *     que no se puede falsificar sin conocer el secreto.
 *   · Las comparaciones son en tiempo constante, para no filtrar información
 *     midiendo cuánto tarda en fallar.
 *   · La cookie es httpOnly y SameSite=Lax: no la puede leer JavaScript ni
 *     viaja en peticiones de terceros.
 */

const COOKIE = "el-chamo-agenda";
/** Doce horas: una jornada. Al día siguiente hay que volver a entrar. */
const SESSION_MS = 12 * 60 * 60 * 1000;

function secret(): string | null {
  const password = process.env.ADMIN_PASSWORD;
  // Se exige una longitud mínima: una contraseña de cuatro letras no protege
  // los teléfonos de los clientes.
  if (!password || password.length < 8) return null;
  return password;
}

/** true si el panel está habilitado en este despliegue. */
export function isAdminConfigured(): boolean {
  return secret() !== null;
}

function sign(expiresAt: number, key: string): string {
  return createHmac("sha256", key).update(`agenda:${expiresAt}`).digest("hex");
}

/** Comparación en tiempo constante de dos cadenas. */
function equals(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  // timingSafeEqual exige la misma longitud; se comprueba antes sin cortocircuito
  // que revele nada más que el tamaño.
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function checkPassword(candidate: unknown): boolean {
  const key = secret();
  if (!key || typeof candidate !== "string") return false;
  // Se comparan los resúmenes: así la longitud de la contraseña tampoco importa.
  const digest = (value: string) =>
    createHmac("sha256", "el-chamo").update(value).digest("hex");
  return equals(digest(candidate), digest(key));
}

/** Deja la sesión abierta en una cookie firmada. */
export async function startSession(): Promise<void> {
  const key = secret();
  if (!key) return;

  const expiresAt = Date.now() + SESSION_MS;
  const store = await cookies();

  store.set(COOKIE, `${expiresAt}.${sign(expiresAt, key)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: Math.floor(SESSION_MS / 1000),
  });
}

export async function endSession(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE);
}

/** true si quien pide la página tiene una sesión válida y sin caducar. */
export async function hasSession(): Promise<boolean> {
  const key = secret();
  if (!key) return false;

  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return false;

  const [stamp, signature] = raw.split(".");
  const expiresAt = Number(stamp);
  if (!Number.isFinite(expiresAt) || !signature) return false;
  if (Date.now() > expiresAt) return false;

  return equals(signature, sign(expiresAt, key));
}

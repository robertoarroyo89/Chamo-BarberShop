# El Chamo Barber Shop

Web y sistema de reservas de **El Chamo Barber Shop**, barbería en Burjassot
(Valencia). Una sola página pública, con agenda propia de citas y un panel
interno para el equipo.

- **Diseño**: cartel de calle. El rótulo de graffiti de la casa es el punto de
  partida: papel crema, filetes negros de 2 px, bloques de color planos (azul,
  amarillo y rojo del logo), sombras duras sin difuminar y trama de puntos.
  Incluye tema oscuro opcional.
- **Reservas**: agenda propia sobre Firestore. Cliente elige servicio, barbero,
  día y hora; puede cambiar o anular su cita sin registrarse.
- **Panel**: `/agenda`, protegido por contraseña, donde el equipo ve las citas
  con el teléfono del cliente a un toque.

---

## Stack

| Pieza         | Qué se usa                   | Por qué                                            |
| ------------- | ---------------------------- | -------------------------------------------------- |
| Framework     | Next.js 16 (App Router)      | Página estática + rutas de servidor para la agenda |
| Lenguaje      | TypeScript                   | —                                                  |
| Estilos       | Tailwind CSS 4               | Tokens de tema en CSS, sin configuración JS        |
| Iconos        | `lucide-react`               | Los de marca (WhatsApp, Instagram) son SVG propios |
| Base de datos | Firestore (`firebase-admin`) | Solo desde el servidor; reglas cerradas            |
| Analítica     | `@vercel/analytics`          | Sin cookies                                        |

Sin librería de animación: las apariciones son animaciones CSS ligadas al
scroll y las transiciones son `transform` + `box-shadow`. **JS inicial ≈ 189 kB
comprimido**, casi todo React y el runtime de Next.

No hay dependencias de más. Si algo se puede resolver con CSS, se resuelve con
CSS.

---

## Poner en marcha

```bash
npm install
npm run dev
```

En `http://localhost:3000`. **La web funciona sin configurar nada**: si no hay
credenciales de Firebase, la sección de reservas se sustituye por el botón de
WhatsApp. Así se puede ver y desplegar desde el primer minuto.

Otros comandos:

```bash
npm run build       # compilación de producción
npm run start       # servir la compilación
npm run typecheck   # TypeScript
npm run lint        # ESLint
```

---

## Dónde se edita cada cosa

**Todo el contenido del negocio está en un solo archivo: `src/data/business.ts`.**
Ningún componente repite un teléfono, un precio ni un horario.

| Qué quieres cambiar                      | Dónde                                             |
| ---------------------------------------- | ------------------------------------------------- |
| Teléfono, WhatsApp, Instagram, dirección | `src/data/business.ts` → `business`               |
| Horario de apertura                      | `src/data/business.ts` → `openingHours`           |
| Servicios y precios                      | `src/data/business.ts` → `services`               |
| Barberos                                 | `src/data/business.ts` → `barbers`                |
| Opiniones                                | `src/data/business.ts` → `reviews`                |
| Fotos de trabajos                        | `src/data/business.ts` → `works`                  |
| Valoración y nº de reseñas               | `src/data/business.ts` → `business.rating`        |
| Texto del mensaje de WhatsApp            | `src/data/business.ts` → `whatsapp.message`       |
| Frases de la cinta animada               | `src/lib/constants.ts` → `MARQUEE_ITEMS`          |
| Colores y tipografía                     | `src/app/globals.css` (bloque `@theme` y `:root`) |

El horario se consume desde un único sitio en: la sección «Visítanos», el pie,
el aviso de «abierto ahora», los datos estructurados de Google **y** el cálculo
de huecos libres. Cambiarlo ahí lo cambia todo a la vez.

### Cambiar o añadir fotos

1. Deja el archivo en `public/images/trabajos/`.
2. Añade una entrada en `works` (`src/data/business.ts`) con su ruta, su texto
   alternativo, su etiqueta y sus dimensiones reales.

La retícula se adapta sola: las plazas (tamaño, desnivel, giro y color de
sombra) se recorren en ciclo, así que da igual cuántas fotos haya.

El texto alternativo importa: describe el corte, no pongas «foto de barbería».

---

## Reservas

La agenda es propia. Cómo funciona:

1. Los huecos se generan a partir de `openingHours` en tramos de 30 minutos
   (`booking.slotMinutes`), respetando el corte de mediodía y sin ofrecer nada
   con menos de una hora de antelación (`booking.minNoticeMinutes`).
2. `GET /api/disponibilidad?date=…` cruza esos huecos con las citas guardadas y
   devuelve **solo** la hora y cuántos barberos quedan libres. Nunca salen de
   ahí nombres ni teléfonos.
3. `POST /api/reservas` guarda la cita dentro de una transacción, usando un
   identificador determinista (`fecha_hora_barbero`). Dos personas que
   confirmen en el mismo segundo no pueden quedarse las dos con el hueco: la
   segunda recibe un 409 y elige otra hora.
4. El cliente recibe una llave aleatoria que se guarda en su navegador y le
   permite **cambiar** o **anular** su cita sin cuenta ni contraseña. Sin esa
   llave nadie puede tocar la cita de otro.
5. Anular no borra: marca la cita como `cancelada`. Queda constancia y el hueco
   vuelve a ofrecerse al instante.

### Configurar Firebase

1. Crea un proyecto en [console.firebase.google.com](https://console.firebase.google.com)
   y activa **Firestore**.
2. Configuración del proyecto → Cuentas de servicio → «Generar nueva clave
   privada». Descarga el JSON.
3. Copia `.env.example` a `.env.local` y rellena `FIREBASE_PROJECT_ID`,
   `FIREBASE_CLIENT_EMAIL` y `FIREBASE_PRIVATE_KEY` con los valores de ese JSON.
   La clave privada va entre comillas y con los saltos de línea escapados
   (`\n`), en una sola línea.
4. Publica las reglas de seguridad:

   ```bash
   firebase deploy --only firestore:rules
   ```

   `firestore.rules` **deniega todo**. Es correcto: la agenda se gestiona
   únicamente desde el servidor con el SDK de administrador, que se salta las
   reglas. Así ningún navegador puede descargarse la agenda con los teléfonos
   de los clientes ni crear citas falsas.

No hace falta crear ningún índice compuesto: las consultas están escritas para
funcionar con los índices automáticos de Firestore.

### Probar las reservas en local

Con el emulador, sin tocar datos reales:

```bash
npx firebase emulators:start --only firestore --project demo-el-chamo
```

Y en otra terminal:

```bash
FIRESTORE_EMULATOR_HOST=127.0.0.1:8080 \
FIREBASE_PROJECT_ID=demo-el-chamo \
ADMIN_PASSWORD=una-contrasena-larga \
npm run dev
```

Con `FIRESTORE_EMULATOR_HOST` definido no se necesita ninguna credencial.
En local verás en consola un aviso `MetadataLookupWarning` del SDK de Google al
buscar credenciales que no existen: es inofensivo y no ocurre en producción.

### Protección contra abuso

`POST /api/reservas` lleva un freno de 20 peticiones por minuto y por IP. Vive
en memoria, así que en un entorno sin servidor solo cubre la instancia que
atiende la petición: **frena un bucle torpe, no un ataque en serio**. Si el
negocio empieza a recibir reservas basura, lo siguiente es activar el firewall
de Vercel o Firebase App Check.

### Importante: Booksy

La barbería **ya tiene una ficha activa en Booksy** aceptando reservas
(`business.booksyUrl`). Los dos calendarios no se ven entre sí, así que
mientras ambos estén abiertos **habrá citas solapadas**. Antes de anunciar esta
agenda hay que elegir una de las dos:

- **Quedarse con esta**: desactivar las reservas online en Booksy (el perfil
  puede seguir publicado como escaparate).
- **Quedarse con Booksy**: dejar `FIREBASE_*` sin rellenar. La sección de
  reservas pasa sola al botón de WhatsApp, y se puede enlazar `booksyUrl`.

---

## Panel de la barbería

En `/agenda`. Muestra las citas confirmadas por días, con servicio, barbero,
nombre del cliente y accesos directos para llamarle, escribirle por WhatsApp o
anular la cita.

Para activarlo, define `ADMIN_PASSWORD` (mínimo 8 caracteres). Sin esa variable
el panel se desactiva solo.

Es una contraseña compartida entre tres personas, no un sistema de usuarios: la
decisión es deliberada. Lo que sí se cuida es que la cookie de sesión sea
`httpOnly`, esté firmada con HMAC y caduque a las 12 horas, que las
comparaciones sean en tiempo constante, y que la página no se cachee ni se
indexe (`robots.txt` la excluye).

Para cambiar la contraseña, cambia la variable y vuelve a despliegar. Las
sesiones abiertas dejan de valer, porque la firma depende de ella.

---

## Desplegar en Vercel

1. Sube el repositorio a GitHub.
2. En Vercel, «Add New Project» → importa el repositorio. Next.js se detecta
   solo; no hay que tocar la configuración de compilación.
3. En «Environment Variables», añade `FIREBASE_PROJECT_ID`,
   `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` y `ADMIN_PASSWORD`.
4. Despliega.
5. Al conectar el dominio definitivo, cambia `business.url` en
   `src/data/business.ts`: de ahí salen el canónico, el sitemap, los datos
   estructurados y la imagen de previsualización.

La analítica de Vercel (`@vercel/analytics`) ya está instalada; basta activar
**Web Analytics** en el panel del proyecto. No usa cookies, así que no obliga a
poner aviso.

---

## Estructura

```
src/
  app/
    (sitio)/            grupo de rutas del sitio público
      layout.tsx        cabecera, atajo de reserva y datos estructurados
      page.tsx          la página
    agenda/             panel interno (fuera del grupo: sin cabecera pública)
    api/
      disponibilidad/   huecos libres de un día
      reservas/         crear cita  ·  reservas/cancelar/ anular
    globals.css         sistema de diseño completo
    layout.tsx          html, tipografías, script de tema
    opengraph-image.tsx imagen de previsualización, generada al compilar
  components/
    booking/            formulario de reserva
    navigation/         cabecera y menú móvil
    sections/           las secciones de la página, en orden
    ui/                 piezas reutilizables (botón, marco de foto, cinta…)
  data/business.ts      FUENTE ÚNICA DE VERDAD
  lib/
    booking.ts          generación y validación de huecos (compartido)
    hours.ts            horarios y fechas en Europe/Madrid
    businessClock.ts    reloj del negocio como almacén externo
    savedAppointment.ts la cita del cliente, en su navegador
    adminAuth.ts        sesión del panel
    firebaseAdmin.ts    acceso a Firestore desde el servidor
    seo.ts              metadatos y JSON-LD
```

Casi todo son componentes de servidor. Solo declaran `"use client"` las piezas
que de verdad necesitan interacción: formulario de reserva, cabecera, carrusel
de opiniones, cuadro de horarios, mapa e interruptor de tema.

---

## Decisiones que conviene conocer

**Las horas se calculan siempre en `Europe/Madrid`**, no en la zona del
visitante. Alguien consultando desde Londres ve el horario real de la barbería.

**El estado «abierto ahora» y el día de hoy solo se resuelven en el cliente**,
mediante `useSyncExternalStore`. El HTML del servidor sale sin ese dato y con el
hueco ya reservado, así que no hay desajustes de hidratación ni un «abierto»
equivocado servido desde caché.

**Las apariciones al desplazar son CSS, no JavaScript.** El estado oculto solo
se aplica donde el navegador sabe animar por scroll; donde no, el contenido sale
visible. Con el enfoque habitual de `IntersectionObserver`, si el observador no
llega a dispararse el texto se queda invisible para siempre — un problema de
accesibilidad y de SEO, no un detalle estético.

**El mapa se carga al pulsar.** Un iframe de Google Maps arrastra cientos de kB
y deja cookies de terceros. Exigiendo un gesto explícito, la web no instala nada
por su cuenta y no necesita aviso de cookies. Quien solo quiera las indicaciones
tiene el botón «Cómo llegar», que no carga nada.

**El rótulo de graffiti se usa donde tiene sitio** (héroe, pie, menú móvil,
favicon, imagen para compartir). En la cabecera, a 40 px de alto, no se lee: ahí
va una versión tipográfica que repite su estructura. Es `components/ui/Wordmark`.

**La valoración de Google se muestra pero no se publica como dato
estructurado.** El 4,7 con 152 reseñas es real y está enlazado a su ficha, pero
marcarlo como `aggregateRating` propio del sitio incumple las directrices de
Google, que prohíben publicar como propias las reseñas de una plataforma
externa. Las coordenadas sí van en el JSON-LD: vienen de su ficha y apuntan al
portal.

---

## Datos por confirmar antes de producción

Están todos marcados con comentarios en `src/data/business.ts`:

1. **Horario del sábado.** La web anterior se contradecía consigo misma: su
   contenido visible daba el mismo horario que en día laborable, y su JSON-LD lo
   cerraba a las 18:00. Se ha tomado el horario completo, que es lo que también
   muestra Booksy. → `SATURDAY_RANGES`
2. **Años de oficio.** El «+8 años» viene de la web anterior.
   → `business.yearsExperience`
3. **Qué cara corresponde a cada barbero.** Hay fotos reales del equipo en
   `public/images/local/`, pero no está confirmado quién es Andre, quién Nacho y
   quién Antonio. Por eso el selector usa iniciales y no retratos: poner una por
   otra sería peor que no poner ninguna.
4. **Aviso legal y política de privacidad.** La web recoge nombre y teléfono
   para reservar, así que en España hace falta informar del tratamiento de esos
   datos y de quién es el responsable. No se han redactado porque requieren
   datos fiscales del negocio (titular, NIF, domicilio) que no constan.

## Assets

Todas las fotografías y el rótulo son **material real del negocio**, recuperado
de su web anterior y de su ficha de Booksy. No hay ni una imagen de banco.

Tipografías: **Anton** y **Archivo**, ambas con licencia SIL Open Font License,
servidas desde el propio dominio con `next/font` (sin peticiones a Google).

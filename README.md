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
- **Panel**: `/agenda`, protegido por contraseña. Tres pestañas: **Citas**
  (agenda del día con el teléfono del cliente a un toque), **Equipo** (altas,
  bajas, pausas, horario propio y ausencias) y **Resumen** (cifras y gráficos).

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
| Barberos                                 | Panel `/agenda/equipo` (el archivo solo siembra)  |
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

En `/agenda`. Se entra desde el enlace «Acceso equipo» del pie de la web y del
menú móvil.

Para activarlo, define `ADMIN_PASSWORD` (mínimo 8 caracteres). Sin esa variable
el panel se desactiva solo.

### Citas

La agenda por días, con servicio, barbero, nombre del cliente y accesos
directos para llamarle, escribirle por WhatsApp o anular la cita. Arriba avisa
de quién no coge citas hoy, para no llevarse sorpresas en el mostrador.

### Equipo

Aquí se gestiona la plantilla sin tocar el código:

- **Alta**: nombre y dos iniciales. Las iniciales son lo que distingue a cada
  uno en la agenda, así que no se permiten repetidas — con «Andre» y «Antonio»
  en plantilla, cortar el nombre daría «AN» a los dos.
- **Tres estados**:
  - _Coge citas_: aparece en la web y en el selector de reservas.
  - _En pausa_: sigue en la web pero no se le pueden pedir citas. Para una baja
    larga o un permiso sin fecha de vuelta.
  - _Ya no trabaja aquí_: desaparece de la web y de las reservas, pero sus
    cortes siguen contando en el resumen.
- **Horario propio** por día de la semana: _Local_ (sigue el horario de la
  barbería), _Libra_, o _Propio_ con hasta dos tramos. Los dos tramos cubren la
  jornada partida, y es lo que permite montar los turnos de verano.
- **Ausencias** con fechas y motivo: vacaciones, baja, un día suelto. Esos días
  no se ofrecen citas con esa persona.
- **Borrado definitivo** solo si nunca tuvo citas. Si las tuvo, se queda de baja
  para no dejar el historial huérfano ni descuadrar las estadísticas.

Todo esto afecta a la disponibilidad al momento: la web pública se regenera en
cada cambio (`revalidatePath`) y el selector de barberos del formulario se
refresca con cada consulta de horas.

El equipo vive en la colección `barberos` de Firestore. La primera vez que se
abre el panel, se siembra con el equipo de `data/business.ts`; a partir de ahí
manda la base de datos. Sin Firebase configurado se muestra el equipo del
archivo y se avisa de que los cambios no se guardan.

### Resumen

Cifras de las últimas ocho semanas y cuatro gráficos: cortes por semana, por
barbero, servicios más pedidos y a qué horas entra la gente. Más la ocupación de
los próximos siete días.

Están hechos con CSS, sin librería de gráficos: son barras, y meter 50 kB de
JavaScript para dibujar rectángulos en un panel que se abre desde el móvil del
mostrador no se sostiene. Cada gráfico lleva además su tabla de datos para
lectores de pantalla, y las cifras están siempre escritas.

Dos avisos sobre las métricas, que están también a pie de página en el panel:

- **«Facturado»** es la suma de las tarifas de las citas confirmadas, no una
  contabilidad: no descuenta anulaciones de última hora ni recoge propinas.
- **La ocupación se calcula solo hacia delante.** La de meses pasados habría que
  medirla con la plantilla que había entonces, y el sistema solo conoce la
  actual: quien entró ayer inflaría semanas de capacidad que nunca existió, y
  quien está en pausa desaparecería del cálculo pese a haber trabajado. Hacia
  delante la plantilla actual es la correcta — y además es el dato que sirve:
  cuánto hueco queda por vender.

### Seguridad

Es una contraseña compartida entre el equipo, no un sistema de usuarios: la
decisión es deliberada. Lo que sí se cuida:

- La cookie de sesión es `httpOnly`, va firmada con HMAC y caduca a las 12 h.
- Las comparaciones de contraseña son en tiempo constante.
- **Todas** las acciones que escriben comprueban la sesión antes de tocar nada.
  Que el botón solo se pinte estando dentro no es una defensa.
- Cada página del panel comprueba la sesión por su cuenta, no solo el marco
  compartido: en React Server Components el código de la página se ejecuta
  aunque el marco decida no mostrarla, así que un guardián puesto solo arriba
  dejaría que las consultas a la base de datos se hicieran igualmente.
- La página no se cachea ni se indexa (`robots.txt` excluye `/agenda`).

Para cambiar la contraseña, cambia la variable y vuelve a desplegar. Las
sesiones abiertas dejan de valer, porque la firma depende de ella.

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
      page.tsx          citas
      equipo/           gestión de la plantilla
      resumen/          cifras y gráficos
      actions.ts        Server Actions del panel
    api/
      disponibilidad/   huecos libres de un día
      reservas/         crear cita  ·  reservas/cancelar/ anular
    globals.css         sistema de diseño completo
    layout.tsx          html, tipografías, script de tema
    opengraph-image.tsx imagen de previsualización, generada al compilar
  components/
    agenda/             piezas del panel (fichas de barbero, gráficos)
    booking/            formulario de reserva
    navigation/         cabecera y menú móvil
    sections/           las secciones de la página, en orden
    ui/                 piezas reutilizables (botón, marco de foto, cinta…)
  data/business.ts      FUENTE ÚNICA DE VERDAD
  lib/
    booking.ts          generación y validación de huecos (compartido)
    team.ts             tipos del equipo y reglas de disponibilidad (puro)
    barbersStore.ts     colección del equipo en Firestore
    stats.ts            cálculo de las cifras del resumen
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

**`lib/team` y `lib/barbersStore` están separados a propósito.** El primero
tiene los tipos y las reglas de disponibilidad y es código puro; el segundo
accede a Firestore. Si vivieran juntos, el formulario de reserva —que necesita
esas reglas para filtrar horas— arrastraría todo `firebase-admin` y gRPC al
paquete del navegador, y la compilación ni terminaría.

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
   quién Antonio. Por eso se usan iniciales y no retratos: poner una por otra
   sería peor que no poner ninguna. Cuando lo confirméis, se puede añadir una
   foto por barbero desde el panel.
4. **Aviso legal y política de privacidad.** La web recoge nombre y teléfono
   para reservar, así que en España hace falta informar del tratamiento de esos
   datos y de quién es el responsable. No se han redactado porque requieren
   datos fiscales del negocio (titular, NIF, domicilio) que no constan.

## Assets

Todas las fotografías y el rótulo son **material real del negocio**, recuperado
de su web anterior y de su ficha de Booksy. No hay ni una imagen de banco.

Tipografías: **Anton** y **Archivo**, ambas con licencia SIL Open Font License,
servidas desde el propio dominio con `next/font` (sin peticiones a Google).

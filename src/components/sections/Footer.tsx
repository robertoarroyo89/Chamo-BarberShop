import Image from "next/image";
import { OpenStatus } from "@/components/ui/OpenStatus";
import { InstagramGlyph, WhatsAppGlyph } from "@/components/ui/icons";
import { business, openingHours } from "@/data/business";
import { formatRange, groupSchedule } from "@/lib/hours";
import { NAV_SECTIONS } from "@/lib/constants";

const GROUPS = groupSchedule(openingHours);

export function Footer() {
  // Página estática: el año se fija al compilar, que es lo que se quiere (sin
  // desajustes de hidratación).
  const year = new Date().getFullYear();

  return (
    <footer className="bg-paper pt-14 pb-8">
      <div className="container-page">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-8">
          {/* --- Rótulo y dirección --------------------------------------- */}
          <div className="lg:col-span-4">
            <Image
              src="/logo/el-chamo.png"
              alt={business.name}
              width={1200}
              height={713}
              sizes="240px"
              className="h-auto w-[15rem]"
            />

            <address className="text-ink-soft mt-5 text-sm leading-relaxed not-italic">
              {business.address.street}
              <br />
              {business.address.postalCode} {business.address.city},{" "}
              {business.address.region}
            </address>

            <div className="mt-4 flex flex-col items-start gap-2">
              <a
                href={business.phone.href}
                className="font-display hover:decoration-ink text-xl underline decoration-transparent underline-offset-4 transition-colors"
                aria-label={`Llamar al ${business.phone.display}`}
              >
                {business.phone.display}
              </a>
              <a
                href={business.instagram.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-ink-soft hover:text-ink flex items-center gap-2 text-sm transition-colors"
                aria-label={`Instagram, ${business.instagram.handle} (se abre en una pestaña nueva)`}
              >
                <InstagramGlyph size={15} />
                {business.instagram.handle}
              </a>
            </div>
          </div>

          {/* --- Horario --------------------------------------------------- */}
          <div className="lg:col-span-4">
            <h2 className="eyebrow text-ink-faint">Horario</h2>
            <dl className="mt-4 space-y-2">
              {GROUPS.map((group) => (
                <div
                  key={group.label}
                  className="flex flex-wrap items-baseline justify-between gap-x-5 gap-y-0.5 text-sm sm:justify-start sm:gap-5"
                >
                  <dt className="text-ink-soft sm:w-32">{group.label}</dt>
                  <dd className="font-display tabular-nums">
                    {group.ranges.length === 0
                      ? "Cerrado"
                      : group.ranges.map(formatRange).join(" / ")}
                  </dd>
                </div>
              ))}
            </dl>
            <div className="mt-5">
              <OpenStatus />
            </div>
          </div>

          {/* --- Navegación y reserva -------------------------------------- */}
          <div className="lg:col-span-3 lg:col-start-10">
            <h2 className="eyebrow text-ink-faint">Secciones</h2>
            <nav aria-label="Navegación del pie de página" className="mt-4">
              <ul className="space-y-2">
                {NAV_SECTIONS.map((section) => (
                  <li key={section.id}>
                    <a
                      href={`#${section.id}`}
                      className="text-ink-soft hover:decoration-ink hover:text-ink text-sm underline decoration-transparent underline-offset-4 transition-colors"
                    >
                      {section.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>

            <a
              href={business.whatsapp.href}
              target="_blank"
              rel="noopener noreferrer"
              className="keyline bg-blue text-on-color font-display mt-6 inline-flex items-center gap-2 px-4 py-2.5 text-xs tracking-[0.08em] uppercase transition-[transform,box-shadow] duration-150 ease-out hover:-translate-x-[2px] hover:-translate-y-[2px] hover:shadow-hard"
              aria-label="Escribir por WhatsApp (se abre en una pestaña nueva)"
            >
              <WhatsAppGlyph size={15} />
              WhatsApp
            </a>
          </div>
        </div>

        {/* --- Línea inferior -------------------------------------------- */}
        <div className="keyline-t mt-12 flex flex-col gap-2 pt-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-ink-faint text-xs">
            © {year} {business.name} · Barbería en {business.address.city},{" "}
            {business.address.region}
          </p>
          <p className="text-ink-faint text-xs">
            Sin cookies de seguimiento. El mapa se carga solo si lo pides.
          </p>
        </div>
      </div>
    </footer>
  );
}

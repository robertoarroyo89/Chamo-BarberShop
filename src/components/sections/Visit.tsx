import { Navigation, Phone } from "lucide-react";
import { HoursTable } from "@/components/sections/HoursTable";
import { LazyMap } from "@/components/sections/LazyMap";
import { ButtonLink } from "@/components/ui/Button";
import { OpenStatus } from "@/components/ui/OpenStatus";
import { Reveal } from "@/components/ui/Reveal";
import { SectionTitle } from "@/components/ui/SectionTitle";
import { InstagramGlyph, WhatsAppGlyph } from "@/components/ui/icons";
import { business } from "@/data/business";
import { pad2 } from "@/lib/utils";

const CONTACTS = [
  {
    id: "telefono",
    label: "Teléfono",
    value: business.phone.display,
    href: business.phone.href,
    icon: <Phone aria-hidden="true" size={16} />,
    ariaLabel: `Llamar al ${business.phone.display}`,
    external: false,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    value: "Escríbenos",
    href: business.whatsapp.href,
    icon: <WhatsAppGlyph size={16} />,
    ariaLabel: "Escribir por WhatsApp (se abre en una pestaña nueva)",
    external: true,
  },
  {
    id: "instagram",
    label: "Instagram",
    value: business.instagram.handle,
    href: business.instagram.href,
    icon: <InstagramGlyph size={16} />,
    ariaLabel: `Instagram, ${business.instagram.handle} (se abre en una pestaña nueva)`,
    external: true,
  },
];

/**
 * Horario y ubicación en una sola sección.
 *
 * Antes eran dos y contaban lo mismo desde dos sitios. Al visitante solo le
 * interesa una pregunta —"¿cuándo y dónde?"— así que se responde de una vez.
 */
export function Visit() {
  return (
    <section
      id="visitanos"
      className="bg-paper-sunken keyline-t keyline-b py-(--spacing-section)"
    >
      <div className="container-page">
        <SectionTitle
          index={pad2(7)}
          eyebrow="Cuándo y dónde"
          lines={["Visítanos"]}
          tone="blue"
        />

        <div className="mt-12 grid gap-8 lg:mt-16 lg:grid-cols-12 lg:gap-10">
          {/* --- Horario --------------------------------------------------- */}
          <div className="lg:col-span-5">
            <Reveal y={20}>
              <div className="keyline bg-paper-raised p-5 shadow-hard sm:p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-2xl leading-none">Horario</h3>
                  <OpenStatus />
                </div>
                <div className="mt-5">
                  <HoursTable />
                </div>
                <p className="text-ink-soft mt-5 text-sm leading-relaxed">
                  Sin cita también se puede, pero pidiéndola te ahorras la
                  espera.
                </p>
              </div>
            </Reveal>
          </div>

          {/* --- Dirección y contacto -------------------------------------- */}
          <div className="lg:col-span-7">
            <div className="grid gap-8 sm:grid-cols-2">
              <div>
                <Reveal y={18}>
                  <address className="not-italic">
                    <p className="eyebrow text-ink-faint">Dirección</p>
                    <p className="font-display mt-2 text-[clamp(1.5rem,4vw,2.1rem)] leading-[1.05]">
                      {business.address.street}
                    </p>
                    <p className="text-ink-soft mt-2 text-base">
                      {business.address.postalCode} {business.address.city} ·{" "}
                      {business.address.region}
                    </p>
                  </address>
                </Reveal>

                <Reveal y={18} delay={0.1}>
                  <div className="mt-6">
                    <ButtonLink
                      href={business.mapsUrl}
                      external
                      tone="red"
                      icon={<Navigation aria-hidden="true" size={17} />}
                      ariaLabel="Cómo llegar, abrir en Google Maps (se abre en una pestaña nueva)"
                    >
                      Cómo llegar
                    </ButtonLink>
                  </div>
                </Reveal>

                <Reveal y={18} delay={0.18}>
                  <ul className="keyline-t mt-8">
                    {CONTACTS.map((contact) => (
                      <li key={contact.id} className="keyline-b">
                        <a
                          href={contact.href}
                          aria-label={contact.ariaLabel}
                          {...(contact.external
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                          className="group flex items-center justify-between gap-4 py-3"
                        >
                          <span className="text-ink-soft flex items-center gap-2.5">
                            <span className="group-hover:text-blue-ink transition-colors">
                              {contact.icon}
                            </span>
                            <span className="eyebrow">{contact.label}</span>
                          </span>
                          <span className="font-display group-hover:decoration-ink text-base underline decoration-transparent underline-offset-4 transition-colors">
                            {contact.value}
                          </span>
                        </a>
                      </li>
                    ))}
                  </ul>
                </Reveal>
              </div>

              <Reveal y={22} delay={0.12}>
                <LazyMap />
              </Reveal>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

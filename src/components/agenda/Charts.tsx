import type { StatRow } from "@/lib/stats";
import { cn } from "@/lib/utils";

/**
 * Gráficos del panel, con CSS.
 *
 * Sin librería: son barras. Meter 50 kB de JavaScript para dibujar cinco
 * rectángulos en un panel que se abre desde el móvil del mostrador no se
 * sostiene, y así funcionan igual con la conexión del local un sábado.
 *
 * Accesibilidad: cada gráfico es una tabla de datos de verdad para quien use
 * lector de pantalla, y las barras van marcadas como decorativas. Las cifras
 * están siempre escritas, nunca solo insinuadas por el largo de la barra.
 */

const FILL = {
  blue: "bg-blue",
  yellow: "bg-yellow",
  red: "bg-red",
  ink: "bg-ink",
};

interface ChartProps {
  title: string;
  rows: StatRow[];
  /** Qué se está contando, para el encabezado de la tabla. */
  unit?: string;
  empty?: string;
}

/** Barras horizontales con etiqueta: bien para rankings (barberos, servicios). */
export function BarList({ title, rows, unit = "cortes", empty }: ChartProps) {
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <figure className="keyline bg-paper-raised p-5 shadow-hard">
      <figcaption className="font-display text-lg leading-none">
        {title}
      </figcaption>

      {rows.length === 0 ? (
        <p className="text-ink-soft mt-4 text-sm">
          {empty ?? "Todavía no hay datos."}
        </p>
      ) : (
        <table className="mt-5 w-full border-collapse">
          <caption className="sr-only">
            {title}, en {unit}
          </caption>
          <thead className="sr-only">
            <tr>
              <th scope="col">Concepto</th>
              <th scope="col">{unit}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <th
                  scope="row"
                  className="w-2/5 py-2 pr-3 text-left align-middle text-sm font-semibold"
                >
                  {row.label}
                </th>
                <td className="py-2 align-middle">
                  <span className="flex items-center gap-3">
                    <span
                      aria-hidden="true"
                      className="bg-paper-sunken keyline relative h-5 flex-1"
                    >
                      <span
                        className={cn(
                          "absolute inset-y-0 left-0",
                          FILL[row.accent ?? "blue"],
                        )}
                        style={{ width: `${(row.value / max) * 100}%` }}
                      />
                    </span>
                    <span className="font-display w-20 shrink-0 text-right text-base tabular-nums">
                      {row.value}
                      {row.detail ? (
                        <span className="text-ink-soft ml-1.5 text-xs font-normal">
                          {row.detail}
                        </span>
                      ) : null}
                    </span>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </figure>
  );
}

/** Columnas verticales: bien para series temporales (semanas, horas). */
export function BarSeries({ title, rows, unit = "cortes", empty }: ChartProps) {
  const max = Math.max(1, ...rows.map((r) => r.value));

  return (
    <figure className="keyline bg-paper-raised p-5 shadow-hard">
      <figcaption className="font-display text-lg leading-none">
        {title}
      </figcaption>

      {rows.length === 0 ? (
        <p className="text-ink-soft mt-4 text-sm">
          {empty ?? "Todavía no hay datos."}
        </p>
      ) : (
        <>
          {/* Las columnas son decorativas: el dato accesible va en la tabla. */}
          <div
            aria-hidden="true"
            className="keyline-b mt-6 flex h-40 items-end gap-1.5"
          >
            {rows.map((row) => (
              <span
                key={row.label}
                className="flex h-full flex-1 flex-col justify-end gap-1"
                title={`${row.label}: ${row.value}`}
              >
                <span className="font-display text-center text-[0.625rem] tabular-nums">
                  {row.value > 0 ? row.value : ""}
                </span>
                <span
                  className={cn(
                    "keyline w-full",
                    FILL[row.accent ?? "blue"],
                    row.value === 0 && "bg-paper-sunken",
                  )}
                  style={{
                    // Un mínimo visible para que un cero no desaparezca del todo.
                    height: `${Math.max((row.value / max) * 100, 2)}%`,
                  }}
                />
              </span>
            ))}
          </div>

          <div aria-hidden="true" className="mt-2 flex gap-1.5">
            {rows.map((row) => (
              <span
                key={row.label}
                className="text-ink-soft flex-1 text-center text-[0.625rem] tabular-nums"
              >
                {row.label}
              </span>
            ))}
          </div>

          <table className="sr-only">
            <caption>
              {title}, en {unit}
            </caption>
            <thead>
              <tr>
                <th scope="col">Periodo</th>
                <th scope="col">{unit}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  <td>{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </figure>
  );
}

/** Cifra grande con su etiqueta. */
export function Kpi({
  label,
  value,
  hint,
  accent = "blue",
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: keyof typeof FILL;
}) {
  return (
    <div className="keyline bg-paper-raised shadow-hard">
      <div aria-hidden="true" className={cn("keyline-b h-2.5", FILL[accent])} />
      <div className="p-4">
        <p className="eyebrow text-ink-soft">{label}</p>
        <p className="font-display mt-2 text-[clamp(1.9rem,5vw,2.6rem)] leading-none tabular-nums">
          {value}
        </p>
        {hint ? <p className="text-ink-faint mt-1.5 text-xs">{hint}</p> : null}
      </div>
    </div>
  );
}

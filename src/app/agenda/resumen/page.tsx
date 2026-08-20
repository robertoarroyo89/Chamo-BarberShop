import type { Metadata } from "next";
import { AgendaLogin } from "../agenda-login";
import { BarList, BarSeries, Kpi } from "@/components/agenda/Charts";
import { NotConfigured, NotConnected, Shell } from "@/components/agenda/Shell";
import { getAllBarbers } from "@/lib/barbersStore";
import { panelState } from "@/lib/panelGuard";
import { getStats } from "@/lib/stats";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Resumen",
  robots: { index: false, follow: false, nocache: true },
};

export default async function ResumenPage() {
  const state = await panelState();

  if (state === "sin-configurar") {
    return (
      <Shell authed={false}>
        <NotConfigured />
      </Shell>
    );
  }
  if (state === "anonimo") {
    return (
      <Shell authed={false}>
        <div className="mx-auto max-w-sm">
          <AgendaLogin />
        </div>
      </Shell>
    );
  }

  const team = await getAllBarbers();
  const stats = await getStats(team);

  if (!stats) {
    return (
      <Shell authed active="/agenda/resumen">
        <NotConnected />
      </Shell>
    );
  }

  const weeks = Math.round(stats.windowDays / 7);
  const sinDatos = stats.totals.cortes === 0;

  return (
    <Shell authed active="/agenda/resumen">
      <div>
        <h1 className="display-poster text-[clamp(2rem,6vw,3rem)]">Resumen</h1>
        <p className="text-ink-soft mt-2 text-sm">
          Últimas {weeks} semanas, hasta hoy.
        </p>
      </div>

      {sinDatos ? (
        <div className="keyline bg-paper-raised mt-8 p-6">
          <p className="text-ink-soft text-sm leading-relaxed">
            Todavía no hay citas registradas en este periodo. En cuanto empecéis
            a coger reservas, aquí saldrán los cortes por barbero, por servicio,
            la evolución por semanas y las horas de más trabajo.
          </p>
        </div>
      ) : null}

      {/* --- Cifras principales ------------------------------------------ */}
      <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="Cortes"
          value={String(stats.totals.cortes)}
          hint={`en ${weeks} semanas`}
          accent="blue"
        />
        <Kpi
          label="Facturado"
          value={formatPrice(stats.totals.ingresos)}
          hint="según tarifa"
          accent="yellow"
        />
        <Kpi
          label="Media por día"
          value={String(stats.totals.mediaPorDia).replace(".", ",")}
          hint="cortes por día abierto"
          accent="ink"
        />
        <Kpi
          label="Anuladas"
          value={String(stats.totals.anuladas)}
          hint="citas caídas"
          accent="red"
        />
      </div>

      {/* --- Gráficos ----------------------------------------------------- */}
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <BarSeries
          title="Cortes por semana"
          rows={stats.porSemana}
          empty="Aún no hay semanas con datos."
        />
        <BarList
          title="Por barbero"
          rows={stats.porBarbero}
          empty="Aún no hay cortes asignados."
        />
        <BarList
          title="Servicios más pedidos"
          rows={stats.porServicio}
          unit="veces"
          empty="Aún no hay servicios registrados."
        />
        <BarSeries
          title="A qué horas entra la gente"
          rows={stats.porHora}
          empty="Aún no hay horas con datos."
        />
      </div>

      {/* Ocupación de la semana que viene: el dato que dice cuánto hueco
          queda por vender. */}
      <div className="keyline bg-paper-raised mt-6 p-5 shadow-hard">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg leading-none">
              Los próximos 7 días
            </h2>
            <p className="text-ink-soft mt-1.5 text-sm">
              {stats.totals.ocupacionProxima < 35
                ? "Queda mucho hueco libre. Buen momento para poner algo en Instagram."
                : stats.totals.ocupacionProxima < 70
                  ? "La semana va cogiendo forma."
                  : "Semana casi llena."}
            </p>
          </div>
          <p className="font-display text-4xl leading-none tabular-nums">
            {stats.totals.ocupacionProxima} %
          </p>
        </div>
        <div
          aria-hidden="true"
          className="keyline bg-paper-sunken relative mt-4 h-6"
        >
          <div
            className="bg-blue absolute inset-y-0 left-0"
            style={{ width: `${stats.totals.ocupacionProxima}%` }}
          />
        </div>
        <p className="sr-only">
          Ocupación de los próximos siete días: {stats.totals.ocupacionProxima}{" "}
          por ciento de los huecos ofrecidos.
        </p>
      </div>

      <p className="text-ink-faint mt-6 text-xs leading-relaxed">
        «Facturado» es la suma de las tarifas de las citas confirmadas, no una
        contabilidad: no descuenta anulaciones de última hora ni recoge propinas
        o cobros fuera de cita. La ocupación se calcula solo hacia delante,
        porque la de meses pasados habría que medirla con la plantilla que había
        entonces y aquí solo se conoce la de ahora.
      </p>
    </Shell>
  );
}

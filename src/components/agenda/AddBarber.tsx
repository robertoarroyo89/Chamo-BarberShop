"use client";

import { useActionState, useState } from "react";
import { Loader2, Plus } from "lucide-react";
import { addBarber, type TeamState } from "@/app/agenda/actions";
import { Button } from "@/components/ui/Button";

/**
 * Alta de un miembro del equipo.
 *
 * Las iniciales se pueden dejar en blanco y el servidor las propone, pero se
 * dejan editables porque son lo que distingue a cada persona en la agenda: con
 * "Andre" y "Antonio" en plantilla, cortar el nombre daría "AN" a los dos.
 */
export function AddBarber() {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<TeamState, FormData>(
    addBarber,
    {},
  );

  if (!open) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={() => setOpen(true)}
          tone="blue"
          icon={<Plus aria-hidden="true" size={17} />}
        >
          Añadir barbero
        </Button>
        {state.ok ? (
          <p className="text-ink-soft text-sm font-semibold">{state.ok}</p>
        ) : null}
      </div>
    );
  }

  return (
    <form action={action} className="keyline bg-paper-raised p-5 shadow-hard">
      <h2 className="text-xl leading-none">Nuevo en el equipo</h2>

      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_8rem]">
        <div>
          <label htmlFor="nuevo-nombre" className="eyebrow text-ink-soft block">
            Nombre
          </label>
          <input
            id="nuevo-nombre"
            name="name"
            required
            minLength={2}
            maxLength={40}
            autoFocus
            className="keyline bg-paper mt-1.5 w-full px-3 py-2.5 text-base"
          />
        </div>
        <div>
          <label
            htmlFor="nuevo-iniciales"
            className="eyebrow text-ink-soft block"
          >
            Iniciales
          </label>
          <input
            id="nuevo-iniciales"
            name="initials"
            maxLength={2}
            placeholder="auto"
            aria-describedby="nuevo-iniciales-ayuda"
            className="keyline bg-paper mt-1.5 w-full px-3 py-2.5 text-base uppercase"
          />
        </div>
      </div>
      <p id="nuevo-iniciales-ayuda" className="text-ink-faint mt-1.5 text-xs">
        Dos letras para identificarle en la agenda. Si lo dejas vacío, las
        proponemos.
      </p>

      {state.error ? (
        <p
          role="alert"
          className="keyline bg-red text-on-color mt-4 px-3 py-2 text-sm font-semibold"
        >
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p
          role="status"
          className="keyline bg-blue text-on-color mt-4 px-3 py-2 text-sm font-semibold"
        >
          {state.ok} Puedes añadir a otro o cerrar.
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap gap-2.5">
        <Button
          type="submit"
          tone="blue"
          disabled={pending}
          icon={
            pending ? (
              <Loader2 aria-hidden="true" size={16} className="animate-spin" />
            ) : undefined
          }
        >
          {pending ? "Añadiendo…" : "Añadir al equipo"}
        </Button>
        <Button onClick={() => setOpen(false)} tone="paper">
          {state.ok ? "Cerrar" : "Cancelar"}
        </Button>
      </div>
    </form>
  );
}

import type { Opcion, Platillo } from "./types";

/**
 * Calorías a partir de los macronutrientes (factores de Atwater, los que usa el etiquetado
 * nutricional): proteínas y carbohidratos 4 kcal/g, grasas 9 kcal/g. La fibra no se suma aparte.
 */
export function kcalFromMacros(proteinas: number, carbohidratos: number, grasas: number): number {
  return Math.max(0, Math.round(4 * proteinas + 4 * carbohidratos + 9 * grasas));
}

type Nutri = Pick<
  Platillo,
  "proteinas" | "carbohidratos" | "grasas" | "fibra" | "kcal_manual" | "porcion_g"
>;

export function hasNutrition(p: Nutri): boolean {
  return p.proteinas !== null && p.carbohidratos !== null && p.grasas !== null;
}

/** Calorías del platillo: la cifra ingresada a mano (p. ej. de una ficha técnica) o la calculada. */
export function platoKcal(p: Nutri): number | null {
  if (p.kcal_manual !== null) return p.kcal_manual;
  if (!hasNutrition(p)) return null;
  return kcalFromMacros(p.proteinas ?? 0, p.carbohidratos ?? 0, p.grasas ?? 0);
}

export type Grupo = Opcion["grupo"];
export type Seleccion = {
  tamano: number | null;
  proteina: number | null;
  base: number | null;
  extras: number[];
};

export const GRUPOS: { id: Grupo; nombre: string; ayuda: string }[] = [
  { id: "tamano", nombre: "Tamaño", ayuda: "Multiplica la porción completa (factor)." },
  {
    id: "proteina",
    nombre: "Proteína",
    ayuda: "Diferencia frente a la proteína de la receta original.",
  },
  { id: "base", nombre: "Base", ayuda: "Diferencia frente a la base de la receta original." },
  { id: "extra", nombre: "Extras", ayuda: "Lo que se suma al agregarlo." },
];

export function byGroup(opciones: Opcion[], grupo: Grupo): Opcion[] {
  return opciones.filter((o) => o.grupo === grupo).sort((a, b) => a.orden - b.orden);
}

/** Selección inicial: la primera opción de cada grupo (la receta original) y sin extras. */
export function defaultSelection(opciones: Opcion[]): Seleccion {
  return {
    tamano: byGroup(opciones, "tamano")[0]?.id ?? null,
    proteina: byGroup(opciones, "proteina")[0]?.id ?? null,
    base: byGroup(opciones, "base")[0]?.id ?? null,
    extras: [],
  };
}

export type Totales = {
  kcal: number | null;
  proteinas: number | null;
  carbohidratos: number | null;
  grasas: number | null;
  fibra: number | null;
  porcion: number | null;
  precio: number;
};

const r1 = (n: number) => Math.round(n * 10) / 10;

/** Precio y nutrición del platillo según lo que el cliente eligió. */
export function computeTotals(plato: Platillo, opciones: Opcion[], sel: Seleccion): Totales {
  const base = plato.precio_oferta ?? plato.precio;
  const elegidas = plato.personalizable
    ? [sel.proteina, sel.base, ...sel.extras]
        .map((id) => opciones.find((o) => o.id === id))
        .filter((o): o is Opcion => Boolean(o))
    : [];
  const tamano = plato.personalizable ? opciones.find((o) => o.id === sel.tamano) : undefined;
  const factor = tamano?.factor ?? 1;
  const precio =
    base + elegidas.reduce((s, o) => s + o.precio_extra, 0) + (tamano?.precio_extra ?? 0);

  if (!hasNutrition(plato)) {
    return {
      kcal: plato.kcal_manual,
      proteinas: null,
      carbohidratos: null,
      grasas: null,
      fibra: null,
      porcion: plato.porcion_g,
      precio,
    };
  }
  const sum = (k: "proteinas" | "carbohidratos" | "grasas" | "fibra") =>
    Math.max(0, ((plato[k] ?? 0) + elegidas.reduce((s, o) => s + o[k], 0)) * factor);
  const p = sum("proteinas");
  const c = sum("carbohidratos");
  const g = sum("grasas");
  // Las opciones pueden restar (p. ej. cambiar la base por hojas), así que aquí no se limita a 0
  const deltaKcal = elegidas.reduce((s, o) => s + optionKcal(o), 0);
  const kcal =
    plato.kcal_manual !== null
      ? Math.max(0, Math.round((plato.kcal_manual + deltaKcal) * factor))
      : kcalFromMacros(p, c, g);
  return {
    kcal,
    proteinas: r1(p),
    carbohidratos: r1(c),
    grasas: r1(g),
    fibra: plato.fibra === null ? null : r1(sum("fibra")),
    porcion: plato.porcion_g === null ? null : Math.round(plato.porcion_g * factor),
    precio: Math.round(precio * 100) / 100,
  };
}

/** Kcal que aporta (o resta) una opción. */
export function optionKcal(o: Pick<Opcion, "proteinas" | "carbohidratos" | "grasas">): number {
  return Math.round(4 * o.proteinas + 4 * o.carbohidratos + 9 * o.grasas);
}

export type Objetivo = "proteina" | "lowcarb" | "ligero" | "energia";

export const OBJETIVOS: { id: Objetivo; nombre: string }[] = [
  { id: "proteina", nombre: "Más proteína" },
  { id: "lowcarb", nombre: "Menos carbohidratos" },
  { id: "ligero", nombre: "Más ligero" },
  { id: "energia", nombre: "Más energía" },
];

/** Arma la selección que mejor cumple el objetivo, usando los valores de cada opción. */
export function goalSelection(goal: Objetivo, opciones: Opcion[], current: Seleccion): Seleccion {
  const pick = (grupo: Grupo, score: (o: Opcion) => number) =>
    byGroup(opciones, grupo).reduce<Opcion | undefined>(
      (best, o) => (!best || score(o) > score(best) ? o : best),
      undefined,
    )?.id ?? null;
  const extras = byGroup(opciones, "extra");
  switch (goal) {
    case "proteina":
      return {
        ...current,
        proteina: pick("proteina", (o) => o.proteinas),
        extras: extras.filter((o) => o.proteinas >= 5).map((o) => o.id),
      };
    case "lowcarb":
      return { ...current, base: pick("base", (o) => -o.carbohidratos), extras: [] };
    case "ligero":
      return {
        ...current,
        proteina: pick("proteina", (o) => -optionKcal(o)),
        base: pick("base", (o) => -optionKcal(o)),
        extras: [],
      };
    case "energia":
      return { ...current, base: pick("base", (o) => o.carbohidratos), extras: [] };
  }
}

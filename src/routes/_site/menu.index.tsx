import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ChevronDown, Search, SlidersHorizontal } from "lucide-react";
import { Crumbs, ProductCard, precioFinal } from "@/components/site/cards";
import { getMenuData } from "@/functions/public";
import { Ico } from "@/lib/icons";
import { parseDbDate } from "@/lib/images";
import { platoKcal } from "@/lib/nutrition";
import type { Platillo } from "@/lib/types";

type MenuSearch = { categoria?: string | undefined };

export const Route = createFileRoute("/_site/menu/")({
  validateSearch: (search: Record<string, unknown>): MenuSearch => ({
    categoria:
      typeof search["categoria"] === "string" && search["categoria"]
        ? search["categoria"]
        : undefined,
  }),
  loader: () => getMenuData(),
  head: () => ({
    meta: [
      { title: "Menú | Vital Foods" },
      {
        name: "description",
        content:
          "Menú de Vital Foods con precios en soles, calorías y proteínas de cada plato: bowls, desayunos, ensaladas, snacks y bebidas.",
      },
    ],
  }),
  component: MenuPage,
});

const OBJETIVOS = [
  { id: "proteina", nombre: "Más proteína" },
  { id: "bajo", nombre: "Bajo en calorías" },
  { id: "vegano", nombre: "Vegano" },
  { id: "energia", nombre: "Energía para el día" },
];
const KCAL = [0, 300, 450, 600];
const PRECIO = [0, 15, 25, 35];
const ORDEN = [
  { id: "dest", nombre: "Destacados" },
  { id: "asc", nombre: "Precio: menor a mayor" },
  { id: "desc", nombre: "Precio: mayor a menor" },
  { id: "prot", nombre: "Más proteína" },
  { id: "kcal", nombre: "Menos calorías" },
] as const;
type Orden = (typeof ORDEN)[number]["id"];

const fechaLarga = new Intl.DateTimeFormat("es-PE", {
  day: "numeric",
  month: "long",
  year: "numeric",
});
const normalize = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const SORTS: Record<Exclude<Orden, "dest">, (a: Platillo, b: Platillo) => number> = {
  asc: (a, b) => precioFinal(a) - precioFinal(b),
  desc: (a, b) => precioFinal(b) - precioFinal(a),
  prot: (a, b) => (b.proteinas ?? -1) - (a.proteinas ?? -1),
  kcal: (a, b) => (platoKcal(a) ?? 1e9) - (platoKcal(b) ?? 1e9),
};

function MenuPage() {
  const { platillos, categorias, etiquetas, actualizado } = Route.useLoaderData();
  const { categoria } = Route.useSearch();
  const navigate = useNavigate({ from: "/menu/" });
  const activa = categoria && categorias.includes(categoria) ? categoria : "";

  const [query, setQuery] = useState("");
  const [objs, setObjs] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [kcal, setKcal] = useState(0);
  const [precio, setPrecio] = useState(0);
  const [ofertas, setOfertas] = useState(false);
  const [perso, setPerso] = useState(false);
  const [orden, setOrden] = useState<Orden>("dest");
  const [sortOpen, setSortOpen] = useState(false);
  const [filtros, setFiltros] = useState(true);
  const sortRef = useRef<HTMLDivElement>(null);

  // En celular los filtros empiezan ocultos para que se vean primero los platos
  useEffect(() => {
    if (window.matchMedia("(max-width: 760px)").matches) setFiltros(false);
  }, []);

  useEffect(() => {
    if (!sortOpen) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (
        e instanceof KeyboardEvent
          ? e.key === "Escape"
          : !sortRef.current?.contains(e.target as Node)
      )
        setSortOpen(false);
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [sortOpen]);

  const lista = useMemo(() => {
    const q = normalize(query.trim());
    const res = platillos.filter((p) => {
      const k = platoKcal(p);
      return (
        (!activa || p.categoria === activa) &&
        (!q ||
          normalize(
            `${p.nombre} ${p.descripcion ?? ""} ${p.categoria} ${p.ingredientes ?? ""} ${p.etiquetas.join(" ")}`,
          ).includes(q)) &&
        (!objs.length || objs.some((o) => p.objetivos.includes(o))) &&
        (!tags.length || tags.every((t) => p.etiquetas.includes(t))) &&
        (!kcal || (k !== null && k < kcal)) &&
        (!precio || precioFinal(p) <= precio) &&
        (!ofertas || p.precio_oferta !== null) &&
        (!perso || p.personalizable)
      );
    });
    if (orden === "dest") return [...res].sort((a, b) => Number(b.destacado) - Number(a.destacado));
    return [...res].sort(SORTS[orden]);
  }, [platillos, activa, query, objs, tags, kcal, precio, ofertas, perso, orden]);

  const hayFiltros = Boolean(
    query || objs.length || tags.length || kcal || precio || ofertas || perso || activa,
  );
  const limpiar = () => {
    setQuery("");
    setObjs([]);
    setTags([]);
    setKcal(0);
    setPrecio(0);
    setOfertas(false);
    setPerso(false);
    void navigate({ search: {} });
  };
  const toggle = (list: string[], set: (v: string[]) => void, v: string) =>
    set(list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const fecha = actualizado ? parseDbDate(actualizado) : null;
  const usaObjetivos = platillos.some((p) => p.objetivos.length);
  const usaKcal = platillos.some((p) => platoKcal(p) !== null);

  return (
    <>
      <div className="wrap mtop">
        <Crumbs
          items={
            activa
              ? [{ label: "Inicio", to: "/" }, { label: "Menú", to: "/menu" }, { label: activa }]
              : [{ label: "Inicio", to: "/" }, { label: "Menú" }]
          }
        />
        <div className="titlebar">
          <h1>
            {activa || "Nuestro menú"} <span aria-live="polite">({lista.length})</span>
          </h1>
          <div className="tools">
            <button
              type="button"
              onClick={() => setFiltros(!filtros)}
              aria-expanded={filtros}
              aria-controls="filtros"
            >
              <span className="lbl">{filtros ? "Ocultar filtros" : "Mostrar filtros"}</span>
              <Ico icon={SlidersHorizontal} />
            </button>
            <div className={sortOpen ? "sort open" : "sort"} ref={sortRef}>
              <button
                type="button"
                onClick={() => setSortOpen(!sortOpen)}
                aria-haspopup="listbox"
                aria-expanded={sortOpen}
              >
                <span className="lbl">Ordenar por</span>
                <Ico icon={ChevronDown} />
              </button>
              <ul role="listbox" aria-label="Ordenar por">
                {ORDEN.map((o) => (
                  <li
                    key={o.id}
                    role="option"
                    tabIndex={sortOpen ? 0 : -1}
                    aria-selected={orden === o.id}
                    className={orden === o.id ? "on" : undefined}
                    onClick={() => {
                      setOrden(o.id);
                      setSortOpen(false);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setOrden(o.id);
                        setSortOpen(false);
                      }
                    }}
                  >
                    {o.nombre}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
        <p className="updated">
          Precios en soles (S/).
          {fecha && !Number.isNaN(fecha.getTime()) && (
            <> Actualizados al {fechaLarga.format(fecha)}.</>
          )}
        </p>
      </div>

      <div className={filtros ? "wrap layout" : "wrap layout nofilters"}>
        <aside id="filtros" aria-label="Filtros" inert={!filtros}>
          <label className="search">
            <Ico icon={Search} />
            <span className="sr-only">Buscar en el menú</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar plato o ingrediente"
              autoComplete="off"
            />
          </label>
          <div className="quick">
            <button
              type="button"
              className={!activa ? "on" : undefined}
              onClick={() => void navigate({ search: {} })}
            >
              Todos
            </button>
            {categorias.map((c) => (
              <button
                key={c}
                type="button"
                className={activa === c ? "on" : undefined}
                onClick={() => void navigate({ search: { categoria: c } })}
              >
                {c}
              </button>
            ))}
          </div>
          {usaObjetivos && (
            <Grupo titulo="Objetivo" abierto>
              {OBJETIVOS.map((o) => (
                <label key={o.id}>
                  <input
                    type="checkbox"
                    checked={objs.includes(o.id)}
                    onChange={() => toggle(objs, setObjs, o.id)}
                  />{" "}
                  {o.nombre}
                </label>
              ))}
            </Grupo>
          )}
          {usaKcal && (
            <Grupo titulo="Calorías">
              {KCAL.map((k) => (
                <label key={k}>
                  <input
                    type="radio"
                    name="kcal"
                    checked={kcal === k}
                    onChange={() => setKcal(k)}
                  />{" "}
                  {k ? `Menos de ${k} kcal` : "Todas"}
                </label>
              ))}
            </Grupo>
          )}
          <Grupo titulo="Precio">
            {PRECIO.map((k) => (
              <label key={k}>
                <input
                  type="radio"
                  name="precio"
                  checked={precio === k}
                  onChange={() => setPrecio(k)}
                />{" "}
                {k ? `Hasta S/ ${k}` : "Todos"}
              </label>
            ))}
          </Grupo>
          {etiquetas.length > 0 && (
            <Grupo titulo="Dieta y alérgenos">
              {etiquetas.map((t) => (
                <label key={t}>
                  <input
                    type="checkbox"
                    checked={tags.includes(t)}
                    onChange={() => toggle(tags, setTags, t)}
                  />{" "}
                  {t}
                </label>
              ))}
            </Grupo>
          )}
          <Grupo titulo="Ofertas">
            <label>
              <input
                type="checkbox"
                checked={ofertas}
                onChange={(e) => setOfertas(e.target.checked)}
              />{" "}
              Solo con descuento
            </label>
          </Grupo>
          {platillos.some((p) => p.personalizable) && (
            <Grupo titulo="Personalizable">
              <label>
                <input
                  type="checkbox"
                  checked={perso}
                  onChange={(e) => setPerso(e.target.checked)}
                />{" "}
                Puedo elegir proteína y base
              </label>
            </Grupo>
          )}
          {hayFiltros && (
            <button type="button" className="clear" onClick={limpiar}>
              Limpiar filtros
            </button>
          )}
        </aside>

        <div className="pgrid">
          {lista.length ? (
            lista.map((p, i) => <ProductCard key={p.id} p={p} index={i} />)
          ) : (
            <div className="empty">
              No hay platos con esos filtros.{" "}
              {hayFiltros && (
                <button type="button" className="clear" onClick={limpiar}>
                  Quitar filtros
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

function Grupo({
  titulo,
  abierto = false,
  children,
}: {
  titulo: string;
  abierto?: boolean;
  children: ReactNode;
}) {
  return (
    <details open={abierto}>
      <summary>
        {titulo} <Ico icon={ChevronDown} />
      </summary>
      <div className="opts">{children}</div>
    </details>
  );
}

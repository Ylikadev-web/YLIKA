export type NavStyle = "classic" | "carousel" | "dock" | "rail";
export type NavPosition = "left" | "right" | "bottom" | "top";
export type GlassBlur = "soft" | "strong" | "max";
/** Cómo navegar apartados dentro de un expediente */
export type ExpedienteNav = "tabs" | "rail" | "both";

export type UiPrefs = {
  navStyle: NavStyle;
  navPosition: NavPosition;
  glassBlur: GlassBlur;
  pendingGlow: boolean;
  floatOrbs: boolean;
  reduceTransparency: boolean;
  expedienteNav: ExpedienteNav;
};

export const DEFAULT_UI_PREFS: UiPrefs = {
  navStyle: "classic",
  navPosition: "left",
  glassBlur: "strong",
  pendingGlow: true,
  floatOrbs: true,
  reduceTransparency: false,
  expedienteNav: "tabs",
};

export const UI_PREFS_STORAGE_KEY = "ylika-ui-prefs";

export const NAV_STYLE_OPTIONS: {
  id: NavStyle;
  name: string;
  tagline: string;
}[] = [
  {
    id: "classic",
    name: "Clásica",
    tagline: "Sidebar fija con etiquetas — estilo actual.",
  },
  {
    id: "carousel",
    name: "Carrusel",
    tagline: "Franja dinámica: grande en inicio, compacta al entrar a un módulo.",
  },
  {
    id: "dock",
    name: "Dock",
    tagline: "Barra flotante tipo dock con iconos y magnificación.",
  },
  {
    id: "rail",
    name: "Rail",
    tagline: "Carril delgado de iconos; se expande al pasar el cursor.",
  },
];

export const NAV_POSITION_OPTIONS: {
  id: NavPosition;
  name: string;
}[] = [
  { id: "left", name: "Izquierda" },
  { id: "right", name: "Derecha" },
  { id: "bottom", name: "Inferior" },
  { id: "top", name: "Superior" },
];

export const EXPEDIENTE_NAV_OPTIONS: {
  id: ExpedienteNav;
  name: string;
  tagline: string;
}[] = [
  {
    id: "tabs",
    name: "Pestañas",
    tagline: "Barra horizontal tipo navegador (recomendado).",
  },
  {
    id: "rail",
    name: "Lateral",
    tagline: "Lista vertical tipo explorador de archivos.",
  },
  {
    id: "both",
    name: "Ambos",
    tagline: "Pestañas arriba + rail a la izquierda.",
  },
];

export function parseUiPrefs(raw: unknown): UiPrefs {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_UI_PREFS };
  const o = raw as Partial<UiPrefs>;
  return {
    navStyle: (["classic", "carousel", "dock", "rail"] as NavStyle[]).includes(
      o.navStyle as NavStyle,
    )
      ? (o.navStyle as NavStyle)
      : DEFAULT_UI_PREFS.navStyle,
    navPosition: (["left", "right", "bottom", "top"] as NavPosition[]).includes(
      o.navPosition as NavPosition,
    )
      ? (o.navPosition as NavPosition)
      : DEFAULT_UI_PREFS.navPosition,
    glassBlur: (["soft", "strong", "max"] as GlassBlur[]).includes(
      o.glassBlur as GlassBlur,
    )
      ? (o.glassBlur as GlassBlur)
      : DEFAULT_UI_PREFS.glassBlur,
    pendingGlow:
      typeof o.pendingGlow === "boolean"
        ? o.pendingGlow
        : DEFAULT_UI_PREFS.pendingGlow,
    floatOrbs:
      typeof o.floatOrbs === "boolean" ? o.floatOrbs : DEFAULT_UI_PREFS.floatOrbs,
    reduceTransparency:
      typeof o.reduceTransparency === "boolean"
        ? o.reduceTransparency
        : DEFAULT_UI_PREFS.reduceTransparency,
    expedienteNav: (["tabs", "rail", "both"] as ExpedienteNav[]).includes(
      o.expedienteNav as ExpedienteNav,
    )
      ? (o.expedienteNav as ExpedienteNav)
      : DEFAULT_UI_PREFS.expedienteNav,
  };
}

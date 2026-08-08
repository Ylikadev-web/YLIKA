export type ThemeId =
  | "obsidian"
  | "frost"
  | "aurora"
  | "graphite";

export type ThemeDefinition = {
  id: ThemeId;
  name: string;
  tagline: string;
  preview: {
    bg: string;
    panel: string;
    accent: string;
    glow: string;
  };
};

export const THEMES: ThemeDefinition[] = [
  {
    id: "obsidian",
    name: "Obsidian Glass",
    tagline: "Negro profundo + vidrio YLIKA. Modo principal.",
    preview: {
      bg: "#0B0D10",
      panel: "rgba(255,255,255,0.08)",
      accent: "#0AA3A8",
      glow: "#F39200",
    },
  },
  {
    id: "frost",
    name: "Frost",
    tagline: "Claridad iOS: paneles lechosos sobre atmósfera clara.",
    preview: {
      bg: "#E8EEF5",
      panel: "rgba(255,255,255,0.55)",
      accent: "#0A8F94",
      glow: "#E88400",
    },
  },
  {
    id: "aurora",
    name: "Aurora",
    tagline: "Teal y ámbar vivos; más atmósfera, menos oficina.",
    preview: {
      bg: "#041016",
      panel: "rgba(12,40,48,0.55)",
      accent: "#2DD4BF",
      glow: "#FBBF24",
    },
  },
  {
    id: "graphite",
    name: "Graphite",
    tagline: "Sobrio industrial: zinc, acero y acento naranja.",
    preview: {
      bg: "#141618",
      panel: "rgba(255,255,255,0.06)",
      accent: "#A8B0B8",
      glow: "#F39200",
    },
  },
];

export const DEFAULT_THEME: ThemeId = "obsidian";

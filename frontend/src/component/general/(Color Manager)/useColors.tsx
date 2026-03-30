const createColors = () => ({
  background: {
    primary: "bg-[var(--bg-primary)]",
    secondary: "bg-[var(--bg-secondary)]",
    accent: "bg-[var(--bg-accent)]",
    special: "bg-[var(--bg-special)]",

    heroPrimary: "bg-[var(--hero-primary)]",
    heroPrimaryFaded: "bg-[var(--hero-primary-faded)]",
    heroSecondary: "bg-[var(--hero-secondary)]",
    heroSecondaryFaded: "bg-[var(--hero-secondary-faded)]",
  },

  text: {
    primary: "text-[var(--text-primary)]",
    secondary: "text-[var(--text-secondary)]",
    special: "text-[var(--text-special)]",
    black: "text-[var(--text-black)]",
  },

  border: {
    default: "border-t border-[var(--border-default)]",
    faded: "border-t border-[var(--border-faded)]",
    green: "border-t border-[var(--border-green)]",
    special: "border-t border-[var(--border-special)]",

    defaultRight: "border-r border-[var(--border-default)]",
    fadedRight: "border-r border-[var(--border-faded)]",
    greenRight: "border-r border-[var(--border-green)]",
    specialRight: "border-r border-[var(--border-special)]",

    defaultThin: "border border-[var(--border-default)]",
    fadedThin: "border border-[var(--border-faded)]",
    greenThin: "border border-[var(--border-green)]",
    specialThin: "border border-[var(--border-special)]",

    defaultThick: "border-2 border-[var(--border-default)]",
    fadedThick: "border-2 border-[var(--border-faded)]",
    greenThick: "border-2 border-[var(--border-green)]",
    specialThick: "border-2 border-[var(--border-special)]",
  },

  accent: {
    primary: "accent-[var(--accent-primary)]",
    secondary: "accent-[var(--accent-secondary)]",
    special: "accent-[var(--accent-special)]",
  },

  hover: {
    special: "hover:bg-[var(--hover-special)]",
    textSpecial: "hover:text-[var(--text-special)]",
  },
});

export const colors = createColors();

export type Colors = typeof colors;

export function getColors(): Colors {
  return colors;
}

// Backward-compatible alias while call sites are being migrated.
export const useColors = getColors;

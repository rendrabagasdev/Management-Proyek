/**
 * Theme Utility Classes
 *
 * Gunakan classes ini untuk styling yang menggunakan theme colors dari settings
 * Menggantikan hardcoded colors seperti bg-(--theme-primary), text-(--theme-danger), etc.
 */

// Background Colors
export const themeBg = {
  primary: "bg-(--theme-primary)",
  primaryLight: "bg-(--theme-primary-light)",
  primaryDark: "bg-(--theme-primary-dark)",
  secondary: "bg-(--theme-secondary)",
  secondaryLight: "bg-(--theme-secondary-light)",
  secondaryDark: "bg-(--theme-secondary-dark)",
  accent: "bg-(--theme-accent)",
  accentLight: "bg-(--theme-accent-light)",
  accentDark: "bg-(--theme-accent-dark)",
  success: "bg-(--theme-success)",
  successLight: "bg-(--theme-success-light)",
  successDark: "bg-(--theme-success-dark)",
  warning: "bg-(--theme-warning)",
  warningLight: "bg-(--theme-warning-light)",
  warningDark: "bg-(--theme-warning-dark)",
  danger: "bg-(--theme-danger)",
  dangerLight: "bg-(--theme-danger-light)",
  dangerDark: "bg-(--theme-danger-dark)",
  info: "bg-(--theme-info)",
  infoLight: "bg-(--theme-info-light)",
  infoDark: "bg-(--theme-info-dark)",
};

// Text Colors
export const themeText = {
  primary: "text-(--theme-primary)",
  primaryLight: "text-(--theme-primary-light)",
  primaryDark: "text-(--theme-primary-dark)",
  secondary: "text-(--theme-secondary)",
  secondaryLight: "text-(--theme-secondary-light)",
  secondaryDark: "text-(--theme-secondary-dark)",
  accent: "text-(--theme-accent)",
  accentLight: "text-(--theme-accent-light)",
  accentDark: "text-(--theme-accent-dark)",
  success: "text-(--theme-success)",
  successLight: "text-(--theme-success-light)",
  successDark: "text-(--theme-success-dark)",
  warning: "text-(--theme-warning)",
  warningLight: "text-(--theme-warning-light)",
  warningDark: "text-(--theme-warning-dark)",
  danger: "text-(--theme-danger)",
  dangerLight: "text-(--theme-danger-light)",
  dangerDark: "text-(--theme-danger-dark)",
  info: "text-(--theme-info)",
  infoLight: "text-(--theme-info-light)",
  infoDark: "text-(--theme-info-dark)",
};

// Border Colors
export const themeBorder = {
  primary: "border-(--theme-primary)",
  primaryLight: "border-(--theme-primary-light)",
  primaryDark: "border-(--theme-primary-dark)",
  secondary: "border-(--theme-secondary)",
  secondaryLight: "border-(--theme-secondary-light)",
  secondaryDark: "border-(--theme-secondary-dark)",
  accent: "border-(--theme-accent)",
  accentLight: "border-(--theme-accent-light)",
  accentDark: "border-(--theme-accent-dark)",
  success: "border-(--theme-success)",
  warning: "border-(--theme-warning)",
  danger: "border-(--theme-danger)",
  info: "border-(--theme-info)",
};

// Hover Background Colors
export const themeHoverBg = {
  primary: "hover:bg-(--theme-primary)",
  primaryLight: "hover:bg-(--theme-primary-light)",
  primaryDark: "hover:bg-(--theme-primary-dark)",
  secondary: "hover:bg-(--theme-secondary)",
  secondaryLight: "hover:bg-(--theme-secondary-light)",
  secondaryDark: "hover:bg-(--theme-secondary-dark)",
  accent: "hover:bg-(--theme-accent)",
  success: "hover:bg-(--theme-success-dark)",
  warning: "hover:bg-(--theme-warning-dark)",
  danger: "hover:bg-(--theme-danger-dark)",
  info: "hover:bg-(--theme-info-dark)",
};

// Combined Classes for Common Patterns
export const themeButton = {
  primary: `${themeBg.primary} ${themeHoverBg.primaryDark} text-white`,
  secondary: `${themeBg.secondary} ${themeHoverBg.secondaryDark} text-white`,
  accent: `${themeBg.accent} ${themeHoverBg.accent} text-white`,
  success: `${themeBg.success} ${themeHoverBg.success} text-white`,
  warning: `${themeBg.warning} ${themeHoverBg.warning} text-white`,
  danger: `${themeBg.danger} ${themeHoverBg.danger} text-white`,
  info: `${themeBg.info} ${themeHoverBg.info} text-white`,
  outline: `border-2 ${themeBorder.primary} ${themeText.primary} ${themeHoverBg.primary} hover:text-white`,
};

export const themeBadge = {
  primary: `${themeBg.primary} ${themeText.primary} bg-opacity-10`,
  secondary: `${themeBg.secondary} ${themeText.secondary} bg-opacity-10`,
  accent: `${themeBg.accent} ${themeText.accent} bg-opacity-10`,
  success: `${themeBg.success} ${themeText.success} bg-opacity-10`,
  warning: `${themeBg.warning} ${themeText.warning} bg-opacity-10`,
  danger: `${themeBg.danger} ${themeText.danger} bg-opacity-10`,
  info: `${themeBg.info} ${themeText.info} bg-opacity-10`,
};

export const themeCard = {
  primary: `border-l-4 ${themeBorder.primary}`,
  secondary: `border-l-4 ${themeBorder.secondary}`,
  accent: `border-l-4 ${themeBorder.accent}`,
  success: `border-l-4 ${themeBorder.success}`,
  warning: `border-l-4 ${themeBorder.warning}`,
  danger: `border-l-4 ${themeBorder.danger}`,
  info: `border-l-4 ${themeBorder.info}`,
};

// Helper function to get CSS variable value
export function getThemeColor(colorName: string): string {
  if (typeof window === "undefined") return "";
  return getComputedStyle(document.documentElement)
    .getPropertyValue(`--theme-${colorName}`)
    .trim();
}

// Helper function to use theme colors in inline styles
export function themeStyle(
  colorType: "bg" | "text" | "border",
  colorName: string
) {
  const color = getThemeColor(colorName);
  switch (colorType) {
    case "bg":
      return { backgroundColor: color };
    case "text":
      return { color: color };
    case "border":
      return { borderColor: color };
    default:
      return {};
  }
}

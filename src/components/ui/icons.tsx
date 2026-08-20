/**
 * Glifos propios para marcas que Lucide ya no incluye (retiró los iconos de
 * marca en su versión 1). Son SVG mínimos, monocromos y con `currentColor`,
 * en la misma retícula de 24 px que Lucide para que convivan sin desajustes.
 *
 * No se usan emojis en ninguna parte de la interfaz.
 */

interface GlyphProps {
  className?: string;
  /** Tamaño en píxeles (cuadrado). */
  size?: number;
}

export function WhatsAppGlyph({ className, size = 20 }: GlyphProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2Zm0 1.83c2.15 0 4.17.84 5.69 2.36a8 8 0 0 1 2.36 5.69c0 4.45-3.62 8.07-8.07 8.07a8.2 8.2 0 0 1-4.15-1.13l-.3-.18-3.1.81.83-3.03-.19-.31a8.14 8.14 0 0 1-1.25-4.34c0-4.45 3.62-8.07 8.08-8.07Z" />
      <path d="M9.32 7.2c-.19-.42-.38-.42-.56-.43h-.48c-.16 0-.44.06-.67.31-.23.25-.87.85-.87 2.08s.9 2.42 1.02 2.58c.13.17 1.74 2.79 4.22 3.8 2.06.84 2.48.67 2.93.63.44-.04 1.43-.59 1.63-1.15.2-.57.2-1.05.14-1.15-.06-.1-.23-.17-.48-.29-.25-.13-1.43-.71-1.65-.79-.23-.08-.39-.12-.56.13-.16.25-.64.83-.79 1-.14.16-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.23-1.47-1.38-1.72-.15-.25-.02-.39.11-.51.11-.12.29-.31.44-.48.14-.16.19-.27.29-.46.1-.19.05-.35-.02-.48-.06-.12-.55-1.3-.75-1.78Z" />
    </svg>
  );
}

export function InstagramGlyph({ className, size = 20 }: GlyphProps) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="3.8" />
      <circle cx="17.2" cy="6.8" r="1.05" fill="currentColor" stroke="none" />
    </svg>
  );
}

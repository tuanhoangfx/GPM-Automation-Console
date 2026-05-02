import { type ReactNode, useEffect, useState } from "react";
import { createPortal } from "react-dom";

type Props = { children: ReactNode };

/**
 * Renders children via `document.body` so overlays sit above stacking contexts
 * while still inheriting theme tokens from `html[data-theme]`.
 */
export function PortaledThemeSurface({ children }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}

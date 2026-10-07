import type { ReactNode } from "react";
import type { OgIcon } from "@/lib/og";

// Pictogrammes simples (grille 24x24, traits arrondis). Ils servent à illustrer le sujet de la publication.
const PATHS: Record<OgIcon, ReactNode[]> = {
  news: (
    [
      <path key={0} d="M4 4h13a1 1 0 0 1 1 1v14a2 2 0 0 0 2 2H6a2 2 0 0 1-2-2z" />,
      <path key={1} d="M18 8h2a1 1 0 0 1 1 1v10a2 2 0 0 1-2 2M8 8h6M8 12h6M8 16h4" />,
    ]
  ),
  chip: (
    [
      <rect key={0} x="7" y="7" width="10" height="10" rx="1.5" />,
      <rect key={1} x="10" y="10" width="4" height="4" />,
      <path key={2} d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4" />,
    ]
  ),
  science: (
    [
      <ellipse key={0} cx="12" cy="12" rx="10" ry="4" />,
      <ellipse key={1} cx="12" cy="12" rx="10" ry="4" transform="rotate(60 12 12)" />,
      <ellipse key={2} cx="12" cy="12" rx="10" ry="4" transform="rotate(120 12 12)" />,
      <circle key={3} cx="12" cy="12" r="1.4" />,
    ]
  ),
  leaf: (
    [
      <path key={0} d="M20 4C9 4 4 9 4 15a5 5 0 0 0 5 5c6 0 11-5 11-16z" />,
      <path key={1} d="M4 20c2-6 6-10 12-12" />,
    ]
  ),
  coins: (
    [
      <circle key={0} cx="9" cy="9" r="6" />,
      <path key={1} d="M15.5 9.5A6 6 0 1 1 9.5 15.5M9 6.5v5M7.5 8.2c.4-.7 1-1 1.5-1s1.6.4 1.6 1.4-1 1.2-1.6 1.4-1.5.4-1.5 1.4 1 1.4 1.6 1.4 1.2-.3 1.5-1" />,
    ]
  ),
  shield: (
    [
      <path key={0} d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />,
      <path key={1} d="M8.5 12l2.5 2.5 4.5-5" />,
    ]
  ),
  phone: (
    [
      <rect key={0} x="7" y="2" width="10" height="20" rx="2" />,
      <path key={1} d="M11 18h2" />,
    ]
  ),
  code: [<path key={0} d="M8 7l-5 5 5 5M16 7l5 5-5 5M14 4l-4 16" />],
  bulb: (
    [
      <path key={0} d="M9 18h6M10 21h4" />,
      <path key={1} d="M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z" />,
    ]
  ),
  book: (
    [
      <path key={0} d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2z" />,
      <path key={1} d="M4 19v2h15M9 7h6" />,
    ]
  ),
  chat: (
    [
      <path key={0} d="M21 12a8 8 0 0 1-11.7 7.1L3 21l1.9-5.6A8 8 0 1 1 21 12z" />,
      <path key={1} d="M8.5 11h7M8.5 14h4" />,
    ]
  ),
};

export function Icon({ name, size, color }: { name: OgIcon; size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      {PATHS[name]}
    </svg>
  );
}

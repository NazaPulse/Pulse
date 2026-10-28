/** Trazos (viewBox 24×24, `stroke="currentColor"`) de los íconos de la interfaz. */
export const ICON_PATHS = {
  finance:
    'M3 8.5A2.5 2.5 0 0 1 5.5 6H19a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5.5A2.5 2.5 0 0 1 3 16.5v-8zM3 9.5h18M16.5 14.5h1.5',
  tasks: 'M9 6h11M9 12h11M9 18h11M3.5 6l1.5 1.5L7.5 5M3.5 12l1.5 1.5 2.5-2.5M3.5 18l1.5 1.5 2.5-2.5',
  notes: 'M6 3h9l4 4v14H6zM15 3v4h4M9 12h7M9 16h5',
  gantt: 'M4 4v16h16M8 7.5h6M10 12h8M7 16.5h5',
  focus: 'M12 3v3M12 18v3M3 12h3M18 12h3M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 11.2v1.6',
  chevronLeft: 'M15 5l-7 7 7 7',
  chevronRight: 'M9 5l7 7-7 7',
  grip: 'M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01',
  timer: 'M12 5a8 8 0 1 0 0 16 8 8 0 0 0 0-16zM12 9v4l2.5 1.5M9.5 2h5M18.5 6.5l1.2-1.2',
  logout: 'M9 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h4M16 8l4 4-4 4M20 12H9',
  ecg: 'M2 12h5l2.5-6 4 12 2.5-6H22',
  arrowUp: 'M12 19V5M5.5 11.5 12 5l6.5 6.5',
  arrowDown: 'M12 5v14M5.5 12.5 12 19l6.5-6.5',
  scale: 'M12 3v18M5 7h14M5 7l-2.5 6a3 3 0 0 0 5 0L5 7zM19 7l-2.5 6a3 3 0 0 0 5 0L19 7z',
  shield: 'M12 3l7.5 3v5.5c0 4.5-3.2 8.2-7.5 9.5-4.3-1.3-7.5-5-7.5-9.5V6L12 3zM9 12l2.2 2.2L15.5 10',
  bolt: 'M13 2 4.5 13.5H11L10 22l8.5-11.5H12L13 2z',
  mic: 'M12 3a3 3 0 0 0-3 3v5a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3zM5 11a7 7 0 0 0 14 0M12 18v3',
  edit: 'M4 20h4L18.5 9.5a2.1 2.1 0 0 0-3-3L5 17v3z',
  trash:
    'M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.7 12.1A2 2 0 0 1 14.3 21H9.7a2 2 0 0 1-2-1.9L7 7',
  close: 'M6 6l12 12M18 6L6 18',
} as const

export type IconName = keyof typeof ICON_PATHS

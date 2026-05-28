import styles from './ObjectIcon.module.css'

export function ObjectIcon({ obj }: { obj: string }) {
  const icons: Record<string, JSX.Element> = {
    silla: (
      <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%" className={styles.animSilla}>
        <line x1="7" y1="3" x2="7" y2="11" stroke="#78350f" strokeWidth="2.2" strokeLinecap="round"/>
        <line x1="17" y1="3" x2="17" y2="11" stroke="#78350f" strokeWidth="2.2" strokeLinecap="round"/>
        <rect x="5" y="3" width="14" height="5" rx="2" fill="#d97706" stroke="#92400e" strokeWidth="1.1"/>
        <rect x="4" y="11" width="16" height="4" rx="2" fill="#d97706" stroke="#92400e" strokeWidth="1.1"/>
        <line x1="6.5" y1="15" x2="6.5" y2="22" stroke="#78350f" strokeWidth="2" strokeLinecap="round"/>
        <line x1="17.5" y1="15" x2="17.5" y2="22" stroke="#78350f" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    alfombra: (
      <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%">
        <line x1="6" y1="4" x2="6" y2="7" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="10" y1="4" x2="10" y2="7" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="14" y1="4" x2="14" y2="7" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="18" y1="4" x2="18" y2="7" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round"/>
        <rect x="2" y="7" width="20" height="11" rx="1" fill="#d97706" stroke="#92400e" strokeWidth="1.2"/>
        <rect x="4" y="9" width="16" height="7" rx=".5" stroke="#fde68a" strokeWidth="1.5" fill="none"/>
        <ellipse cx="12" cy="12.5" rx="4" ry="2.5" fill="#b45309" stroke="#fde68a" strokeWidth="1.2" className={styles.animMedallion}/>
        <line x1="6" y1="18" x2="6" y2="21" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="10" y1="18" x2="10" y2="21" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="14" y1="18" x2="14" y2="21" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round"/>
        <line x1="18" y1="18" x2="18" y2="21" stroke="#78350f" strokeWidth="2.5" strokeLinecap="round"/>
      </svg>
    ),
    cama: (
      /* Banco (bench) — replaces cama, still OCCUPIABLE */
      <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%">
        <line x1="5" y1="2" x2="5" y2="11" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round"/>
        <line x1="19" y1="2" x2="19" y2="11" stroke="#78350f" strokeWidth="1.5" strokeLinecap="round"/>
        <rect x="3.5" y="1.5" width="17" height="2.5" rx="1" fill="#92400e" stroke="#3d1a00" strokeWidth="0.8"/>
        <rect x="2" y="10.5" width="20" height="3.5" rx="1.5" fill="#d97706" stroke="#92400e" strokeWidth="1.2" className={styles.animBanco}/>
        <rect x="5" y="18" width="14" height="1.5" rx="0.5" fill="#b45309"/>
        <line x1="4.5" y1="14" x2="4.5" y2="22" stroke="#78350f" strokeWidth="2" strokeLinecap="round"/>
        <line x1="9.5" y1="14" x2="9.5" y2="22" stroke="#78350f" strokeWidth="2" strokeLinecap="round"/>
        <line x1="14.5" y1="14" x2="14.5" y2="22" stroke="#78350f" strokeWidth="2" strokeLinecap="round"/>
        <line x1="19.5" y1="14" x2="19.5" y2="22" stroke="#78350f" strokeWidth="2" strokeLinecap="round"/>
      </svg>
    ),
    mesa: (
      /* Extintor (fire extinguisher) — replaces mesa */
      <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%">
        <rect x="7.5" y="8" width="9" height="13" rx="4" fill="#dc2626" stroke="#7c2d12" strokeWidth="1.2"/>
        <rect x="8.5" y="4" width="7" height="5" rx="2" fill="#78350f" stroke="#3d1a00" strokeWidth="1"/>
        <path d="M9 3 Q12 1.2 15 3" fill="none" stroke="#3d1a00" strokeWidth="1.8" strokeLinecap="round"/>
        <line x1="16.5" y1="7.5" x2="21" y2="5" stroke="#3d1a00" strokeWidth="1.5" strokeLinecap="round"/>
        <circle cx="21" cy="4.7" r="1" fill="#3d1a00"/>
        <circle cx="12" cy="14" r="2.5" fill="#fde68a" stroke="#78350f" strokeWidth="1" className={styles.animExtintor}/>
        <ellipse cx="12" cy="21" rx="4.5" ry="1.5" fill="#b45309" stroke="#7c2d12" strokeWidth="0.8"/>
      </svg>
    ),
    tv: (
      /* Columna (classical column) — replaces tv, no animation */
      <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%">
        <rect x="2" y="2" width="20" height="2.5" rx="0.5" fill="#78350f" stroke="#3d1a00" strokeWidth="0.8"/>
        <rect x="4" y="4.5" width="16" height="1.5" rx="0.3" fill="#92400e"/>
        <rect x="8" y="6" width="8" height="12.5" rx="0.5" fill="#92400e" stroke="#78350f" strokeWidth="0.8"/>
        <line x1="10" y1="6.5" x2="10" y2="18" stroke="#b45309" strokeWidth="0.7"/>
        <line x1="12" y1="6.5" x2="12" y2="18" stroke="#b45309" strokeWidth="0.7"/>
        <line x1="14" y1="6.5" x2="14" y2="18" stroke="#b45309" strokeWidth="0.7"/>
        <rect x="4" y="18.5" width="16" height="1.5" rx="0.3" fill="#92400e"/>
        <rect x="2" y="20" width="20" height="2.5" rx="0.5" fill="#78350f" stroke="#3d1a00" strokeWidth="0.8"/>
      </svg>
    ),
    planta: (
      <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%" className={styles.animPlanta}>
        <path d="M8 20 L7 23 L17 23 L16 20" fill="#c2410c" stroke="#7c2d12" strokeWidth="1" strokeLinejoin="round"/>
        <rect x="7" y="17.5" width="10" height="3" rx=".5" fill="#dc2626" stroke="#7c2d12" strokeWidth=".8"/>
        <line x1="12" y1="17.5" x2="12" y2="12" stroke="#65a30d" strokeWidth="1.8" strokeLinecap="round"/>
        <circle cx="12" cy="8" r="6" fill="#16a34a" stroke="#15803d" strokeWidth="1.2"/>
        <path d="M9 8 Q12 4 15 8" stroke="#4ade80" strokeWidth="1" fill="none"/>
        <path d="M9 10 Q12 7 15 10" stroke="#4ade80" strokeWidth=".8" fill="none"/>
      </svg>
    ),
    estanteria: (
      /* Estatua (statue on pedestal) — replaces estanteria */
      <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%" overflow="visible">
        <rect x="3" y="18" width="18" height="4.5" rx="0.5" fill="#78350f" stroke="#3d1a00" strokeWidth="1"/>
        <rect x="5" y="15" width="14" height="3.5" rx="0.3" fill="#92400e"/>
        <rect x="9.5" y="8" width="5" height="7" rx="1.5" fill="#78350f" stroke="#3d1a00" strokeWidth="1" className={styles.animEstatua}/>
        <ellipse cx="12" cy="5.5" rx="2.5" ry="3" fill="#78350f" stroke="#3d1a00" strokeWidth="0.9"/>
        <line x1="9.5" y1="10" x2="5" y2="13" stroke="#78350f" strokeWidth="1.6" strokeLinecap="round"/>
        <line x1="14.5" y1="9.5" x2="19" y2="7" stroke="#78350f" strokeWidth="1.6" strokeLinecap="round"/>
      </svg>
    ),
    caja: (
      /* Papelera (waste bin) — replaces caja */
      <svg viewBox="0 0 24 24" fill="none" width="100%" height="100%">
        <rect x="9.5" y="1.5" width="5" height="3.5" rx="1.5" fill="#78350f" stroke="#3d1a00" strokeWidth="1"/>
        <rect x="3.5" y="4.5" width="17" height="3" rx="1" fill="#92400e" stroke="#3d1a00" strokeWidth="1" className={styles.animPapelera}/>
        <rect x="4" y="7.5" width="16" height="13.5" rx="1" fill="#78350f" stroke="#3d1a00" strokeWidth="1.2"/>
        <line x1="8" y1="9" x2="8" y2="21" stroke="#92400e" strokeWidth="0.9"/>
        <line x1="12" y1="9" x2="12" y2="21" stroke="#92400e" strokeWidth="0.9"/>
        <line x1="16" y1="9" x2="16" y2="21" stroke="#92400e" strokeWidth="0.9"/>
        <line x1="4" y1="20" x2="20" y2="20" stroke="#92400e" strokeWidth="1"/>
      </svg>
    ),
  }
  return icons[obj] ?? <svg viewBox="0 0 24 24"><text x="12" y="16" textAnchor="middle" fontSize="10">?</text></svg>
}

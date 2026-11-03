const base = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
};
const I = ({ children, size, ...p }) => (
  <svg {...base} {...(size ? { width: size, height: size } : {})} {...p}>
    {children}
  </svg>
);

export const IconBag = (p) => (
  <I {...p}>
    <path d="M5 8h14l-1 12H6L5 8Z" />
    <path d="M9 8V6a3 3 0 0 1 6 0v2" />
  </I>
);
export const IconSearch = (p) => (
  <I {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4-4" />
  </I>
);
export const IconMenu = (p) => (
  <I {...p}>
    <path d="M4 7h16M4 12h16M4 17h10" />
  </I>
);
export const IconClose = (p) => (
  <I {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </I>
);
export const IconSun = (p) => (
  <I {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6 7 7M17 17l1.4 1.4M5.6 18.4 7 17M17 7l1.4-1.4" />
  </I>
);
export const IconMoon = (p) => (
  <I {...p}>
    <path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
  </I>
);
export const IconTrash = (p) => (
  <I {...p}>
    <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
  </I>
);
export const IconPlus = (p) => (
  <I {...p}>
    <path d="M12 5v14M5 12h14" />
  </I>
);
export const IconMinus = (p) => (
  <I {...p}>
    <path d="M5 12h14" />
  </I>
);
export const IconCheck = (p) => (
  <I {...p}>
    <path d="m5 12.5 4.5 4.5L19 7.5" />
  </I>
);
export const IconArrowLeft = (p) => (
  <I {...p}>
    <path d="M19 12H5M11 6l-6 6 6 6" />
  </I>
);
export const IconChevronDown = (p) => (
  <I {...p}>
    <path d="m6 9 6 6 6-6" />
  </I>
);
export const IconFilter = (p) => (
  <I {...p}>
    <path d="M4 6h16M7 12h10M10 18h4" />
  </I>
);
export const IconTruck = (p) => (
  <I {...p}>
    <path d="M3 6h11v10H3zM14 9h4l3 3v4h-7" />
    <circle cx="7.5" cy="17.5" r="1.8" />
    <circle cx="17.5" cy="17.5" r="1.8" />
  </I>
);
export const IconShield = (p) => (
  <I {...p}>
    <path d="M12 3 5 6v5c0 4.5 3 8.2 7 10 4-1.8 7-5.5 7-10V6l-7-3Z" />
    <path d="m9 12 2.2 2.2L15.5 10" />
  </I>
);
export const IconUser = (p) => (
  <I {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c1.5-4 4.5-5.5 8-5.5s6.5 1.5 8 5.5" />
  </I>
);
export const IconBox = (p) => (
  <I {...p}>
    <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
    <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
  </I>
);
export const IconSpark = (p) => (
  <I {...p}>
    <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3ZM18 16l.8 2.2L21 19l-2.2.8L18 22l-.8-2.2L15 19l2.2-.8L18 16Z" />
  </I>
);
export const IconZoom = (p) => (
  <I {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-4-4M11 8v6M8 11h6" />
  </I>
);
export const IconAlert = (p) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5.5M12 16.5v.01" />
  </I>
);

export const Logo = ({ size = 34 }) => (
  <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
    <defs>
      <linearGradient id="vg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor="#6d4dff" />
        <stop offset="1" stopColor="#ff7a59" />
      </linearGradient>
    </defs>
    <rect width="40" height="40" rx="12" fill="url(#vg)" />
    <path d="M10 12l8.2 17c.7 1.4 2.9 1.4 3.6 0L30 12" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
  </svg>
);

/* ---------- آیکون‌های پنل مدیریت ---------- */
export const IconDashboard = (p) => (
  <I {...p}>
    <rect x="3.5" y="3.5" width="7" height="8" rx="2" />
    <rect x="13.5" y="3.5" width="7" height="5" rx="2" />
    <rect x="13.5" y="11.5" width="7" height="9" rx="2" />
    <rect x="3.5" y="14.5" width="7" height="6" rx="2" />
  </I>
);
export const IconShirt = (p) => (
  <I {...p}>
    <path d="M8 4 3.5 7l2 3.5L8 9.5V20h8V9.5l2.5 1L20.5 7 16 4a4 4 0 0 1-8 0Z" />
  </I>
);
export const IconKey = (p) => (
  <I {...p}>
    <circle cx="8" cy="15" r="4" />
    <path d="m11 12 8.5-8.5M16 7l2.5 2.5M14 9l2 2" />
  </I>
);
export const IconLogout = (p) => (
  <I {...p}>
    <path d="M10 4H5v16h5M15 8l4 4-4 4M19 12H9" />
  </I>
);
export const IconExternal = (p) => (
  <I {...p}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5H5V6h5" />
  </I>
);
export const IconEdit = (p) => (
  <I {...p}>
    <path d="M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4" />
  </I>
);
export const IconImage = (p) => (
  <I {...p}>
    <rect x="3.5" y="4.5" width="17" height="15" rx="3" />
    <circle cx="9" cy="10" r="1.6" />
    <path d="m4 17 5-4.5 4 3.5 3-2.5 4 3.5" />
  </I>
);
export const IconRefresh = (p) => (
  <I {...p}>
    <path d="M20 11a8 8 0 0 0-14.5-4M4 4v4h4M4 13a8 8 0 0 0 14.5 4M20 20v-4h-4" />
  </I>
);

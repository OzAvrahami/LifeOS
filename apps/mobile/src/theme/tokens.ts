export const colors = {
  background: '#F4F1EA',
  surface: '#FBF9F3',
  surfaceMuted: '#EFEBE1',
  text: '#23211C',
  textSoft: '#3A382F',
  textMuted: '#6E6A60',
  textSubtle: '#8C8577',
  textFaint: '#9A9488',
  border: '#EAE4D8',
  divider: '#F0EBE0',
  accent: '#2F8F86',
  accentWeak: '#E4F1EF',
  accentText: '#2A7D75',
  overlay: 'rgba(28, 25, 18, 0.34)',
  warningSurface: '#F5E6DD',
  warningText: '#8A421F',
  warningMuted: '#9A6B4E',
  warningAction: '#BB6A4E',
  warningBadge: '#F3E2D9',
  completedSurface: '#F1EDE3',
  white: '#FFFFFF',
  lifeArea: {
    work: '#3E7C93',
    family: '#C08457',
    home: '#B79A3E',
    health: '#6E9A6A',
    personal: '#9A7BB0',
    projects: '#C0694A',
  },
} as const;

export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 20,
  round: 999,
} as const;

export const typography = {
  family: {
    regular: 'Assistant_400Regular',
    medium: 'Assistant_500Medium',
    semibold: 'Assistant_600SemiBold',
    bold: 'Assistant_700Bold',
    extraBold: 'Assistant_800ExtraBold',
  },
  size: {
    navigation: 11,
    label: 13,
    meta: 14,
    body: 15,
    button: 16,
    title: 20,
    display: 28,
  },
} as const;

// Approved prototype.html CSS, including the later compact-proposal overrides.
// Keep the legacy Assistant scale above for unmigrated screens.
export const v2Typography = {
  family: {
    regular: 'Heebo_400Regular', semibold: 'Heebo_650SemiBold', bold: 'Heebo_700Bold',
    heading: 'Heebo_750Heading', extraBold: 'Heebo_800ExtraBold',
  },
  title: { fontSize: 29, lineHeight: 36.25, letterSpacing: -0.8 },
  narrowTitle: { fontSize: 26, lineHeight: 32.5 },
  heading: { fontSize: 16, lineHeight: 22.4 },
  body: { fontSize: 14, lineHeight: 22.4 },
  caption: { fontSize: 13, lineHeight: 20.8 },
  taskTitle: { fontSize: 14, lineHeight: 21 },
  reason: { fontSize: 11, lineHeight: 16.5 },
} as const;

export const v2Layout = {
  body: { horizontal: 19, narrowHorizontal: 14, top: 16, bottom: 22, narrowBreakpoint: 375 },
  chrome: { avatar: 37, bottom: 15, gap: 12, symbol: 28, symbolRadius: 9 },
  proposal: { top: 17, padding: 17, radius: 22, icon: 19, title: 20, titleLine: 26, copyTop: 8 },
  section: { top: 18, bottom: 11, gap: 8 },
  task: { padding: 12, radius: 15, gap: 10, listGap: 9, rank: 24, rankRadius: 8, reasonTop: 4 },
  action: { top: 22, gap: 9, height: 48, radius: 14, horizontal: 15, vertical: 12, icon: 18 },
  nav: { top: 9, horizontal: 10, bottom: 16, gap: 3, itemWidth: 53, itemHeight: 46, icon: 20, label: 10, labelGap: 5, addSize: 43, addRadius: 15, indicatorWidth: 19, indicatorHeight: 3 },
} as const;

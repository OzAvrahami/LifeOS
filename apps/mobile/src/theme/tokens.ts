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

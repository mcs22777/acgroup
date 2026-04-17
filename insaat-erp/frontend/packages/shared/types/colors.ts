/**
 * AC GRUP PROJE A.Ş. — Kurumsal Renk Paleti
 * Logo: Koyu lacivert tonları, modern ve kurumsal
 */

export const colors = {
  // Ana Renkler (Logodan türetilmiş)
  primary: {
    50: '#E8EDF5',
    100: '#C5D1E8',
    200: '#9FB3D9',
    300: '#7995CA',
    400: '#5C7FBF',
    500: '#1B3A6B',   // Ana lacivert — logo rengi
    600: '#172F56',
    700: '#132542',
    800: '#0F1C32',
    900: '#0A1220',
  },
  // Vurgu Rengi (Altın / Amber — inşaat sektörü için)
  accent: {
    50: '#FFF8E1',
    100: '#FFECB3',
    200: '#FFE082',
    300: '#FFD54F',
    400: '#FFCA28',
    500: '#D4A017',   // Altın sarısı
    600: '#B8860B',
    700: '#996515',
    800: '#7A5010',
    900: '#5C3B0A',
  },
  // Durum Renkleri
  status: {
    available: '#10B981',     // Yeşil — satışa uygun
    reserved: '#F59E0B',      // Amber — rezerve / anlaşma aşamasında
    negotiation: '#3B82F6',   // Mavi — müzakere
    sold: '#EF4444',          // Kırmızı — satılmış
  },
  // Nötr Renkler
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  },
  // Semantik Renkler
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  // Arkaplan
  background: {
    primary: '#FFFFFF',
    secondary: '#F8FAFC',
    dark: '#0F172A',
  },
} as const;

export type ColorPalette = typeof colors;

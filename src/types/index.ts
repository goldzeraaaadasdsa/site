/**
 * Centralized types for the entire application
 * Ensures consistency across frontend and backend
 */

export interface User {
  id: string;
  username: string;
  displayName?: string;
  steamId?: string;
  avatar?: string;
  steam?: {
    id?: string;
    displayName?: string;
    avatar?: string;
  };
  stats?: {
    wins: number;
    podiums: number;
    points: number;
  };
  createdAt?: string;
  isAdmin: boolean;
  isActive: boolean;
}

export interface Race {
  id: number;
  title: string;
  track: string;
  date: string;
  time?: string;
  laps?: string;
  duration?: string;
  pilots?: number;
  description: string;
  image?: string;
  trackTemp?: number;
  airTemp?: number;
  windSpeed?: number;
  windDirection?: string;
  fuelRecommendation?: number;
  tirePressureFront?: number;
  tirePressureRear?: number;
  brakeBias?: number;
  setupNotes?: string;
  participants?: { username: string; registeredAt: string }[];
  setups?: string;
  safetyCar?: boolean;
  championship?: string;
  status?: "upcoming" | "live" | "completed";
}

export interface NewsItem {
  id: number;
  title: string;
  summary: string;
  content?: string;
  author?: string;
  date: string;
  image?: string;
  category: string;
  tags?: string[];
  published?: boolean;
  views?: number;
}

export interface Standing {
  category: string;
  drivers: { name: string; points: number; team?: string }[];
  raceCount?: number;
  vacancies?: number;
  registeredPilots?: string[];
  description?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  icon?: string;
  requirement?: string;
  unlocked?: boolean;
}

export interface ApiResponse<T> {
  ok: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  ok: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ChatMessage {
  id?: string;
  username: string;
  message: string;
  timestamp: number;
  avatarUrl?: string;
}

export interface Settings {
  siteName: string;
  siteDescription: string;
  theme: 'light' | 'dark' | 'system';
  defaultLanguage: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailVerificationRequired: boolean;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalRaces: number;
  completedRaces: number;
  publishedNews: number;
  totalAchievements: number;
  recentActivity: number;
}

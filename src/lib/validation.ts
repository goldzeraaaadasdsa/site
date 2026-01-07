/**
 * Zod validation schemas for API data validation
 * Ensures type safety and prevents invalid data from being processed
 */

import { z } from 'zod';

// User validation
export const UserSchema = z.object({
  id: z.string().min(1),
  username: z.string().min(1).max(50),
  displayName: z.string().max(100).optional(),
  steamId: z.string().optional(),
  avatar: z.string().url().optional(),
  isAdmin: z.boolean().default(false),
  isActive: z.boolean().default(true),
  stats: z.object({
    wins: z.number().min(0),
    podiums: z.number().min(0),
    points: z.number().min(0),
  }).optional(),
  createdAt: z.string().datetime().optional(),
});

export type UserType = z.infer<typeof UserSchema>;

// Race validation
export const RaceSchema = z.object({
  id: z.number().or(z.string()).optional(),
  title: z.string().min(1).max(200),
  track: z.string().min(1).max(100),
  date: z.string().datetime(),
  time: z.string().optional(),
  duration: z.string().optional(),
  description: z.string().min(10),
  status: z.enum(['upcoming', 'live', 'completed']).optional(),
  participants: z.array(z.object({
    username: z.string(),
    registeredAt: z.string(),
  })).optional(),
  championship: z.string().optional(),
});

export type RaceType = z.infer<typeof RaceSchema>;

// News validation
export const NewsSchema = z.object({
  id: z.number().or(z.string()).optional(),
  title: z.string().min(1).max(200),
  summary: z.string().min(10).max(500),
  content: z.string().min(20).optional(),
  category: z.string().min(1),
  author: z.string().optional(),
  date: z.string().datetime().optional(),
  published: z.boolean().default(false),
  tags: z.array(z.string()).optional(),
  views: z.number().min(0).default(0),
});

export type NewsType = z.infer<typeof NewsSchema>;

// Standing validation
export const StandingSchema = z.object({
  category: z.string().min(1),
  drivers: z.array(z.object({
    name: z.string(),
    points: z.number().min(0),
    team: z.string().optional(),
  })).min(1),
  raceCount: z.number().min(0).optional(),
  vacancies: z.number().min(0).optional(),
});

export type StandingType = z.infer<typeof StandingSchema>;

// Achievement validation
export const AchievementSchema = z.object({
  id: z.string().min(1).optional(),
  title: z.string().min(1).max(100),
  description: z.string().min(10),
  category: z.string().min(1),
  points: z.number().min(0),
  icon: z.string().optional(),
  requirement: z.string().optional(),
});

export type AchievementType = z.infer<typeof AchievementSchema>;

// Pagination query validation
export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  search: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

export type PaginationType = z.infer<typeof PaginationSchema>;

// Settings validation
export const SettingsSchema = z.object({
  siteName: z.string().min(1).max(100),
  siteDescription: z.string().min(10),
  theme: z.enum(['light', 'dark', 'system']),
  maintenanceMode: z.boolean(),
  registrationEnabled: z.boolean(),
});

export type SettingsType = z.infer<typeof SettingsSchema>;

// Safe parse helper
export const safeValidate = <T>(schema: z.ZodSchema, data: unknown): { success: boolean; data?: T; error?: string } => {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated as T };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, error: error.errors[0]?.message || 'Validation failed' };
    }
    return { success: false, error: 'Unknown validation error' };
  }
};

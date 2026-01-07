import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserSchema, RaceSchema, NewsSchema, StandingSchema, AchievementSchema } from '@/lib/validation';
import { z } from 'zod';

describe('Validation Schemas', () => {
  describe('UserSchema', () => {
    it('should validate correct user data', () => {
      const validUser = {
        id: 'user-123',
        username: 'johndoe',
        displayName: 'John Doe',
        isAdmin: false,
        isActive: true,
      };

      const result = UserSchema.safeParse(validUser);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('user-123');
      }
    });

    it('should fail with missing required fields', () => {
      const invalidUser = {
        username: 'johndoe',
      };

      const result = UserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });

    it('should enforce max username length', () => {
      const invalidUser = {
        id: 'user-123',
        username: 'a'.repeat(51), // exceeds max length of 50
      };

      const result = UserSchema.safeParse(invalidUser);
      expect(result.success).toBe(false);
    });
  });

  describe('RaceSchema', () => {
    it('should validate correct race data', () => {
      const validRace = {
        title: 'Monaco Grand Prix',
        track: 'Monaco',
        date: new Date().toISOString(),
        description: 'This is a detailed description of the race.',
        status: 'upcoming' as const,
      };

      const result = RaceSchema.safeParse(validRace);
      expect(result.success).toBe(true);
    });

    it('should fail with short description', () => {
      const invalidRace = {
        title: 'Monaco GP',
        track: 'Monaco',
        date: new Date().toISOString(),
        description: 'Short', // less than 10 chars
        status: 'upcoming' as const,
      };

      const result = RaceSchema.safeParse(invalidRace);
      expect(result.success).toBe(false);
    });

    it('should validate race status enum', () => {
      const validRace = {
        title: 'Monaco Grand Prix',
        track: 'Monaco',
        date: new Date().toISOString(),
        description: 'This is a detailed description.',
        status: 'live' as const,
      };

      const result = RaceSchema.safeParse(validRace);
      expect(result.success).toBe(true);
    });
  });

  describe('NewsSchema', () => {
    it('should validate correct news data', () => {
      const validNews = {
        title: 'Breaking News',
        summary: 'This is a summary of breaking news',
        category: 'Noticias',
        published: true,
      };

      const result = NewsSchema.safeParse(validNews);
      expect(result.success).toBe(true);
    });

    it('should fail with missing summary', () => {
      const invalidNews = {
        title: 'Breaking News',
        category: 'Noticias',
      };

      const result = NewsSchema.safeParse(invalidNews);
      expect(result.success).toBe(false);
    });

    it('should default published to false', () => {
      const news = {
        title: 'Breaking News',
        summary: 'This is a summary',
        category: 'Noticias',
      };

      const result = NewsSchema.safeParse(news);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.published).toBe(false);
      }
    });
  });

  describe('StandingSchema', () => {
    it('should validate correct standing data', () => {
      const validStanding = {
        category: 'F1 Championship',
        drivers: [
          { name: 'Driver 1', points: 100 },
          { name: 'Driver 2', points: 80 },
        ],
        raceCount: 5,
      };

      const result = StandingSchema.safeParse(validStanding);
      expect(result.success).toBe(true);
    });

    it('should fail with empty drivers array', () => {
      const invalidStanding = {
        category: 'F1 Championship',
        drivers: [],
      };

      const result = StandingSchema.safeParse(invalidStanding);
      expect(result.success).toBe(false);
    });
  });

  describe('AchievementSchema', () => {
    it('should validate correct achievement data', () => {
      const validAchievement = {
        title: 'First Victory',
        description: 'Win your first race in the platform',
        category: 'Racing',
        points: 100,
      };

      const result = AchievementSchema.safeParse(validAchievement);
      expect(result.success).toBe(true);
    });

    it('should enforce minimum points value', () => {
      const invalidAchievement = {
        title: 'First Victory',
        description: 'Win your first race in the platform',
        category: 'Racing',
        points: -10,
      };

      const result = AchievementSchema.safeParse(invalidAchievement);
      expect(result.success).toBe(false);
    });
  });
});

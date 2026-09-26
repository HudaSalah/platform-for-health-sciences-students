import {
  calculateProgressPercent,
  getLessonStatus,
  hasReachedCompletion,
  isLessonUnlocked,
} from './progress.rules';

describe('progress rules', () => {
  // ========== قاعدة الـ 90% ==========
  describe('hasReachedCompletion', () => {
    it('returns false below 90%', () => {
      expect(hasReachedCompletion(89, 100)).toBe(false);
    });

    it('returns true at exactly 90%', () => {
      expect(hasReachedCompletion(90, 100)).toBe(true);
    });

    it('returns true above 90%', () => {
      expect(hasReachedCompletion(100, 100)).toBe(true);
    });

    it('returns false when the duration is unknown (0)', () => {
      expect(hasReachedCompletion(5, 0)).toBe(false);
    });
  });

  
  describe('isLessonUnlocked', () => {
    const lessons = ['l1', 'l2', 'l3'];

    it('always unlocks the first lesson', () => {
      const nothingCompleted = () => false;

      expect(isLessonUnlocked(lessons, 'l1', nothingCompleted)).toBe(true);
    });

    it('locks a lesson when the previous one is not completed', () => {
      const nothingCompleted = () => false;

      expect(isLessonUnlocked(lessons, 'l2', nothingCompleted)).toBe(false);
    });

    it('unlocks a lesson when the previous one is completed', () => {
      const completed = new Set(['l1']);
      const isCompleted = (id: string) => completed.has(id);

      expect(isLessonUnlocked(lessons, 'l2', isCompleted)).toBe(true);
    });

    it('checks only the lesson right before it', () => {
      
      const completed = new Set(['l1']);
      const isCompleted = (id: string) => completed.has(id);

      expect(isLessonUnlocked(lessons, 'l3', isCompleted)).toBe(false);
    });

    it('locks a lesson that does not exist', () => {
      const everythingCompleted = () => true;

      expect(isLessonUnlocked(lessons, 'unknown', everythingCompleted)).toBe(false);
    });
  });

  
  describe('calculateProgressPercent', () => {
    it('returns 0 when nothing is completed', () => {
      const nothingCompleted = () => false;

      expect(calculateProgressPercent(['l1', 'l2'], nothingCompleted)).toBe(0);
    });

    it('returns 100 when everything is completed', () => {
      const everythingCompleted = () => true;

      expect(calculateProgressPercent(['l1', 'l2'], everythingCompleted)).toBe(100);
    });

    it('rounds to the nearest whole number', () => {
      
      const completed = new Set(['l1']);
      const isCompleted = (id: string) => completed.has(id);

      expect(calculateProgressPercent(['l1', 'l2', 'l3'], isCompleted)).toBe(33);
    });

    it('returns 0 for a course with no lessons', () => {
      const everythingCompleted = () => true;

      expect(calculateProgressPercent([], everythingCompleted)).toBe(0);
    });
  });

  
  describe('getLessonStatus', () => {
    it('is not-started when there is no progress', () => {
      expect(getLessonStatus(undefined)).toBe('not-started');
    });

    it('is in-progress when the student watched part of it', () => {
      const progress = { courseId: 'c1', positionSec: 30, completed: false, updatedAt: 1 };

      expect(getLessonStatus(progress)).toBe('in-progress');
    });

    it('is completed when marked as completed', () => {
      const progress = { courseId: 'c1', positionSec: 95, completed: true, updatedAt: 1 };

      expect(getLessonStatus(progress)).toBe('completed');
    });
  });
});
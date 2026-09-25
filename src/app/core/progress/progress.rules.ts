import { LessonProgress, LessonStatus } from '../models/progress.model';

export const COMPLETION_THRESHOLD = 0.9;

export function hasReachedCompletion(positionSec: number, durationSec: number): boolean {
  if (durationSec <= 0) {
    return false;
  }
  return positionSec / durationSec >= COMPLETION_THRESHOLD;
}

export function getLessonStatus(progress: LessonProgress | undefined): LessonStatus {
  if (!progress) {
    return 'not-started';
  }
  if (progress.completed) {
    return 'completed';
  }
  return progress.positionSec > 0 ? 'in-progress' : 'not-started';
}

export function isLessonUnlocked(
  orderedLessonIds: readonly string[],
  lessonId: string,
  isCompleted: (lessonId: string) => boolean,
): boolean {
  const index = orderedLessonIds.indexOf(lessonId);
  if (index === -1) {
    return false;
  }
  if (index === 0) {
    return true;
  }
  return isCompleted(orderedLessonIds[index - 1]);
}

// This function calculates the progress percentage of a course based on the ordered list of lesson IDs
//  and a callback function that checks if a lesson is completed. It returns the percentage of completed
//  lessons as a number between 0 and 100.
export function calculateProgressPercent(
  orderedLessonIds: readonly string[],
  isCompleted: (lessonId: string) => boolean,
): number {
  if (orderedLessonIds.length === 0) {
    return 0;
  }
  const completedCount = orderedLessonIds.filter(isCompleted).length;
  return Math.round((completedCount / orderedLessonIds.length) * 100);
}
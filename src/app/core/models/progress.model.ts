export type LessonStatus = 'not-started' | 'in-progress' | 'completed';

export interface LessonProgress {
  readonly courseId: string;
  readonly positionSec: number;
  readonly completed: boolean;
  readonly updatedAt: number;
}

export interface ProgressState {
  readonly lessons: Readonly<Record<string, LessonProgress>>;
}

export interface ContinueWatching {
  readonly courseId: string;
  readonly lessonId: string;
  readonly positionSec: number;
}
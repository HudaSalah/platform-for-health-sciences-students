import { Injectable, computed, inject, signal } from '@angular/core';

import { Course } from '../models/course.model';
import { ContinueWatching, LessonProgress, LessonStatus, ProgressState } from '../models/progress.model';
import {
  calculateProgressPercent,
  getLessonStatus,
  hasReachedCompletion,
  isLessonUnlocked,
} from '../progress/progress.rules';
import { getOrderedLessons } from '../utils/course.utils';
import { ProgressStorage } from './progress-storage';

const EMPTY_STATE: ProgressState = { lessons: {} };

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly storage = inject(ProgressStorage);
  private readonly _state = signal<ProgressState>(this.storage.load() ?? EMPTY_STATE);

  readonly state = this._state.asReadonly();

  // This computed property returns the most recently watched lesson that is not completed and has a position greater than 0.
  // It sorts the lessons by their updatedAt timestamp in descending order and returns the first one found, or null if none exist.
  readonly continueWatching = computed<ContinueWatching | null>(() => {
    const latest = Object.entries(this._state().lessons)
      .filter(([, progress]) => !progress.completed && progress.positionSec > 0)
      .sort(([, a], [, b]) => b.updatedAt - a.updatedAt)[0];

    if (!latest) {
      return null;
    }
    const [lessonId, progress] = latest;
    return { courseId: progress.courseId, lessonId, positionSec: progress.positionSec };
  });

  // This method retrieves the progress of a specific lesson by its ID. It returns the LessonProgress object if it exists, or undefined if it does not.
  getProgress(lessonId: string): LessonProgress | undefined {
    return this._state().lessons[lessonId];
  }

  // This method retrieves the status of a specific lesson by its ID. It uses the getLessonStatus function to determine the status based on the lesson's progress.
  getStatus(lessonId: string): LessonStatus {
    return getLessonStatus(this.getProgress(lessonId));
  }

  // This method checks if a specific lesson is completed by its ID. It returns true if the lesson is completed, or false if it is not.
  isCompleted(lessonId: string): boolean {
    return this.getProgress(lessonId)?.completed ?? false;
  }

    // This method checks if a specific lesson is unlocked based on the course and lesson ID.
    //  It retrieves the ordered list of lessons for the course and uses the isLessonUnlocked function
    //  to determine if the lesson is unlocked based on its position in the list and whether
    //  the previous lesson is completed.
  isUnlocked(course: Course, lessonId: string): boolean {
    const ids = getOrderedLessons(course).map((lesson) => lesson.id);
    return isLessonUnlocked(ids, lessonId, (id) => this.isCompleted(id));
  }

  getCoursePercent(course: Course): number {
    const ids = getOrderedLessons(course).map((lesson) => lesson.id);
    return calculateProgressPercent(ids, (id) => this.isCompleted(id));
  }

  // This method updates the progress of a specific lesson by its course ID, lesson ID, position in seconds, and duration in seconds.
  //  It checks if the lesson was previously completed and determines if it is now completed based on the position and duration.
  //  It then updates the state with the new progress information and saves it to storage.
  updatePosition(courseId: string, lessonId: string, positionSec: number, durationSec: number): void {
    const wasCompleted = this.isCompleted(lessonId);
    const completed = wasCompleted || hasReachedCompletion(positionSec, durationSec);

    this.update((state) => ({
      lessons: {
        ...state.lessons,
        [lessonId]: { courseId, positionSec, completed, updatedAt: Date.now() },
      },
    }));
  }

  // This private method updates the state of the progress service by applying an updater function to the current state.
  //  It sets the new state and saves it to storage.
  private update(updater: (state: ProgressState) => ProgressState): void {
    const next = updater(this._state());
    this._state.set(next);
    this.storage.save(next);
  }
}
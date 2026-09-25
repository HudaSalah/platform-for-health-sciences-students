import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { Course, CoursesData, Lesson } from '../models/course.model';
import { LoadState } from '../models/load-state.model';

const COURSES_URL = 'assets/data/courses.json';

@Injectable({ providedIn: 'root' })
export class CourseService {
  private readonly http = inject(HttpClient);

  private readonly _state = signal<LoadState<readonly Course[]>>({ status: 'loading' });
  private loadPromise: Promise<void> | null = null;

  readonly state = this._state.asReadonly();

  readonly courses = computed<readonly Course[]>(() => {
    const state = this._state();
    return state.status === 'success' ? state.data : [];
  });

  load(): Promise<void> {
    if (!this.loadPromise) {
      this._state.set({ status: 'loading' });
      this.loadPromise = firstValueFrom(this.http.get<CoursesData>(COURSES_URL))
        .then((data) => this._state.set({ status: 'success', data: data.courses }))
        .catch(() => {
          this._state.set({ status: 'error', message: 'تعذّر تحميل الكورسات، حاول مرة أخرى' });
          this.loadPromise = null;
        });
    }
    return this.loadPromise;
  }

  getCourse(courseId: string): Course | undefined {
    return this.courses().find((course) => course.id === courseId);
  }

  getLesson(courseId: string, lessonId: string): Lesson | undefined {
    return this.getCourse(courseId)
      ?.sections.flatMap((section) => section.lessons)
      .find((lesson) => lesson.id === lessonId);
  }
}
import { Routes } from '@angular/router';

import { lessonUnlockedGuard } from './core/guards/lesson-unlocked.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'courses' },
  {
    path: 'courses',
    title: 'الكورسات | Thaheen',
    loadComponent: () =>
      import('./features/course-list/course-list').then((m) => m.CourseList),
  },
  {
    path: 'courses/:courseId',
    title: 'تفاصيل الكورس | Thaheen',
    loadComponent: () =>
      import('./features/course-details/course-details').then((m) => m.CourseDetails),
  },
  {
    path: 'courses/:courseId/lessons/:lessonId',
    title: 'مشاهدة الدرس | Thaheen',
    canActivate: [lessonUnlockedGuard],
    loadComponent: () =>
      import('./features/lesson-player/lesson-player').then((m) => m.LessonPlayer),
  },
  {
    path: '**',
    title: 'غير موجود | Thaheen',
    loadComponent: () =>
      import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];

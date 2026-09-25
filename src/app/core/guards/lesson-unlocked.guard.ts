import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { CourseService } from '../services/course.service';
import { FlashMessageService } from '../services/flash-message.service';
import { ProgressService } from '../services/progress.service';

export const lessonUnlockedGuard: CanActivateFn = async (route) => {
  const courseService = inject(CourseService);
  const progressService = inject(ProgressService);
  const flashMessage = inject(FlashMessageService);
  const router = inject(Router);

  const courseId = route.paramMap.get('courseId') ?? '';
  const lessonId = route.paramMap.get('lessonId') ?? '';

  await courseService.load();

  const course = courseService.getCourse(courseId);
  const lesson = courseService.getLesson(courseId, lessonId);

  if (!course || !lesson) {
    return true;
  }

  if (progressService.isUnlocked(course, lessonId)) {
    return true;
  }

  flashMessage.show('هذا الدرس مقفل. أكمل الدرس السابق أولاً لتتمكن من مشاهدته.');
  return router.createUrlTree(['/courses', courseId]);
};
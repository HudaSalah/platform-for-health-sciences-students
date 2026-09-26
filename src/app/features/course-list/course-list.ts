import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Course, Lesson } from '../../core/models/course.model';
import { CourseService } from '../../core/services/course.service';
import { ProgressService } from '../../core/services/progress.service';
import { getOrderedLessons } from '../../core/utils/course.utils';
import { formatDuration, formatLessonCount } from '../../core/utils/format.utils';
import { ProgressBar } from '../../shared/progress-bar/progress-bar';
import { StateMessage } from '../../shared/state-message/state-message';

interface CourseCardView {
  readonly course: Course;
  readonly lessonCount: number;
  readonly percent: number;
}

interface ContinueWatchingView {
  readonly course: Course;
  readonly lesson: Lesson;
  readonly positionSec: number;
  readonly percent: number;
}

@Component({
  selector: 'app-course-list',
  imports: [RouterLink, ProgressBar, StateMessage],
  templateUrl: './course-list.html',
  styleUrl: './course-list.scss',
})
export class CourseList {
  private readonly courseService = inject(CourseService);
  private readonly progressService = inject(ProgressService);

  protected readonly state = this.courseService.state;
  protected readonly formatDuration = formatDuration;
  protected readonly formatLessonCount = formatLessonCount;

  // This computed property generates a list of course cards,
  //  each containing the course information, the number of lessons in the course,
  //  and the progress percentage for that course.
  protected readonly cards = computed<readonly CourseCardView[]>(() =>
    this.courseService.courses().map((course) => ({
      course,
      lessonCount: getOrderedLessons(course).length,
      percent: this.progressService.getCoursePercent(course),
    })),
  );

  // This computed property retrieves the most recently watched lesson that is not completed and has a position greater than 0.
  // It retrieves the course and lesson information for that entry and
  //  calculates the progress percentage for that lesson.
  protected readonly continueWatching = computed<ContinueWatchingView | null>(() => {
    const entry = this.progressService.continueWatching();
    if (!entry) {
      return null;
    }

    const course = this.courseService.getCourse(entry.courseId);
    const lesson = this.courseService.getLesson(entry.courseId, entry.lessonId);
    if (!course || !lesson) {
      return null;
    }

    const percent =
      lesson.durationSec > 0 ? Math.round((entry.positionSec / lesson.durationSec) * 100) : 0;

    return { course, lesson, positionSec: entry.positionSec, percent };
  });

  constructor() {
    void this.courseService.load();
  }

  protected retry(): void {
    void this.courseService.load();
  }
}
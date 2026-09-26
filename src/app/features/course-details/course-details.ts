import { Component, computed, effect, inject, input } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { Lesson, Section } from '../../core/models/course.model';
import { LessonStatus } from '../../core/models/progress.model';
import { CourseService } from '../../core/services/course.service';
import { ProgressService } from '../../core/services/progress.service';
import { getOrderedLessons } from '../../core/utils/course.utils';
import { formatDuration, formatLessonCount } from '../../core/utils/format.utils';
import { Icon } from '../../shared/icon/icon';
import { ProgressBar } from '../../shared/progress-bar/progress-bar';
import { StateMessage } from '../../shared/state-message/state-message';

interface LessonView {
  readonly lesson: Lesson;
  readonly number: number;
  readonly status: LessonStatus;
  readonly locked: boolean;
}

interface SectionView {
  readonly section: Section;
  readonly lessons: readonly LessonView[];
}

const STATUS_LABELS: Record<LessonStatus, string> = {
  'not-started': 'لم يبدأ',
  'in-progress': 'جارٍ',
  completed: 'مكتمل',
};

@Component({
  selector: 'app-course-details',
  imports: [RouterLink, Icon, ProgressBar, StateMessage],
  templateUrl: './course-details.html',
  styleUrl: './course-details.scss',
})
export class CourseDetails {
  readonly courseId = input.required<string>();

  private readonly courseService = inject(CourseService);
  private readonly progressService = inject(ProgressService);
  private readonly title = inject(Title);

  protected readonly state = this.courseService.state;
  protected readonly statusLabels = STATUS_LABELS;
  protected readonly formatDuration = formatDuration;
  protected readonly formatLessonCount = formatLessonCount;

  protected readonly course = computed(() => this.courseService.getCourse(this.courseId()));

  protected readonly orderedLessons = computed<readonly Lesson[]>(() => {
    const course = this.course();
    return course ? getOrderedLessons(course) : [];
  });

  protected readonly percent = computed(() => {
    const course = this.course();
    return course ? this.progressService.getCoursePercent(course) : 0;
  });

  protected readonly sections = computed<readonly SectionView[]>(() => {
    const course = this.course();
    if (!course) {
      return [];
    }

    let number = 0;
    return course.sections.map((section) => ({
      section,
      lessons: section.lessons.map((lesson) => {
        number += 1;
        return {
          lesson,
          number,
          status: this.progressService.getStatus(lesson.id),
          locked: !this.progressService.isUnlocked(course, lesson.id),
        };
      }),
    }));
  });

  // This computed property returns the next lesson that the user should watch.
  //  It finds the first lesson in the ordered list of lessons that is not completed,
  //  or returns the first lesson if all lessons are completed.
  protected readonly nextLesson = computed<Lesson | undefined>(() => {
    const lessons = this.orderedLessons();
    return lessons.find((lesson) => !this.progressService.isCompleted(lesson.id)) ?? lessons[0];
  });

  protected readonly hasStarted = computed(() =>
    this.orderedLessons().some((lesson) => this.progressService.getStatus(lesson.id) !== 'not-started'),
  );

  constructor() {
    void this.courseService.load();

    // Update the document title whenever the course changes. 
    // If a course is loaded, set the title to the course's title followed by " | Thaheen".
    //  If no course is loaded, do not change the title.
    effect(() => {
      const course = this.course();
      if (course) {
        this.title.setTitle(`${course.title} | Thaheen`);
      }
    });
  }

  protected retry(): void {
    void this.courseService.load();
  }
}
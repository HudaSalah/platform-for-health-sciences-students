import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { CourseService } from '../../core/services/course.service';
import { Icon } from '../../shared/icon/icon';
import { StateMessage } from '../../shared/state-message/state-message';
import { VideoPlayer } from './video-player/video-player';

@Component({
  selector: 'app-lesson-player',
  imports: [RouterLink, Icon, StateMessage, VideoPlayer],
  templateUrl: './lesson-player.html',
  styleUrl: './lesson-player.scss',
})
export class LessonPlayer {
  readonly courseId = input.required<string>();
  readonly lessonId = input.required<string>();

  private readonly courseService = inject(CourseService);

  protected readonly state = this.courseService.state;
  protected readonly course = computed(() => this.courseService.getCourse(this.courseId()));
  protected readonly lesson = computed(() =>
    this.courseService.getLesson(this.courseId(), this.lessonId()),
  );

  constructor() {
    void this.courseService.load();
  }

  protected retry(): void {
    void this.courseService.load();
  }
}
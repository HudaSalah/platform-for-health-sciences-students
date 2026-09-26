import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PlaybackSpeed, VideoProgress } from '../../core/models/playback.model';
import { hasReachedCompletion } from '../../core/progress/progress.rules';
import { CourseService } from '../../core/services/course.service';
import { PlayerPreferencesService } from '../../core/services/player-preferences.service';
import { ProgressService } from '../../core/services/progress.service';
import { getNextLesson } from '../../core/utils/course.utils';
import { Icon } from '../../shared/icon/icon';
import { StateMessage } from '../../shared/state-message/state-message';
import { VideoPlayer } from './video-player/video-player';

const SAVE_EVERY_MS = 5000; 

@Component({
  selector: 'app-lesson-player',
  imports: [RouterLink, Icon, StateMessage, VideoPlayer],
  templateUrl: './lesson-player.html',
  styleUrl: './lesson-player.scss',
})
export class LessonPlayer {
  
  courseId = input.required<string>();
  lessonId = input.required<string>();

  private courseService = inject(CourseService);
  private progressService = inject(ProgressService);
  private preferences = inject(PlayerPreferencesService);

  state = this.courseService.state;
  playbackRate = this.preferences.playbackRate;

  course = computed(() => this.courseService.getCourse(this.courseId()));
  lesson = computed(() => this.courseService.getLesson(this.courseId(), this.lessonId()));

  
  nextLesson = computed(() => {
    const course = this.course();
    if (!course) {
      return undefined;
    }
    return getNextLesson(course, this.lessonId());
  });

  
  isCompleted = computed(() => this.progressService.isCompleted(this.lessonId()));

  
  startAt = computed(() => {
    const progress = this.progressService.getProgress(this.lessonId());

    if (!progress) {
      return 0; 
    }
    if (progress.completed) {
      return 0; 
    }
    return progress.positionSec; 
  });

  private lastSaveTime = 0;

  constructor() {
    this.courseService.load();
  }

  
  onProgress(progress: VideoProgress): void {
    const now = Date.now();

    const fiveSecondsPassed = now - this.lastSaveTime >= SAVE_EVERY_MS;
    const justReached90 =
      !this.isCompleted() && hasReachedCompletion(progress.currentSec, progress.durationSec);

    if (fiveSecondsPassed || justReached90) {
      this.progressService.updatePosition(
        this.courseId(),
        this.lessonId(),
        progress.currentSec,
        progress.durationSec,
      );
      this.lastSaveTime = now;
    }
  }

  
  onSpeedChange(speed: PlaybackSpeed): void {
    this.preferences.setPlaybackRate(speed);
  }

  retry(): void {
    this.courseService.load();
  }
}
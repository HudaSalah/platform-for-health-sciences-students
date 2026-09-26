import { Component, ElementRef, computed, effect, input, linkedSignal, output, signal, viewChild } from '@angular/core';

import { PLAYBACK_SPEEDS, PlaybackSpeed, VideoProgress, isPlaybackSpeed } from '../../../core/models/playback.model';
import { COMPLETION_THRESHOLD } from '../../../core/progress/progress.rules';
import { formatDuration } from '../../../core/utils/format.utils';
import { Icon } from '../../../shared/icon/icon';

const SEEK_STEP_SEC = 5;

interface WebkitVideoElement extends HTMLVideoElement {
  webkitEnterFullscreen?: () => void;
}

@Component({
  selector: 'app-video-player',
  imports: [Icon],
  templateUrl: './video-player.html',
  styleUrl: './video-player.scss',
  host: {
    '(document:keydown)': 'onKeydown($event)',
    '(document:fullscreenchange)': 'onFullscreenChange()',
  },
})
export class VideoPlayer {
  readonly src = input.required<string>();
  readonly startAt = input<number>(0);
  readonly playbackRate = input<PlaybackSpeed>(1);

  readonly progressChange = output<VideoProgress>();
  readonly playbackRateChange = output<PlaybackSpeed>();
  readonly ended = output<void>();

  private readonly container = viewChild.required<ElementRef<HTMLElement>>('container');
  private readonly video = viewChild.required<ElementRef<WebkitVideoElement>>('video');
  private readonly seekBar = viewChild.required<ElementRef<HTMLElement>>('seekBar');

  protected readonly speeds = PLAYBACK_SPEEDS;
  protected readonly completionMarker = COMPLETION_THRESHOLD * 100;
  protected readonly formatDuration = formatDuration;

  protected readonly isPlaying = signal(false);
  protected readonly isLoading = signal(true);
  protected readonly hasError = signal(false);
  protected readonly isFullscreen = signal(false);
  protected readonly currentTime = signal(0);
  protected readonly duration = signal(0);
  protected readonly speed = linkedSignal<PlaybackSpeed>(() => this.playbackRate());

  protected readonly playedPercent = computed(() => {
    const duration = this.duration();
    return duration > 0 ? (this.currentTime() / duration) * 100 : 0;
  });

  private isSeeking = false;

  constructor() {
    effect(() => {
      this.video().nativeElement.playbackRate = this.speed();
    });
  }

  // ---------- Media events ----------

  protected onLoadStart(): void {
    this.isLoading.set(true);
    this.hasError.set(false);
    this.isPlaying.set(false);
    this.currentTime.set(0);
    this.duration.set(0);
  }

  protected onLoadedMetadata(): void {
    const video = this.video().nativeElement;
    this.duration.set(video.duration);
    video.playbackRate = this.speed();

    const startAt = this.startAt();
    if (startAt > 0 && startAt < video.duration - 2) {
      video.currentTime = startAt;
      this.currentTime.set(startAt);
    }
  }

  protected onCanPlay(): void {
    this.isLoading.set(false);
  }

  protected onWaiting(): void {
    this.isLoading.set(true);
  }

  protected onTimeUpdate(): void {
    this.currentTime.set(this.video().nativeElement.currentTime);
    this.emitProgress();
  }

  protected onEnded(): void {
    this.isPlaying.set(false);
    this.emitProgress();
    this.ended.emit();
  }

  protected onError(): void {
    this.hasError.set(true);
    this.isLoading.set(false);
    this.isPlaying.set(false);
  }

  // ---------- Controls ----------

  protected togglePlay(): void {
    if (this.hasError()) {
      return;
    }
    const video = this.video().nativeElement;
    if (video.paused) {
      video.play().catch(() => this.isPlaying.set(false));
    } else {
      video.pause();
    }
  }

  protected retry(): void {
    this.hasError.set(false);
    this.video().nativeElement.load();
  }

  protected onSpeedChange(event: Event): void {
    const value = Number((event.target as HTMLSelectElement).value);
    if (isPlaybackSpeed(value)) {
      this.speed.set(value);
      this.playbackRateChange.emit(value);
    }
  }

  protected async toggleFullscreen(): Promise<void> {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (document.fullscreenEnabled) {
        await this.container().nativeElement.requestFullscreen();
      } else {
        this.video().nativeElement.webkitEnterFullscreen?.();
      }
    } catch {
      // The browser refused fullscreen; the player keeps working inline.
    }
  }

  protected onFullscreenChange(): void {
    this.isFullscreen.set(document.fullscreenElement === this.container().nativeElement);
  }

  // ---------- Seek bar ----------

  protected onSeekPointerDown(event: PointerEvent): void {
    if (this.duration() <= 0) {
      return;
    }
    this.isSeeking = true;
    this.seekBar().nativeElement.setPointerCapture(event.pointerId);
    this.seekTo(this.timeFromPointer(event.clientX));
  }

  protected onSeekPointerMove(event: PointerEvent): void {
    if (this.isSeeking) {
      this.seekTo(this.timeFromPointer(event.clientX));
    }
  }

  protected onSeekPointerUp(event: PointerEvent): void {
    this.isSeeking = false;
    this.seekBar().nativeElement.releasePointerCapture(event.pointerId);
  }

  private timeFromPointer(clientX: number): number {
    const bar = this.seekBar().nativeElement;
    const rect = bar.getBoundingClientRect();
    const offset = this.isRtl() ? rect.right - clientX : clientX - rect.left;
    const ratio = Math.min(1, Math.max(0, offset / rect.width));
    return ratio * this.duration();
  }

  private seekTo(seconds: number): void {
    const duration = this.duration();
    if (duration <= 0) {
      return;
    }
    const target = Math.min(duration, Math.max(0, seconds));
    this.video().nativeElement.currentTime = target;
    this.currentTime.set(target);
  }

  // ---------- Keyboard ----------

  protected onKeydown(event: KeyboardEvent): void {
    if (this.shouldIgnoreKey(event)) {
      return;
    }

    const forward = this.isRtl() ? 'ArrowLeft' : 'ArrowRight';
    const backward = this.isRtl() ? 'ArrowRight' : 'ArrowLeft';

    switch (event.code) {
      case 'Space':
        event.preventDefault();
        this.togglePlay();
        break;
      case forward:
        event.preventDefault();
        this.seekTo(this.currentTime() + SEEK_STEP_SEC);
        break;
      case backward:
        event.preventDefault();
        this.seekTo(this.currentTime() - SEEK_STEP_SEC);
        break;
      case 'KeyF':
        event.preventDefault();
        void this.toggleFullscreen();
        break;
    }
  }

  private shouldIgnoreKey(event: KeyboardEvent): boolean {
    if (event.ctrlKey || event.metaKey || event.altKey) {
      return true;
    }
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return false;
    }
    const tag = target.tagName;
    const isTyping = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
    const isActivatingButton = tag === 'BUTTON' && (event.code === 'Space' || event.code === 'Enter');
    return isTyping || isActivatingButton;
  }

  // ---------- Helpers ----------

  private isRtl(): boolean {
    return getComputedStyle(this.container().nativeElement).direction === 'rtl';
  }

  private emitProgress(): void {
    const video = this.video().nativeElement;
    if (Number.isFinite(video.duration) && video.duration > 0) {
      this.progressChange.emit({ currentSec: video.currentTime, durationSec: video.duration });
    }
  }
}
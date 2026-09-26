import { Injectable, signal } from '@angular/core';

import { PlaybackSpeed, isPlaybackSpeed } from '../models/playback.model';

const SPEED_KEY = 'thaheen.playbackRate.v1';

// This service manages the user's playback speed history for video lessons.
//  It provides methods to get and set the playback speed, which is stored in localStorage for persistence across sessions.
@Injectable({ providedIn: 'root' })
export class PlayerPreferencesService {
  playbackRate = signal<PlaybackSpeed>(this.loadSpeed());

  setPlaybackRate(speed: PlaybackSpeed): void {
    this.playbackRate.set(speed);
    localStorage.setItem(SPEED_KEY, String(speed));
  }
 
  private loadSpeed(): PlaybackSpeed {
    const saved = Number(localStorage.getItem(SPEED_KEY));
    if (isPlaybackSpeed(saved)) {
      return saved;
    }
    return 1;
  }
}
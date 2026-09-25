import { Injectable } from '@angular/core';

import { ProgressState } from '../models/progress.model';
import { ProgressStorage } from './progress-storage';

const STORAGE_KEY = 'thaheen.progress.v1';

//type guard makes sure that the parsed value is a ProgressState object
function isProgressState(value: unknown): value is ProgressState {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const lessons = (value as { lessons?: unknown }).lessons;
  return typeof lessons === 'object' && lessons !== null;
}

@Injectable()
export class LocalStorageProgressStorage extends ProgressStorage {
  load(): ProgressState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return null;
      }
      const parsed: unknown = JSON.parse(raw);
      return isProgressState(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  save(state: ProgressState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Storage may be full or unavailable (e.g. private mode); progress stays in memory.
    }
  }
}
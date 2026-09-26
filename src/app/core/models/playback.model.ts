export const PLAYBACK_SPEEDS = [1, 1.25, 1.5, 2] as const;

export type PlaybackSpeed = (typeof PLAYBACK_SPEEDS)[number];

export function isPlaybackSpeed(value: number): value is PlaybackSpeed {
  return (PLAYBACK_SPEEDS as readonly number[]).includes(value);
}

export interface VideoProgress {
  readonly currentSec: number;
  readonly durationSec: number;
}
import { ProgressState } from '../models/progress.model';

export abstract class ProgressStorage {
  abstract load(): ProgressState | null;
  abstract save(state: ProgressState): void;
}
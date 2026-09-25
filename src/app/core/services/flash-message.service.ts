import { Injectable, signal } from '@angular/core';

const DEFAULT_DURATION_MS = 5000;

@Injectable({ providedIn: 'root' })
export class FlashMessageService {
  private readonly _message = signal<string | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;

  readonly message = this._message.asReadonly();

  show(text: string, durationMs = DEFAULT_DURATION_MS): void {
    clearTimeout(this.timer);
    this._message.set(text);
    this.timer = setTimeout(() => this.dismiss(), durationMs);
  }

  dismiss(): void {
    clearTimeout(this.timer);
    this._message.set(null);
  }
}
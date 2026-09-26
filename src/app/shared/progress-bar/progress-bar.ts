import { Component, computed, input } from '@angular/core';

@Component({
  imports: [],
  selector: 'app-progress-bar',
  styleUrl: './progress-bar.scss',
  templateUrl: './progress-bar.html',
})
export class ProgressBar {
  readonly value = input.required<number>();
  readonly label = input<string>('نسبة التقدم');

  // This computed property clamps the value of the progress bar between 0 and 100, 
  // rounding it to the nearest integer.
  protected readonly clampedValue = computed(() =>
    Math.min(100, Math.max(0, Math.round(this.value()))),
  );
}

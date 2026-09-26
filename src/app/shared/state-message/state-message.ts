import { Component, input } from '@angular/core';

export type StateMessageType = 'loading' | 'empty' | 'error' | 'not-found';

@Component({
  imports: [],
  selector: 'app-state-message',
  styleUrl: './state-message.scss',
  templateUrl: './state-message.html',
})
export class StateMessage {
  readonly type = input<StateMessageType>('empty');
  readonly title = input.required<string>();
  readonly description = input<string>('');
}

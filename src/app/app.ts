import { Component, inject, signal } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { FlashMessageService } from './core/services/flash-message.service';

@Component({
  imports:  [RouterOutlet, RouterLink],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('thaheen-lms');
   protected readonly flashMessage = inject(FlashMessageService);
}

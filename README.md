# Thaheen — Mini Offline LMS

A small, Arabic-first student portal for watching recorded course lessons, built with Angular. Everything runs offline from files bundled in `src/assets`: there is no backend and no API call.

**Live demo:** _ https://hudasalah.github.io/platform-for-health-sciences-students/ _

---

## How to run

```bash
npm install
ng serve          # http://localhost:4200
ng test           # unit tests
ng build          # production build in dist/
```

Requires Node 20.19+ (Node 22 LTS recommended).

---

## Features

### Required

| Feature | Where |
|---|---|
| Courses page with thumbnail, title, instructor, lesson count and progress % | `features/course-list` |
| "Continue watching" card for the most recent unfinished lesson | `features/course-list` |
| Course details with sections, lesson durations and status (not started / in progress / completed) | `features/course-details` |
| Sequential unlock across sections | `core/progress/progress.rules.ts` |
| Custom HTML5 player: play/pause, seek bar, time, fullscreen, speed 1x / 1.25x / 1.5x / 2x | `features/lesson-player/video-player` |
| Resume from the last position, auto-complete at 90%, "Next lesson" button | `features/lesson-player` |
| Functional guard that redirects locked lessons to the course page with a friendly message | `core/guards/lesson-unlocked.guard.ts` |
| Not-found states for unknown courses, lessons and routes | all pages + `features/not-found` |
| Progress survives refresh, stored behind a swappable service | `core/services/progress.service.ts` |
| Arabic UI, `dir="rtl"`, responsive on mobile and desktop | global |
| Loading, empty and error states (including a broken video) | `shared/state-message` + player |
| Unit tests for the 90% rule, unlock rule and progress % | `*.spec.ts` |

### Bonus

- [x] Keyboard shortcuts in the player: `Space` play/pause, arrows seek ±5s, `F` fullscreen
- [x] Remember the last playback speed
- [ ] Dark mode
- [ ] Search/filter courses
- [ ] Per-lesson notes
- [ ] Arabic/English switch

---

## Project structure

```
src/app/
  core/
    models/        Course, Progress, Playback and LoadState types
    progress/      progress.rules.ts: pure business rules (90%, unlock, percent, status)
    services/      CourseService, ProgressService, ProgressStorage, PlayerPreferencesService, FlashMessageService
    guards/        lessonUnlockedGuard
    utils/         course and formatting helpers
  features/        one lazy-loaded folder per page
    course-list/
    course-details/
    lesson-player/
      video-player/    presentational player component
    not-found/
  shared/          Icon, ProgressBar, StateMessage
src/assets/
  data/courses.json
  videos/
  images/
```

---

## Architecture and state management

### Signals, used consistently

All application state lives in **Signals** inside `providedIn: 'root'` services. Each service keeps a private writable signal and exposes a read-only one (`asReadonly()`), so only the service can change its state. Pages derive what they display with `computed`, which keeps templates free of logic and updates automatically when progress changes.

RxJS appears in exactly one place: the HTTP call in `CourseService`, which is converted immediately with `firstValueFrom`. I chose this so the codebase has one state model rather than a mix of Observables and Signals.

### Three layers for progress

```
ProgressService          Signal state, the only thing pages talk to
      │
progress.rules.ts        Pure functions: no Angular, no storage, trivially testable
      │
ProgressStorage          Abstract class used as the DI token
      │
LocalStorageProgressStorage   Current implementation
```

`ProgressService` never knows where data is saved. Swapping to a backend means writing an `ApiProgressStorage extends ProgressStorage` and changing one provider line in `app.config.ts`. The unit tests already use this seam: they inject an in-memory fake instead of `localStorage`.

The rules are plain functions that receive an `isCompleted(lessonId)` callback instead of reading state themselves. That keeps them independent of where completion data comes from, and lets the tests pass a simple `Set`.

### Loading data

`CourseService.load()` fetches `assets/data/courses.json` with `HttpClient` and caches the resulting Promise, so the guard and the page can both call it and only one request is sent. I used `HttpClient` rather than a static import because it gives real loading and error states, and because moving to an API later is a URL change. The load state is a discriminated union (`loading | success | error`), so TypeScript won't allow reading `data` before checking the status.

### Routing and the guard

All routes are lazy-loaded with `loadComponent`, and route params are bound directly to component inputs with `withComponentInputBinding()`.

`lessonUnlockedGuard` awaits `CourseService.load()` before deciding, so it works correctly on a hard refresh or a URL typed directly into the address bar. It has one responsibility: blocking locked lessons. If the course or lesson doesn't exist, it lets navigation continue so the page can show a proper not-found state. The friendly message is shown through a small `FlashMessageService` rendered in the app shell.

### The player

`VideoPlayer` is a presentational component: it takes `src`, `startAt` and `playbackRate` as inputs and emits `progressChange`, `playbackRateChange` and `ended`. It knows nothing about courses or storage. The `LessonPlayer` page owns the business logic (resume position, saving, completion, next lesson).

The `<video>` element is the source of truth; signals mirror its media events (`loadedmetadata`, `timeupdate`, `waiting`, `error`, …). Fullscreen is requested on the player container rather than the `<video>` so the custom controls stay visible, with a `webkitEnterFullscreen` fallback for iOS Safari.

---

## Data shape

I kept the suggested shape, with these deliberate choices:

- **Lesson IDs are unique across the whole app** (`anatomy-l1`, not `l1`). Progress is keyed by lesson ID, so reused IDs in two courses would overwrite each other.
- **A third course with no sections** exists on purpose to demonstrate the empty state.
- **`anatomy-l5` points to a missing `missing.mp4`** on purpose to demonstrate the broken-video state. Complete the previous four lessons to reach it.
- **The player uses the real video duration** from the `<video>` element for completion; `durationSec` in the JSON is only used for display.

---

## RTL and Arabic UX

- `lang="ar"` and `dir="rtl"` are set on `<html>`, so the whole document, including scrollbars, flows right to left.
- Layout uses **CSS logical properties** (`padding-inline`, `margin-inline-start`, `inset-inline-start`, `border-block-end`) instead of left/right, so an English/LTR mode would work without rewriting styles.
- The **seek bar fills from the right**. Pointer positions are converted to time using the element's computed direction, not a hard-coded assumption.
- **Arrow keys follow the seek bar**: in RTL, `←` moves forward. This matches what the student sees; the alternative (YouTube's approach) keeps `→` as forward in every language.
- **Media icons (play/pause) are not mirrored**, following common platform guidelines, while **navigation chevrons are**: "back" points right and "next" points left.
- Times are wrapped in `dir="ltr"` so `1:12 / 2:35` never renders reversed.
- Lesson counts use `Intl.PluralRules('ar')` for correct Arabic plurals (درس واحد، درسان، ٣ دروس، ١١ درسًا).
- Keyboard shortcuts use `event.code` instead of `event.key`, so `F` still works with an Arabic keyboard layout.
- The Cairo font is bundled locally via `@fontsource/cairo`, with no external CDN.

---

## Persistence

- Progress is stored under `thaheen.progress.v1` and playback speed under `thaheen.playbackRate.v1`. The version suffix allows changing the shape later without breaking old data.
- Stored data is parsed as `unknown` and validated with a type guard; corrupted data falls back to an empty state instead of crashing.
- Storage access is wrapped in `try/catch` for private mode or a full quota; progress then stays in memory for the session.
- The player reports time about four times per second, so the page **saves every 5 seconds**, and **immediately when the lesson crosses 90%** so the next lesson unlocks at once.
- A lesson that is already completed stays completed if rewatched, and reopens from the beginning for review.

---

## Tests

```bash
ng test
```

- `progress.rules.spec.ts`: the 90% rule (including the exact boundary and a zero duration), the sequential unlock rule (including "only the directly previous lesson counts"), progress % (including rounding and an empty course), and lesson status.
- `progress.service.spec.ts`: completion at 90%, completion that survives rewatching, unlocking across sections, course percentage, saving to storage, restoring after a simulated refresh, and "continue watching" ordering.

The service tests replace `ProgressStorage` with an in-memory fake, so they never touch the real `localStorage` and each test starts clean.

I removed the component specs generated by the CLI and focused testing on the progress logic, since that is where bugs would be most costly.

---

## Credits

- Icons: SVG paths from [Material Icons](https://github.com/google/material-design-icons) (Apache 2.0).
- Font: [Cairo](https://fonts.google.com/specimen/Cairo) (SIL Open Font License), bundled via `@fontsource/cairo`.
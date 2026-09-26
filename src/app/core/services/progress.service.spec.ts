import { TestBed } from '@angular/core/testing';

import { Course } from '../models/course.model';
import { ProgressState } from '../models/progress.model';
import { ProgressService } from './progress.service';
import { ProgressStorage } from './progress-storage';

// ========== Storage وهمي في الذاكرة بدل الـ localStorage ==========
class FakeProgressStorage extends ProgressStorage {
  savedState: ProgressState | null = null;

  constructor(private initialState: ProgressState | null) {
    super();
  }

  load(): ProgressState | null {
    return this.initialState;
  }

  save(state: ProgressState): void {
    this.savedState = state;
  }
}


const testCourse: Course = {
  id: 'c1',
  title: 'Test course',
  instructor: 'Test instructor',
  thumbnail: '',
  sections: [
    {
      id: 's1',
      title: 'Section 1',
      lessons: [
        { id: 'l1', title: 'Lesson 1', durationSec: 100, video: '' },
        { id: 'l2', title: 'Lesson 2', durationSec: 100, video: '' },
      ],
    },
    {
      id: 's2',
      title: 'Section 2',
      lessons: [
        { id: 'l3', title: 'Lesson 3', durationSec: 100, video: '' },
        { id: 'l4', title: 'Lesson 4', durationSec: 100, video: '' },
      ],
    },
  ],
};


function setup(initialState: ProgressState | null = null) {
  const storage = new FakeProgressStorage(initialState);

  TestBed.configureTestingModule({
    providers: [{ provide: ProgressStorage, useValue: storage }],
  });

  const service = TestBed.inject(ProgressService);
  return { service, storage };
}

describe('ProgressService', () => {
  it('completes a lesson when the student reaches 90%', () => {
    const { service } = setup();

    service.updatePosition('c1', 'l1', 90, 100);

    expect(service.isCompleted('l1')).toBe(true);
    expect(service.getStatus('l1')).toBe('completed');
  });

  it('does not complete a lesson below 90%', () => {
    const { service } = setup();

    service.updatePosition('c1', 'l1', 50, 100);

    expect(service.isCompleted('l1')).toBe(false);
    expect(service.getStatus('l1')).toBe('in-progress');
  });

  it('keeps a lesson completed when the student rewatches it from the start', () => {
    const { service } = setup();

    service.updatePosition('c1', 'l1', 95, 100); 
    service.updatePosition('c1', 'l1', 5, 100); 

    expect(service.isCompleted('l1')).toBe(true);
  });

  it('unlocks lessons one by one, even across sections', () => {
    const { service } = setup();

    // في البداية: أول درس بس مفتوح
    expect(service.isUnlocked(testCourse, 'l1')).toBe(true);
    expect(service.isUnlocked(testCourse, 'l2')).toBe(false);

    // خلّص l1 ← l2 يتفتح
    service.updatePosition('c1', 'l1', 100, 100);
    expect(service.isUnlocked(testCourse, 'l2')).toBe(true);

    // l3 (أول درس في القسم التاني) لسه مقفول لحد ما l2 يخلص
    expect(service.isUnlocked(testCourse, 'l3')).toBe(false);
    service.updatePosition('c1', 'l2', 100, 100);
    expect(service.isUnlocked(testCourse, 'l3')).toBe(true);
  });

  it('calculates the course progress percentage', () => {
    const { service } = setup();

    expect(service.getCoursePercent(testCourse)).toBe(0);

    service.updatePosition('c1', 'l1', 100, 100); // 1 من 4
    expect(service.getCoursePercent(testCourse)).toBe(25);

    service.updatePosition('c1', 'l2', 100, 100); // 2 من 4
    expect(service.getCoursePercent(testCourse)).toBe(50);
  });

  it('saves progress to storage on every update', () => {
    const { service, storage } = setup();

    service.updatePosition('c1', 'l1', 30, 100);

    expect(storage.savedState?.lessons['l1']?.positionSec).toBe(30);
  });

  it('restores saved progress after a page refresh', () => {
    
    const savedBeforeRefresh: ProgressState = {
      lessons: {
        l1: { courseId: 'c1', positionSec: 100, completed: true, updatedAt: 1 },
        l2: { courseId: 'c1', positionSec: 40, completed: false, updatedAt: 2 },
      },
    };

    const { service } = setup(savedBeforeRefresh);

    expect(service.isCompleted('l1')).toBe(true);
    expect(service.getProgress('l2')?.positionSec).toBe(40);
    expect(service.isUnlocked(testCourse, 'l2')).toBe(true);
  });

  it('shows the most recent unfinished lesson in "continue watching"', () => {
    const savedState: ProgressState = {
      lessons: {
        l1: { courseId: 'c1', positionSec: 100, completed: true, updatedAt: 3 }, 
        l2: { courseId: 'c1', positionSec: 20, completed: false, updatedAt: 1 }, 
        l3: { courseId: 'c1', positionSec: 50, completed: false, updatedAt: 2 }, 
      },
    };

    const { service } = setup(savedState);

    expect(service.continueWatching()).toEqual({ courseId: 'c1', lessonId: 'l3', positionSec: 50 });
  });

  it('has nothing to continue when the student has not started any lesson', () => {
    const { service } = setup();

    expect(service.continueWatching()).toBe(null);
  });
});
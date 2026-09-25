export interface Lesson {
  readonly id: string;
  readonly title: string;
  readonly durationSec: number;
  readonly video: string;
}

export interface Section {
  readonly id: string;
  readonly title: string;
  readonly lessons: readonly Lesson[];
}

export interface Course {
  readonly id: string;
  readonly title: string;
  readonly instructor: string;
  readonly thumbnail: string;
  readonly sections: readonly Section[];
}

export interface CoursesData {
  readonly courses: readonly Course[];
}
import { Course, Lesson } from '../models/course.model';

export function getOrderedLessons(course: Course): readonly Lesson[] {
  return course.sections.flatMap((section) => section.lessons);
}

export function getNextLesson(course: Course, lessonId: string): Lesson | undefined {
  const lessons = getOrderedLessons(course);
  const index = lessons.findIndex((lesson) => lesson.id === lessonId);
  return index === -1 ? undefined : lessons[index + 1];
}
// Format a duration in seconds as a string in the format "MM:SS"
export function formatDuration(totalSec: number): string {
  const safeSec = Math.max(0, Math.floor(totalSec));
  const minutes = Math.floor(safeSec / 60);
  const seconds = safeSec % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}


const arabicPlurals = new Intl.PluralRules('ar');

// Format a lesson count as a string in Arabic, using the appropriate plural form based on the count
export function formatLessonCount(count: number): string {
  switch (arabicPlurals.select(count)) {
    case 'zero':
      return 'لا توجد دروس';
    case 'one':
      return 'درس واحد';
    case 'two':
      return 'درسان';
    case 'few':
      return `${count} دروس`;
    case 'many':
      return `${count} درسًا`;
    default:
      return `${count} درس`;
  }
}
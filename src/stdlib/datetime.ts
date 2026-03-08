/**
 * PyFree DateTime 라이브러리
 * 날짜 및 시간 처리 (Python datetime 모듈 호환)
 */

/**
 * DateTime 클래스 - 날짜와 시간 표현
 */
export class DateTime {
  private _date: Date;

  constructor(year: number, month: number, day: number, hour: number = 0, minute: number = 0, second: number = 0) {
    // month는 1-12, JavaScript Date는 0-11
    this._date = new Date(year, month - 1, day, hour, minute, second);
  }

  // 속성
  get year(): number {
    return this._date.getFullYear();
  }

  get month(): number {
    return this._date.getMonth() + 1; // 1-12로 반환
  }

  get day(): number {
    return this._date.getDate();
  }

  get hour(): number {
    return this._date.getHours();
  }

  get minute(): number {
    return this._date.getMinutes();
  }

  get second(): number {
    return this._date.getSeconds();
  }

  get weekday(): number {
    // 월요일 = 0, 일요일 = 6 (Python 호환)
    let dow = this._date.getDay();
    return (dow + 6) % 7;
  }

  get dayofyear(): number {
    const start = new Date(this.year, 0, 0);
    const diff = this._date.getTime() - start.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * 문자열로 변환
   */
  toString(): string {
    return `${this.year}-${String(this.month).padStart(2, '0')}-${String(this.day).padStart(2, '0')} ${String(this.hour).padStart(2, '0')}:${String(this.minute).padStart(2, '0')}:${String(this.second).padStart(2, '0')}`;
  }

  /**
   * ISO 8601 형식으로 변환
   */
  toISOString(): string {
    return this._date.toISOString();
  }

  /**
   * Unix 타임스탬프로 변환
   */
  toTimestamp(): number {
    return Math.floor(this._date.getTime() / 1000);
  }

  /**
   * 날짜 더하기 (양수: 미래, 음수: 과거)
   */
  add(days: number): DateTime {
    const newDate = new Date(this._date);
    newDate.setDate(newDate.getDate() + days);
    return new DateTime(newDate.getFullYear(), newDate.getMonth() + 1, newDate.getDate(), newDate.getHours(), newDate.getMinutes(), newDate.getSeconds());
  }

  /**
   * 시간 더하기
   */
  add_hours(hours: number): DateTime {
    const newDate = new Date(this._date);
    newDate.setHours(newDate.getHours() + hours);
    return new DateTime(newDate.getFullYear(), newDate.getMonth() + 1, newDate.getDate(), newDate.getHours(), newDate.getMinutes(), newDate.getSeconds());
  }

  /**
   * 분 더하기
   */
  add_minutes(minutes: number): DateTime {
    const newDate = new Date(this._date);
    newDate.setMinutes(newDate.getMinutes() + minutes);
    return new DateTime(newDate.getFullYear(), newDate.getMonth() + 1, newDate.getDate(), newDate.getHours(), newDate.getMinutes(), newDate.getSeconds());
  }

  /**
   * 두 DateTime의 차이 (일 단위로 반환)
   */
  subtract(other: DateTime): number {
    const diff = this._date.getTime() - other._date.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
  }

  /**
   * 두 DateTime의 시간 차이 (초 단위로 반환)
   */
  subtract_seconds(other: DateTime): number {
    const diff = this._date.getTime() - other._date.getTime();
    return Math.floor(diff / 1000);
  }

  /**
   * 비교 - 이전인지 확인
   */
  isBefore(other: DateTime): boolean {
    return this._date < other._date;
  }

  /**
   * 비교 - 이후인지 확인
   */
  isAfter(other: DateTime): boolean {
    return this._date > other._date;
  }

  /**
   * 비교 - 같은지 확인
   */
  isEqual(other: DateTime): boolean {
    return this._date.getTime() === other._date.getTime();
  }

  /**
   * 내부 Date 객체 접근
   */
  getInternalDate(): Date {
    return new Date(this._date);
  }
}

/**
 * 현재 시간 반환
 */
export function now(): DateTime {
  const d = new Date();
  return new DateTime(d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds());
}

/**
 * Unix 타임스탐프로부터 DateTime 생성
 */
export function fromTimestamp(timestamp: number): DateTime {
  const d = new Date(timestamp * 1000);
  return new DateTime(d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds());
}

/**
 * ISO 8601 문자열로부터 DateTime 생성
 */
export function fromISOString(isoString: string): DateTime | null {
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) {
      return null;
    }
    return new DateTime(d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds());
  } catch {
    return null;
  }
}

/**
 * 문자열을 DateTime으로 파싱 (간단한 포맷만 지원)
 * 지원 포맷: "YYYY-MM-DD", "YYYY-MM-DD HH:MM:SS"
 */
export function strptime(text: string, format: string): DateTime | null {
  try {
    // 간단한 포맷: "YYYY-MM-DD" 또는 "YYYY-MM-DD HH:MM:SS"
    const datePattern = /^(\d{4})-(\d{2})-(\d{2})$/;
    const dateTimePattern = /^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/;

    let match = text.match(dateTimePattern);
    if (match) {
      const [, year, month, day, hour, minute, second] = match;
      return new DateTime(parseInt(year), parseInt(month), parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));
    }

    match = text.match(datePattern);
    if (match) {
      const [, year, month, day] = match;
      return new DateTime(parseInt(year), parseInt(month), parseInt(day));
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * DateTime을 문자열로 포맷팅 (간단한 포맷만 지원)
 * 지원 포맷: "%Y-%m-%d", "%Y-%m-%d %H:%M:%S" 등
 */
export function strftime(dt: DateTime, format: string): string {
  let result = format;

  // 년도 (%Y, %y)
  result = result.replace('%Y', String(dt.year));
  result = result.replace('%y', String(dt.year % 100).padStart(2, '0'));

  // 월 (%m, %B, %b)
  result = result.replace('%m', String(dt.month).padStart(2, '0'));
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  result = result.replace('%B', monthNames[dt.month - 1]);
  result = result.replace('%b', monthNames[dt.month - 1].substring(0, 3));

  // 일 (%d, %e)
  result = result.replace('%d', String(dt.day).padStart(2, '0'));
  result = result.replace('%e', String(dt.day).padStart(2, ' '));

  // 시간 (%H, %I, %p)
  result = result.replace('%H', String(dt.hour).padStart(2, '0'));
  const hour12 = dt.hour % 12 || 12;
  result = result.replace('%I', String(hour12).padStart(2, '0'));
  result = result.replace('%p', dt.hour < 12 ? 'AM' : 'PM');

  // 분 (%M)
  result = result.replace('%M', String(dt.minute).padStart(2, '0'));

  // 초 (%S)
  result = result.replace('%S', String(dt.second).padStart(2, '0'));

  // 요일 (%A, %a, %w)
  const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  result = result.replace('%A', dayNames[dt.weekday]);
  result = result.replace('%a', dayNames[dt.weekday].substring(0, 3));
  result = result.replace('%w', String(dt.weekday));

  return result;
}

/**
 * 두 DateTime 사이의 모든 날짜 생성
 */
export function date_range(start: DateTime, end: DateTime): DateTime[] {
  const dates: DateTime[] = [];
  let current = new DateTime(start.year, start.month, start.day);

  while (current.isBefore(end) || current.isEqual(end)) {
    dates.push(new DateTime(current.year, current.month, current.day));
    current = current.add(1);
  }

  return dates;
}

/**
 * 모든 내보내기
 */
export const DATETIME_MODULE = {
  DateTime,
  now,
  fromTimestamp,
  fromISOString,
  strptime,
  strftime,
  date_range,
};

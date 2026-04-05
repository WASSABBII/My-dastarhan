export function addMinutes(timeStr: string, minutes: number): string {
  const [hours, mins] = timeStr.split(':').map(Number);
  const total = hours * 60 + mins + minutes;
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

export function parseDateTime(date: string, time: string): Date {
  return new Date(`${date}T${time}:00`);
}

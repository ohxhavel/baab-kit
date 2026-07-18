/** Today's date as YYYY-MM-DD (local time). */
export function today(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Current year as a string. */
export function year(d: Date = new Date()): string {
  return String(d.getFullYear());
}

/** Returns local midnight on the same calendar day one month before `now`. */
export function earliestTravelDate(now = new Date()): Date {
  if (Number.isNaN(now.getTime())) {
    throw new RangeError("A valid current date is required.");
  }

  const boundary = new Date(now.getTime());
  boundary.setHours(0, 0, 0, 0);
  const originalDay = boundary.getDate();

  boundary.setDate(1);
  boundary.setMonth(boundary.getMonth() - 1);
  const lastDayOfTargetMonth = new Date(
    boundary.getFullYear(),
    boundary.getMonth() + 1,
    0,
  ).getDate();
  boundary.setDate(Math.min(originalDay, lastDayOfTargetMonth));
  return boundary;
}

/** Formats the earliest permitted travel day for an HTML date input. */
export function earliestTravelDateInputValue(now = new Date()): string {
  const boundary = earliestTravelDate(now);
  const year = boundary.getFullYear();
  const month = String(boundary.getMonth() + 1).padStart(2, "0");
  const day = String(boundary.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Validates that a trip is not older than one calendar month. */
export function isWithinTravelSubmissionWindow(value: string | Date, now = new Date()): boolean {
  const travelDate = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return !Number.isNaN(travelDate.getTime()) && travelDate >= earliestTravelDate(now);
}

export function validateBooking(date: string, startTime: string, endTime: string, today = new Date().toISOString().slice(0, 10)) {
  if (!date || !startTime || !endTime) return 'Choose a date, start time and end time.';
  if (date < today) return 'Bookings must be made for today or a future date.';
  if (startTime >= endTime) return 'End time must be after start time.';
  return null;
}

export function validateRequired(value: string, label: string, maxLength = 500) {
  const trimmed = value.trim();
  if (!trimmed) return `${label} is required.`;
  if (trimmed.length > maxLength) return `${label} must be ${maxLength} characters or fewer.`;
  return null;
}

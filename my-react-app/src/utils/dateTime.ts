/**
 * Centralized date and time utilities for the application.
 * Ensures consistent timezone handling across all components.
 */

// Currently, the backend explicitly groups and aggregates data in UTC.
// To ensure consistency between the chart and the table, we use UTC as the business timezone.
// If the backend is updated to use 'Asia/Ho_Chi_Minh', this constant should be updated accordingly.
export const BUSINESS_TIMEZONE = 'UTC';

/**
 * Formats a date string or object according to the business timezone.
 */
export const formatInBusinessTz = (
  date: Date | string,
  options: Intl.DateTimeFormatOptions,
  locale = 'vi-VN'
): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat(locale, {
    ...options,
    timeZone: BUSINESS_TIMEZONE,
  }).format(d);
};

/**
 * Returns a key for grouping by day (YYYY-MM-DD) in the business timezone.
 */
export const getBusinessDayKey = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  // Use en-CA locale for YYYY-MM-DD format
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    timeZone: BUSINESS_TIMEZONE,
  }).format(d);
};

/**
 * Returns a key for grouping by month (YYYY-MM) in the business timezone.
 */
export const getBusinessMonthKey = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    timeZone: BUSINESS_TIMEZONE,
  }).format(d);
};

/**
 * Returns a key for grouping by hour (YYYY-MM-DD HH:00) in the business timezone.
 */
export const getBusinessHourKey = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const datePart = getBusinessDayKey(d);
  const hour = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    hour12: false,
    timeZone: BUSINESS_TIMEZONE,
  }).format(d);
  return `${datePart} ${hour}:00`;
};

/**
 * Returns a human-readable day label (DD/MM) in the business timezone.
 */
export const getBusinessDayLabel = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    timeZone: BUSINESS_TIMEZONE,
  }).format(d);
};

/**
 * Returns a human-readable month label (MM/YYYY) in the business timezone.
 */
export const getBusinessMonthLabel = (date: Date | string): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('vi-VN', {
    month: '2-digit',
    year: 'numeric',
    timeZone: BUSINESS_TIMEZONE,
  }).format(d);
};

/**
 * Returns a date-only string (YYYY-MM-DD) in the local timezone.
 * Useful for <input type="date" /> initialization.
 */
export const toLocalDateOnly = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

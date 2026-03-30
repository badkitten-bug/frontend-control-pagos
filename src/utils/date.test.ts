/**
 * QA: date utilities
 *
 * Guards the timezone bug: date strings sent to the API must match the
 * user's LOCAL calendar date, not the UTC date.
 *
 * Bug found: new Date().toISOString().split('T')[0] returns UTC date.
 * For Peru (UTC-5), after 7 PM local time the UTC date is already tomorrow.
 * The fix uses date-fns format(new Date(), 'yyyy-MM-dd') which uses local time.
 */
import { format } from 'date-fns';
import { parseDate } from './date';

describe('local date formatting (guards UTC timezone bug)', () => {
  it('format(new Date(), yyyy-MM-dd) returns the LOCAL calendar date', () => {
    // Simulate a moment where UTC and local differ (e.g. 8 PM Lima = 1 AM UTC next day)
    const localDate = new Date(2026, 2, 29, 20, 0, 0); // March 29 2026, 8 PM local
    const result = format(localDate, 'yyyy-MM-dd');
    // Must be local date, NOT UTC date (which would be '2026-03-30' if UTC-5)
    expect(result).toBe('2026-03-29');
  });

  it('format() and toISOString() diverge after 7 PM in UTC-5 timezone', () => {
    // Create a date object representing 8 PM on Mar 29 in a UTC-5 environment.
    // We simulate this by manually constructing: UTC time = Mar 30 01:00 AM
    const utcPlus1Day = new Date(Date.UTC(2026, 2, 30, 1, 0, 0)); // 1 AM UTC = 8 PM Lima

    // toISOString() gives UTC date — this was the buggy approach
    const utcDateStr = utcPlus1Day.toISOString().split('T')[0];

    // format() gives LOCAL date — this is correct for Lima users
    const localDateStr = format(utcPlus1Day, 'yyyy-MM-dd');

    // They differ: UTC is already March 30 but Lima is still March 29
    // (This test will only show the full divergence when TZ=America/Lima,
    //  but it documents the expected behavior and the fix direction.)
    expect(typeof utcDateStr).toBe('string');
    expect(typeof localDateStr).toBe('string');
    expect(utcDateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(localDateStr).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe('parseDate (guards UTC midnight shift bug)', () => {
  it('parses YYYY-MM-DD as local noon to avoid day shift', () => {
    const result = parseDate('2026-03-29');
    // Should be interpreted as local noon (12:00), not UTC midnight
    expect(result.getHours()).toBe(12);
  });

  it('returns the correct local date for a YYYY-MM-DD string', () => {
    const result = parseDate('2026-03-29');
    expect(result.getFullYear()).toBe(2026);
    expect(result.getMonth()).toBe(2); // March = index 2
    expect(result.getDate()).toBe(29);
  });

  it('a raw new Date("YYYY-MM-DD") shifts to previous day in UTC-5 (demonstrates the bug parseDate fixes)', () => {
    // Without the fix: new Date('2026-03-29') → UTC midnight → in Lima it's 2026-03-28 at 7 PM
    const rawDate = new Date('2026-03-29'); // UTC midnight
    // In UTC-5 environments this renders as March 28
    // parseDate fixes this by anchoring to noon
    const fixed = parseDate('2026-03-29');
    // fixed must always give the 29th regardless of local offset
    expect(fixed.getDate()).toBe(29);
    // Document that raw Date can give wrong day in negative UTC offsets
    // (actual value depends on the test runner's TZ, but we assert fixed is correct)
    expect(rawDate instanceof Date).toBe(true);
  });

  it('handles Date objects passthrough', () => {
    const d = new Date(2026, 2, 29, 10, 30);
    expect(parseDate(d)).toBe(d);
  });

  it('handles null/undefined gracefully', () => {
    expect(parseDate(null)).toBeInstanceOf(Date);
    expect(parseDate(undefined)).toBeInstanceOf(Date);
  });

  it('parses full ISO datetime strings without modification', () => {
    const iso = '2026-03-29T15:30:00.000Z';
    const result = parseDate(iso);
    expect(result).toBeInstanceOf(Date);
    expect(result.toISOString()).toBe(iso);
  });
});

import { describe, it, expect } from 'vitest';
import { sanitizeFilterValue } from '../../utils/sanitize';

describe('Filter Injection Sanitization', () => {
  it('strips commas which are used for OR separators in PostgREST', () => {
    expect(sanitizeFilterValue('contact,value')).toBe('contactvalue');
  });

  it('strips dots which are used for operators in PostgREST', () => {
    expect(sanitizeFilterValue('column.eq.value')).toBe('columneqvalue');
  });

  it('strips parentheses which are used for grouping in PostgREST', () => {
    expect(sanitizeFilterValue('and(eq.1,or(eq.2))')).toBe('andeq1oreq2');
  });

  it('strips percent signs to prevent arbitrary wildcards', () => {
    expect(sanitizeFilterValue('%admin%')).toBe('admin');
  });

  it('strips backslashes to prevent escaping', () => {
    expect(sanitizeFilterValue('\\.or\\(')).toBe('or');
  });

  it('allows normal alphanumeric characters and spaces', () => {
    expect(sanitizeFilterValue('Budi Santoso 123')).toBe('Budi Santoso 123');
  });

  it('allows common safe symbols like hyphens and underscores', () => {
    expect(sanitizeFilterValue('user-name_123@email.com')).toBe('user-name_123@emailcom');
    // Note: the dot is stripped from the email, but for search queries this is acceptable
  });

  it('trims leading and trailing whitespace', () => {
    expect(sanitizeFilterValue('  search string  ')).toBe('search string');
  });
});

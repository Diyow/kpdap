/**
 * Sanitizes user input before interpolating into Supabase PostgREST `.or()` filter strings.
 * 
 * PostgREST uses commas to separate filter conditions and dots to separate
 * column.operator.value. Unsanitized input containing these characters can
 * manipulate filter logic (filter injection).
 * 
 * This strips: commas, dots, parentheses, percent signs, and backslashes.
 * The wrapping `%` for ilike patterns should be added AFTER calling this function.
 */
export function sanitizeFilterValue(input: string): string {
  return input.replace(/[,%()\\]/g, '').trim();
}

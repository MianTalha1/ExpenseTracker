/**
 * Date Utilities
 * Date formatting and manipulation helpers
 */
/**
 * Format date to ISO string (YYYY-MM-DD)
 */
export declare function toISODateString(date: Date): string;
/**
 * Format date for display
 */
export declare function formatDate(date: string | Date, options?: Intl.DateTimeFormatOptions): string;
/**
 * Format date with time
 */
export declare function formatDateTime(date: string | Date): string;
/**
 * Get relative time string (e.g., "2 days ago")
 */
export declare function getRelativeTime(date: string | Date): string;
/**
 * Get start of current month
 */
export declare function getStartOfMonth(date?: Date): Date;
/**
 * Get end of current month
 */
export declare function getEndOfMonth(date?: Date): Date;
/**
 * Get start of current week (Sunday)
 */
export declare function getStartOfWeek(date?: Date): Date;
/**
 * Get end of current week (Saturday)
 */
export declare function getEndOfWeek(date?: Date): Date;
/**
 * Check if date is today
 */
export declare function isToday(date: string | Date): boolean;
/**
 * Get date range for period
 */
export declare function getDateRange(period: 'week' | 'month' | 'year'): {
    start: Date;
    end: Date;
};
//# sourceMappingURL=date.d.ts.map
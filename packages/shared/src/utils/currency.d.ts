/**
 * Currency Utilities
 * Formatting and parsing currency values
 */
export interface CurrencyFormatOptions {
    locale?: string;
    currency?: string;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
}
/**
 * Format a number as currency
 */
export declare function formatCurrency(amount: number, options?: CurrencyFormatOptions): string;
/**
 * Format a number as compact currency (e.g., $1.2K)
 */
export declare function formatCompactCurrency(amount: number, options?: CurrencyFormatOptions): string;
/**
 * Parse a currency string to number
 */
export declare function parseCurrency(value: string): number;
/**
 * Format percentage
 */
export declare function formatPercentage(value: number, decimals?: number): string;
//# sourceMappingURL=currency.d.ts.map
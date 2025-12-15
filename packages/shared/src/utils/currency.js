/**
 * Currency Utilities
 * Formatting and parsing currency values
 */
const DEFAULT_OPTIONS = {
    locale: 'en-US',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
};
/**
 * Format a number as currency
 */
export function formatCurrency(amount, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    return new Intl.NumberFormat(opts.locale, {
        style: 'currency',
        currency: opts.currency,
        minimumFractionDigits: opts.minimumFractionDigits,
        maximumFractionDigits: opts.maximumFractionDigits,
    }).format(amount);
}
/**
 * Format a number as compact currency (e.g., $1.2K)
 */
export function formatCompactCurrency(amount, options = {}) {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    return new Intl.NumberFormat(opts.locale, {
        style: 'currency',
        currency: opts.currency,
        notation: 'compact',
        maximumFractionDigits: 1,
    }).format(amount);
}
/**
 * Parse a currency string to number
 */
export function parseCurrency(value) {
    const cleaned = value.replace(/[^0-9.-]/g, '');
    return parseFloat(cleaned) || 0;
}
/**
 * Format percentage
 */
export function formatPercentage(value, decimals = 0) {
    return `${value.toFixed(decimals)}%`;
}
//# sourceMappingURL=currency.js.map
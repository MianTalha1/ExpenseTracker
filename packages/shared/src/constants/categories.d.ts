/**
 * Default Categories
 * Pre-defined expense categories with colors and icons
 */
import type { DefaultCategoryName } from '../types/category';
export interface DefaultCategory {
    name: DefaultCategoryName;
    color: string;
    icon: string;
}
export declare const DEFAULT_CATEGORIES: DefaultCategory[];
export declare const CATEGORY_COLORS: Record<DefaultCategoryName, string>;
export declare const CATEGORY_ICONS: Record<DefaultCategoryName, string>;
//# sourceMappingURL=categories.d.ts.map
/**
 * Budget Types
 * Budget-related type definitions
 */
import type { Category } from './category';
export type BudgetPeriod = 'weekly' | 'monthly';
export interface Budget {
    id: number;
    userId: number;
    categoryId: number | null;
    category?: Category | null;
    amount: number;
    period: BudgetPeriod;
    createdAt: string;
}
export interface CreateBudgetRequest {
    categoryId?: number | null;
    amount: number;
    period: BudgetPeriod;
}
export interface UpdateBudgetRequest {
    categoryId?: number | null;
    amount?: number;
    period?: BudgetPeriod;
}
export interface BudgetWithProgress extends Budget {
    spent: number;
    remaining: number;
    percentage: number;
    status: 'safe' | 'warning' | 'danger' | 'exceeded';
}
export interface BudgetAlert {
    budgetId: number;
    categoryName: string | null;
    percentage: number;
    message: string;
    severity: 'warning' | 'critical' | 'exceeded';
}
//# sourceMappingURL=budget.d.ts.map
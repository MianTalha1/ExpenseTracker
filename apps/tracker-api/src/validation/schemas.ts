/**
 * Zod Validation Schemas
 * Request validation for all API endpoints
 */

import { z } from 'zod';

// ============================================================================
// Common Validators
// ============================================================================

const emailSchema = z.string().email('Invalid email format');
const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
const colorSchema = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be hex format #RRGGBB');
const positiveNumberSchema = z.number().positive('Amount must be positive');

// ============================================================================
// Auth Schemas
// ============================================================================

export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  name: z.string().min(1).max(255).optional(),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  email: emailSchema.optional(),
});

// ============================================================================
// Category Schemas
// ============================================================================

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  color: colorSchema,
  icon: z.string().max(50).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// ============================================================================
// Expense Schemas
// ============================================================================

export const createExpenseSchema = z.object({
  categoryId: z.number().int().positive('Category ID must be a positive integer'),
  amount: positiveNumberSchema,
  description: z.string().max(1000).optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }),
  isRecurring: z.boolean().optional().default(false),
  recurringInterval: z.enum(['weekly', 'monthly']).optional(),
});

export const updateExpenseSchema = z.object({
  categoryId: z.number().int().positive().optional(),
  amount: positiveNumberSchema.optional(),
  description: z.string().max(1000).optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid date format',
  }).optional(),
  isRecurring: z.boolean().optional(),
  recurringInterval: z.enum(['weekly', 'monthly']).optional().nullable(),
});

export const expenseQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  categoryId: z.coerce.number().int().positive().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['date', 'amount', 'createdAt']).optional().default('date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ============================================================================
// Budget Schemas
// ============================================================================

export const createBudgetSchema = z.object({
  categoryId: z.number().int().positive().nullable().optional(),
  amount: positiveNumberSchema,
  period: z.enum(['weekly', 'monthly']),
});

export const updateBudgetSchema = z.object({
  categoryId: z.number().int().positive().nullable().optional(),
  amount: positiveNumberSchema.optional(),
  period: z.enum(['weekly', 'monthly']).optional(),
});

// ============================================================================
// Insights Schemas
// ============================================================================

export const periodQuerySchema = z.object({
  period: z.enum(['week', 'month']).optional().default('month'),
});

export const dailyQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(365).optional().default(30),
});

export const aiAdviceSchema = z.object({
  period: z.enum(['week', 'month']).optional().default('month'),
  includeCategories: z.coerce.boolean().optional().default(true),
  includeTrends: z.coerce.boolean().optional().default(true),
  spendingData: z.object({
    totalSpent: z.number(),
    totalBudget: z.number(),
    categorySpending: z.array(z.object({
      name: z.string(),
      amount: z.number(),
      percentage: z.number(),
    })),
    trend: z.enum(['up', 'down', 'stable']),
    changePercentage: z.number(),
  }).optional(),
});

// ============================================================================
// Chat Schemas
// ============================================================================

export const sendMessageSchema = z.object({
  message: z.string().min(1, 'Message is required').max(4000),
  conversationId: z.string().optional(),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional(),
  context: z.object({
    totalSpent: z.number().optional(),
    totalBudget: z.number().optional(),
    remaining: z.number().optional(),
    topCategories: z.array(z.object({
      name: z.string(),
      amount: z.number(),
      percentage: z.number(),
    })).optional(),
    recentExpenses: z.array(z.object({
      description: z.string(),
      amount: z.number(),
      category: z.string(),
      date: z.string(),
    })).optional(),
    spendingTrend: z.enum(['up', 'down', 'stable']).optional(),
  }).optional(),
});

export const chatQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(50).optional().default(20),
});

// ============================================================================
// Common Param Schemas
// ============================================================================

export const idParamSchema = z.object({
  id: z.coerce.number().int().positive('ID must be a positive integer'),
});

// ============================================================================
// Type Exports
// ============================================================================

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;
export type ExpenseQueryInput = z.infer<typeof expenseQuerySchema>;
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;
export type PeriodQueryInput = z.infer<typeof periodQuerySchema>;
export type DailyQueryInput = z.infer<typeof dailyQuerySchema>;
export type AiAdviceInput = z.infer<typeof aiAdviceSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type ChatQueryInput = z.infer<typeof chatQuerySchema>;

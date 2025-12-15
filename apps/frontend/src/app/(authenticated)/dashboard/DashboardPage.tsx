/**
 * Dashboard Page
 * Main dashboard with Bento grid layout - connected to real APIs
 */

import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/context/AuthContext';
import { useDashboardData, useAIInsights } from '@/lib/hooks/useInsights';
import { useBudgets } from '@/lib/hooks/useBudgets';
import { useRecentExpenses } from '@/lib/hooks/useExpenses';
import { BentoCard, BudgetProgress, Skeleton } from '@/components/atoms';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  Calendar,
  Lightbulb,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';

// Category icon mapping
const categoryIcons: Record<string, string> = {
  Food: '🍔',
  Transport: '🚗',
  Bills: '💡',
  Entertainment: '🎬',
  Shopping: '🛍️',
  Health: '💊',
  Other: '📦',
};

export function DashboardPage() {
  const { user } = useAuth();
  const firstName = user?.name?.split(' ')[0] || 'there';

  // Fetch real data using hooks
  const { summary, trends, isLoading: isLoadingStats, error: statsError, refetch: refetchStats } = useDashboardData();
  const { categoryBudgets, isLoading: isLoadingBudgets } = useBudgets();
  const { expenses: recentExpenses, isLoading: isLoadingExpenses } = useRecentExpenses(4);
  const { insights: aiInsights, isLoading: isLoadingInsights } = useAIInsights('month');

  // Calculate days left in month
  const daysLeft = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  ).getDate() - new Date().getDate();

  // Get the first AI insight
  const primaryInsight = aiInsights[0];

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-in slide-in-up">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-text-primary">
          Welcome back, {firstName}
        </h1>
        <p className="text-text-secondary mt-1">
          Here's your spending overview for this month
        </p>
      </div>

      {/* Stats Grid - Top Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Total Spent */}
        <BentoCard className="p-5">
          {isLoadingStats ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-36" />
            </div>
          ) : statsError ? (
            <div className="flex items-center gap-2 text-error">
              <AlertCircle className="h-5 w-5" />
              <span className="text-sm">Failed to load stats</span>
              <button onClick={refetchStats} className="ml-auto p-1 hover:bg-surface-hover rounded">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">
                  Total Spent
                </p>
                <p className="text-3xl font-bold text-text-primary mt-1">
                  {formatCurrency(summary?.totalSpent || 0)}
                </p>
                {trends && (
                  <div
                    className={cn(
                      'flex items-center gap-1 mt-2 text-sm font-medium',
                      trends.trend === 'up' ? 'text-error' : 'text-success'
                    )}
                  >
                    {trends.trend === 'up' ? (
                      <TrendingUp className="h-4 w-4" />
                    ) : (
                      <TrendingDown className="h-4 w-4" />
                    )}
                    <span>
                      {Math.abs(trends.changePercentage).toFixed(0)}% vs last month
                    </span>
                  </div>
                )}
              </div>
              <div className="p-3 bg-casha-primary/10 rounded-bento-sm">
                <Wallet className="h-6 w-6 text-casha-primary" />
              </div>
            </div>
          )}
        </BentoCard>

        {/* Budget Left */}
        <BentoCard className="p-5">
          {isLoadingStats ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-4 w-36" />
            </div>
          ) : (
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-text-secondary">
                  Budget Remaining
                </p>
                <p className="text-3xl font-bold text-text-primary mt-1">
                  {formatCurrency(summary?.remaining || 0)}
                </p>
                <p className="text-sm text-text-muted mt-2">
                  {summary?.percentageUsed !== undefined
                    ? `${(100 - summary.percentageUsed).toFixed(0)}% of monthly budget`
                    : 'Set a budget to track'}
                </p>
              </div>
              <div className="p-3 bg-success/10 rounded-bento-sm">
                <Target className="h-6 w-6 text-success" />
              </div>
            </div>
          )}
        </BentoCard>

        {/* Days Left */}
        <BentoCard className="p-5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-medium text-text-secondary">
                Days Left
              </p>
              <p className="text-3xl font-bold text-text-primary mt-1">
                {daysLeft}
              </p>
              <p className="text-sm text-text-muted mt-2">
                in this month
              </p>
            </div>
            <div className="p-3 bg-info/10 rounded-bento-sm">
              <Calendar className="h-6 w-6 text-info" />
            </div>
          </div>
        </BentoCard>
      </div>

      {/* Main Grid - Middle Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Budget Progress */}
        <BentoCard
          header={
            <div className="flex items-center justify-between">
              <span>Budget Progress</span>
              <span className="text-xs text-text-muted font-normal">
                This Month
              </span>
            </div>
          }
        >
          {isLoadingBudgets ? (
            <div className="space-y-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </div>
          ) : categoryBudgets.length === 0 ? (
            <div className="py-8 text-center text-text-muted">
              <Target className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No budgets set yet</p>
              <Link to="/budgets" className="text-sm text-casha-primary hover:underline">
                Create your first budget
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {categoryBudgets.slice(0, 4).map((budget) => (
                <BudgetProgress
                  key={budget.id}
                  label={budget.category?.name || 'Overall'}
                  spent={budget.spent}
                  budget={budget.amount}
                  showAmounts
                  size="md"
                />
              ))}
            </div>
          )}
        </BentoCard>

        {/* Recent Expenses */}
        <BentoCard
          header={
            <div className="flex items-center justify-between">
              <span>Recent Expenses</span>
              <Link
                to="/expenses"
                className="text-xs text-casha-primary hover:underline font-normal"
              >
                View all
              </Link>
            </div>
          }
        >
          {isLoadingExpenses ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="flex items-center justify-between py-2">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-8 w-8 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-16 mt-1" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : recentExpenses.length === 0 ? (
            <div className="py-8 text-center text-text-muted">
              <Wallet className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No expenses yet</p>
              <p className="text-sm">Click "Add Expense" to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">
                      {categoryIcons[expense.category?.name || 'Other'] || '📦'}
                    </span>
                    <div>
                      <p className="font-medium text-text-primary">
                        {expense.description || expense.category?.name || 'Expense'}
                      </p>
                      <p className="text-xs text-text-muted">
                        {expense.category?.name || 'Uncategorized'}
                      </p>
                    </div>
                  </div>
                  <span className="font-semibold text-text-primary">
                    -{formatCurrency(expense.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </BentoCard>
      </div>

      {/* AI Insight - Bottom */}
      <BentoCard className="p-5 border-l-4 border-l-casha-primary">
        {isLoadingInsights ? (
          <div className="flex items-start gap-4">
            <Skeleton className="h-10 w-10 rounded-bento-sm" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ) : primaryInsight ? (
          <div className="flex items-start gap-4">
            <div
              className={cn(
                'p-2 rounded-bento-sm',
                primaryInsight.severity === 'warning'
                  ? 'bg-warning/10'
                  : primaryInsight.severity === 'success'
                  ? 'bg-success/10'
                  : 'bg-casha-primary/10'
              )}
            >
              <Lightbulb
                className={cn(
                  'h-5 w-5',
                  primaryInsight.severity === 'warning'
                    ? 'text-warning'
                    : primaryInsight.severity === 'success'
                    ? 'text-success'
                    : 'text-casha-primary'
                )}
              />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">
                {primaryInsight.title || 'AI Insight'}
              </h3>
              <p className="text-text-secondary mt-1">
                {primaryInsight.message}
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-4">
            <div className="p-2 bg-casha-primary/10 rounded-bento-sm">
              <Lightbulb className="h-5 w-5 text-casha-primary" />
            </div>
            <div>
              <h3 className="font-semibold text-text-primary">AI Insight</h3>
              <p className="text-text-secondary mt-1">
                Add more expenses to get personalized insights and recommendations
                about your spending habits.
              </p>
            </div>
          </div>
        )}
      </BentoCard>
    </div>
  );
}

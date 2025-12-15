/**
 * Budgets Page
 * Budget management and progress tracking with CRUD operations
 */

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Edit2, Trash2, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { BentoCard, Button, BudgetProgress, Badge, Modal, ModalFooter, Select, Skeleton } from '@/components/atoms';
import { FormField } from '@/components/molecules';
import { useBudgets } from '@/lib/hooks/useBudgets';
import { useCategories } from '@/lib/hooks/useCategories';
import type { BudgetWithProgress } from '@casha/shared';

// Budget form schema
const budgetSchema = z.object({
  categoryId: z.string().optional(),
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Amount must be a positive number',
    }),
  period: z.enum(['weekly', 'monthly']),
});

type BudgetFormData = z.infer<typeof budgetSchema>;

export function BudgetsPage() {
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editBudget, setEditBudget] = useState<BudgetWithProgress | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const {
    overallBudget,
    categoryBudgets,
    isLoading,
    error,
    refetch,
    createBudget,
    updateBudget,
    deleteBudget,
  } = useBudgets();

  const { categories } = useCategories();

  // Get categories that don't have budgets yet
  const availableCategories = categories.filter(
    (cat) => !categoryBudgets.some((b) => b.categoryId === cat.id)
  );

  // Form for add/edit
  const {
    register,
    handleSubmit,
    control,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BudgetFormData>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      categoryId: '',
      amount: '',
      period: 'monthly',
    },
  });

  // Open edit modal
  const handleEdit = (budget: BudgetWithProgress) => {
    setEditBudget(budget);
    setValue('categoryId', budget.categoryId ? String(budget.categoryId) : '');
    setValue('amount', String(budget.amount));
    setValue('period', budget.period as 'weekly' | 'monthly');
  };

  // Handle form submit (create or update)
  const onSubmit = async (data: BudgetFormData) => {
    try {
      const budgetData = {
        categoryId: data.categoryId || null,
        amount: parseFloat(data.amount),
        period: data.period,
      };

      if (editBudget) {
        await updateBudget(editBudget.id, budgetData);
        toast.success('Budget updated successfully');
        setEditBudget(null);
      } else {
        await createBudget(budgetData);
        toast.success('Budget created successfully');
        setAddModalOpen(false);
      }
      reset();
    } catch {
      toast.error(editBudget ? 'Failed to update budget' : 'Failed to create budget');
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    try {
      await deleteBudget(id);
      toast.success('Budget deleted successfully');
      setDeleteConfirmId(null);
    } catch {
      toast.error('Failed to delete budget');
    }
  };

  // Close modals
  const handleCloseModal = () => {
    setAddModalOpen(false);
    setEditBudget(null);
    reset();
  };

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-error mb-2">Failed to load budgets</p>
        <Button variant="secondary" size="sm" onClick={refetch}>
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in slide-in-up">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Budgets</h1>
          <p className="text-text-secondary mt-1">
            Set and track your spending limits
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setAddModalOpen(true)}
        >
          Add Budget
        </Button>
      </div>

      {/* Overall Budget - Featured Card */}
      {isLoading ? (
        <BentoCard className="p-6 border-2 border-casha-primary/20">
          <div className="space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
          </div>
        </BentoCard>
      ) : overallBudget ? (
        <BentoCard className="p-6 border-2 border-casha-primary/20">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-text-primary">
                Monthly Budget
              </h2>
              <p className="text-text-secondary text-sm">
                Your total spending limit for this month
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => handleEdit(overallBudget)}
              >
                <Edit2 className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setDeleteConfirmId(overallBudget.id)}
                className="text-text-muted hover:text-error"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <div>
              <p className="text-sm text-text-muted">Budget</p>
              <p className="text-2xl font-bold text-text-primary">
                ${overallBudget.amount.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Spent</p>
              <p className="text-2xl font-bold text-error">
                ${overallBudget.spent.toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-text-muted">Remaining</p>
              <p className="text-2xl font-bold text-success">
                ${overallBudget.remaining.toLocaleString()}
              </p>
            </div>
          </div>

          <BudgetProgress
            spent={overallBudget.spent}
            budget={overallBudget.amount}
            showAmounts={false}
            size="lg"
          />
        </BentoCard>
      ) : (
        <BentoCard
          className="p-6 border-2 border-dashed border-casha-primary/30 cursor-pointer hover:border-casha-primary/50"
          onClick={() => {
            setValue('categoryId', '');
            setAddModalOpen(true);
          }}
        >
          <div className="text-center py-4">
            <Plus className="h-10 w-10 mx-auto mb-2 text-casha-primary/50" />
            <h2 className="text-lg font-semibold text-text-primary">
              Set Overall Budget
            </h2>
            <p className="text-text-secondary text-sm mt-1">
              Click to create your monthly spending limit
            </p>
          </div>
        </BentoCard>
      )}

      {/* Category Budgets */}
      <div>
        <h2 className="text-lg font-semibold text-text-primary mb-4">
          Category Budgets
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <BentoCard key={i} className="p-4">
                <div className="flex items-center gap-3 mb-3">
                  <Skeleton className="h-10 w-10 rounded-bento-sm" />
                  <div>
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-24 mt-1" />
                  </div>
                </div>
                <Skeleton className="h-2 w-full rounded-full" />
              </BentoCard>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {categoryBudgets.map((budget) => {
              const percentage = budget.percentage;
              const categoryColor = categories.find(c => c.id === budget.categoryId)?.color || '#6B7280';

              return (
                <BentoCard key={budget.id} className="p-4 group" hover="lift">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-10 w-10 rounded-bento-sm flex items-center justify-center"
                        style={{ backgroundColor: `${categoryColor}20` }}
                      >
                        <div
                          className="h-4 w-4 rounded-full"
                          style={{ backgroundColor: categoryColor }}
                        />
                      </div>
                      <div>
                        <h3 className="font-medium text-text-primary">
                          {budget.category?.name || 'Category'}
                        </h3>
                        <p className="text-sm text-text-muted">
                          ${budget.spent} of ${budget.amount}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          percentage >= 100
                            ? 'error'
                            : percentage >= 80
                            ? 'warning'
                            : 'success'
                        }
                        size="sm"
                      >
                        {budget.status === 'exceeded'
                          ? 'Exceeded'
                          : `$${budget.remaining} left`}
                      </Badge>

                      {/* Edit/Delete buttons */}
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleEdit(budget)}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteConfirmId(budget.id)}
                          className="text-text-muted hover:text-error"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <BudgetProgress
                    spent={budget.spent}
                    budget={budget.amount}
                    showAmounts={false}
                    size="md"
                  />
                </BentoCard>
              );
            })}

            {/* Add New Budget Card */}
            {availableCategories.length > 0 && (
              <BentoCard
                className="p-4 border-2 border-dashed border-border hover:border-casha-primary/50 cursor-pointer"
                hover="lift"
                onClick={() => setAddModalOpen(true)}
              >
                <div className="h-full flex flex-col items-center justify-center py-6 text-text-muted hover:text-casha-primary transition-colors">
                  <Plus className="h-8 w-8 mb-2" />
                  <span className="font-medium">Add Category Budget</span>
                </div>
              </BentoCard>
            )}
          </div>
        )}

        {!isLoading && categoryBudgets.length === 0 && availableCategories.length > 0 && (
          <div className="text-center py-8 text-text-muted">
            <p>No category budgets yet</p>
            <Button
              variant="link"
              size="sm"
              onClick={() => setAddModalOpen(true)}
              className="mt-2"
            >
              Create your first category budget
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Budget Modal */}
      <Modal
        isOpen={addModalOpen || editBudget !== null}
        onClose={handleCloseModal}
        title={editBudget ? 'Edit Budget' : 'Add Budget'}
        description={editBudget ? 'Update your budget settings' : 'Set a spending limit for a category'}
        size="md"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Category Selection - only for new budgets */}
          {!editBudget && (
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-text-primary">
                Category (leave empty for overall budget)
              </label>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Select
                    {...field}
                    placeholder="Overall Budget"
                    options={[
                      { value: '', label: 'Overall Budget (All Categories)' },
                      ...availableCategories.map((cat) => ({
                        value: String(cat.id),
                        label: cat.name,
                      })),
                    ]}
                  />
                )}
              />
            </div>
          )}

          {/* Amount */}
          <FormField
            label="Budget Amount"
            type="text"
            inputMode="decimal"
            placeholder="0.00"
            leftIcon={<DollarSign className="h-4 w-4" />}
            error={errors.amount?.message}
            {...register('amount')}
          />

          {/* Period */}
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-text-primary">
              Budget Period
            </label>
            <Controller
              name="period"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={[
                    { value: 'monthly', label: 'Monthly' },
                    { value: 'weekly', label: 'Weekly' },
                  ]}
                />
              )}
            />
          </div>

          <ModalFooter>
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Cancel
            </Button>
            <Button type="submit" isLoading={isSubmitting}>
              {editBudget ? 'Update Budget' : 'Create Budget'}
            </Button>
          </ModalFooter>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteConfirmId !== null}
        onClose={() => setDeleteConfirmId(null)}
        title="Delete Budget"
        description="Are you sure you want to delete this budget? This action cannot be undone."
        size="sm"
      >
        <ModalFooter>
          <Button variant="secondary" onClick={() => setDeleteConfirmId(null)}>
            Cancel
          </Button>
          <Button
            variant="danger"
            onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
          >
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
}

/**
 * AddExpenseModal Organism
 * Modal form for adding new expenses
 */

import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DollarSign, Calendar, FileText, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { Modal, ModalFooter, Button, Select } from '@/components/atoms';
import { FormField } from '@/components/molecules';
import { useCategories } from '@/lib/hooks/useCategories';
import { createExpense } from '@/lib/firebase/services';
import { cn } from '@/lib/utils/cn';

const addExpenseSchema = z.object({
  amount: z
    .string()
    .min(1, 'Amount is required')
    .refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0, {
      message: 'Amount must be a positive number',
    }),
  categoryId: z.string().min(1, 'Category is required'),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  isRecurring: z.boolean().default(false),
  recurringInterval: z.enum(['weekly', 'monthly']).optional(),
});

type AddExpenseFormData = z.infer<typeof addExpenseSchema>;

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddExpenseModal({ isOpen, onClose, onSuccess }: AddExpenseModalProps) {
  const { categories, isLoading: isLoadingCategories } = useCategories();

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddExpenseFormData>({
    resolver: zodResolver(addExpenseSchema),
    defaultValues: {
      amount: '',
      categoryId: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      isRecurring: false,
      recurringInterval: undefined,
    },
  });

  const isRecurring = watch('isRecurring');

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      reset();
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: AddExpenseFormData) => {
    try {
      await createExpense({
        amount: parseFloat(data.amount),
        categoryId: data.categoryId,
        description: data.description || undefined,
        date: data.date,
        isRecurring: data.isRecurring,
        recurringInterval: data.isRecurring ? data.recurringInterval : undefined,
      });

      toast.success('Expense added successfully!');
      reset();
      onClose();
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to add expense. Please try again.');
    }
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add Expense"
      description="Track a new expense in your budget"
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Amount */}
        <FormField
          label="Amount"
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          leftIcon={<DollarSign className="h-4 w-4" />}
          error={errors.amount?.message}
          {...register('amount')}
        />

        {/* Category */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-text-primary">
            Category <span className="text-error">*</span>
          </label>
          <Controller
            name="categoryId"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="Select a category"
                disabled={isLoadingCategories}
                error={!!errors.categoryId}
                options={categories.map((cat) => ({
                  value: String(cat.id),
                  label: cat.name,
                }))}
              />
            )}
          />
          {errors.categoryId && (
            <p className="text-xs text-error">{errors.categoryId.message}</p>
          )}
        </div>

        {/* Description */}
        <FormField
          label="Description"
          placeholder="What was this expense for?"
          leftIcon={<FileText className="h-4 w-4" />}
          {...register('description')}
        />

        {/* Date */}
        <FormField
          label="Date"
          type="date"
          leftIcon={<Calendar className="h-4 w-4" />}
          error={errors.date?.message}
          {...register('date')}
        />

        {/* Recurring Toggle */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-text-muted" />
            <div>
              <p className="text-sm font-medium text-text-primary">Recurring Expense</p>
              <p className="text-xs text-text-muted">Repeat this expense automatically</p>
            </div>
          </div>
          <Controller
            name="isRecurring"
            control={control}
            render={({ field }) => (
              <button
                type="button"
                onClick={() => field.onChange(!field.value)}
                className={cn(
                  'relative w-11 h-6 rounded-full transition-colors duration-200',
                  field.value ? 'bg-casha-primary' : 'bg-border'
                )}
              >
                <span
                  className={cn(
                    'absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform duration-200 shadow-sm',
                    field.value && 'translate-x-5'
                  )}
                />
              </button>
            )}
          />
        </div>

        {/* Recurring Interval */}
        {isRecurring && (
          <div className="space-y-1.5 animate-in slide-in-up">
            <label className="text-sm font-medium text-text-primary">
              Repeat Every
            </label>
            <Controller
              name="recurringInterval"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  value={field.value || ''}
                  placeholder="Select frequency"
                  options={[
                    { value: 'weekly', label: 'Weekly' },
                    { value: 'monthly', label: 'Monthly' },
                  ]}
                />
              )}
            />
          </div>
        )}

        {/* Footer Actions */}
        <ModalFooter>
          <Button type="button" variant="secondary" onClick={handleClose}>
            Cancel
          </Button>
          <Button type="submit" isLoading={isSubmitting}>
            Add Expense
          </Button>
        </ModalFooter>
      </form>
    </Modal>
  );
}

import { cn } from '@/lib/utils';
import { SelectHTMLAttributes, forwardRef } from 'react';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, id, children, ...props }, ref) => {
    return (
      <div>
        {label && <label htmlFor={id} className="label">{label}</label>}
        <select ref={ref} id={id} className={cn('input', className)} {...props}>
          {children}
        </select>
      </div>
    );
  }
);
Select.displayName = 'Select';

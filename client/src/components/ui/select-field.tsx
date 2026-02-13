import * as React from 'react';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface SelectFieldOption {
  value: string;
  label: string;
}

export interface SelectFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (e: { target: { value: string } }) => void;
  options: SelectFieldOption[];
  disabled?: boolean;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export function SelectField({
  id,
  label,
  value,
  onChange,
  options,
  disabled = false,
  required = false,
  className,
  placeholder = 'Selecione...',
}: SelectFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>
      <Select
        value={value || undefined}
        onValueChange={(val) => onChange({ target: { value: val ?? '' } })}
        disabled={disabled}
      >
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

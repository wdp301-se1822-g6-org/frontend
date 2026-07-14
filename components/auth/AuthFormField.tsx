'use client';

import { useState } from 'react';
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from 'react-hook-form';
import { Eye, EyeOff, type LucideIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Field, FieldError, FieldLabel } from '@/components/ui/field';
import { cn } from '@/lib/utils';

/** Class dùng chung cho input của form xác thực - tránh lặp chuỗi className dài. */
const AUTH_INPUT_CLASS =
  'h-12 rounded-xl border-primary/10 bg-muted/40 pl-11 transition-all focus:border-primary focus:bg-background focus:ring-primary/20';

type AuthFormFieldProps<T extends FieldValues> = {
  control: Control<T>;
  name: Path<T>;
  id: string;
  label: string;
  icon: LucideIcon;
  type?: 'text' | 'email' | 'password' | 'tel';
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
};

/**
 * Một trường nhập liệu của form xác thực: label + icon + input + lỗi.
 * Gom phần markup từng lặp ~6 lần giữa LoginForm và RegisterForm.
 * Khi `type='password'` tự thêm nút ẩn/hiện mật khẩu.
 */
export function AuthFormField<T extends FieldValues>({
  control,
  name,
  id,
  label,
  icon: Icon,
  type = 'text',
  placeholder,
  autoComplete,
  disabled,
}: AuthFormFieldProps<T>) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState }) => (
        <Field data-invalid={fieldState.invalid}>
          <FieldLabel htmlFor={id}>{label}</FieldLabel>
          <div className='group relative'>
            <Icon className='absolute top-1/2 left-3.5 size-4.5 -translate-y-1/2 text-foreground/30 transition-colors group-focus-within:text-primary' />
            <Input
              {...field}
              id={id}
              type={inputType}
              disabled={disabled}
              placeholder={placeholder}
              autoComplete={autoComplete}
              aria-invalid={fieldState.invalid}
              className={cn(AUTH_INPUT_CLASS, isPassword && 'pr-11')}
            />
            {isPassword && (
              <button
                type='button'
                tabIndex={-1}
                disabled={disabled}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                className='absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-muted-foreground transition-colors hover:text-foreground'
              >
                {showPassword ? (
                  <Eye className='size-4' />
                ) : (
                  <EyeOff className='size-4' />
                )}
              </button>
            )}
          </div>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </Field>
      )}
    />
  );
}

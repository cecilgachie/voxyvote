import React, { useState } from 'react';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  variant?: 'default' | 'filled' | 'outlined';
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  variant = 'default',
  className,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(!!props.value);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(!!e.target.value);
    props.onChange?.(e);
  };

  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    props.onFocus?.(e);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    props.onBlur?.(e);
  };

  const baseClasses = 'w-full transition-all duration-200 focus:outline-none';
  
  const variantClasses = {
    default: 'border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
    filled: 'bg-gray-50 border-2 border-transparent rounded-xl px-4 py-3 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200',
    outlined: 'border-2 border-gray-300 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 bg-transparent'
  };

  const errorClasses = error ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : '';

  return (
    <div className="relative">
      {label && (
        <label className={clsx(
          'absolute left-4 transition-all duration-200 pointer-events-none',
          isFocused || hasValue 
            ? 'top-2 text-xs text-blue-600 font-medium' 
            : 'top-3 text-sm text-gray-500'
        )}>
          {label}
        </label>
      )}
      
      <div className="relative">
        {icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            {icon}
          </div>
        )}
        
        <input
          {...props}
          className={clsx(
            baseClasses,
            variantClasses[variant],
            errorClasses,
            icon && 'pl-10',
            label && (isFocused || hasValue) && 'pt-6 pb-2',
            label && !isFocused && !hasValue && 'py-3',
            className
          )}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
        />
      </div>
      
      {error && (
        <p className="mt-1 text-sm text-red-600 flex items-center">
          <span className="mr-1">⚠</span>
          {error}
        </p>
      )}
    </div>
  );
};
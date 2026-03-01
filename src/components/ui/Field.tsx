// src/components/ui/Field.tsx
import React from 'react';

interface FieldProps {
    id: string;
    label: string;
    required?: boolean;
    error?: string;
    helper?: string;
    children: React.ReactNode;
}

export function Field({ id, label, required, error, helper, children }: FieldProps) {
    return (
        <div className="flex flex-col gap-1 w-full">
            <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                {label}
                {required && <span className="text-rose-500 ml-1" aria-hidden="true">*</span>}
            </label>
            {children}
            {error && <p className="text-rose-500 text-xs mt-0.5">{error}</p>}
            {helper && !error && <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{helper}</p>}
        </div>
    );
}

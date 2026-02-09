import React, { ButtonHTMLAttributes, forwardRef } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg';
}

export const buttonVariants = (variant: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' = 'primary', size: 'sm' | 'md' | 'lg' = 'md', className: string = '') => {
    const baseStyles = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 disabled:pointer-events-none disabled:opacity-50';

    const variants = {
        primary: 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm',
        secondary: 'bg-slate-100 text-slate-900 hover:bg-slate-200',
        outline: 'border border-slate-200 bg-transparent hover:bg-slate-100 text-slate-900',
        ghost: 'hover:bg-slate-100 text-slate-700 hover:text-slate-900',
        danger: 'bg-rose-600 text-white hover:bg-rose-700 shadow-sm', // rose is not in our theme, replacing with red or defining rose in globals
    };

    const sizes = {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 py-2 text-sm',
        lg: 'h-12 px-8 text-base',
    };

    return `${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`;
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(({
    className = '',
    variant = 'primary',
    size = 'md',
    children,
    ...props
}, ref) => {
    const combinedClassName = buttonVariants(variant, size, className);

    return (
        <button
            ref={ref}
            className={combinedClassName}
            {...props}
        >
            {children}
        </button>
    );
});

Button.displayName = 'Button';

export default Button;

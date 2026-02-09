import React, { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
    noPadding?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(({
    className = '',
    children,
    noPadding = false,
    ...props
}, ref) => {
    return (
        <div
            ref={ref}
            className={`bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg shadow-sm ${noPadding ? '' : 'p-6'} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
});

Card.displayName = 'Card';

export default Card;

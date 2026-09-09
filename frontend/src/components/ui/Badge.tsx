import React from 'react';

interface BadgeProps {
  variant?: 'blue' | 'purple' | 'indigo' | 'amber' | 'emerald' | 'rose' | 'gray' | 'green';
  children: React.ReactNode;
  className?: string;
}

const variantClasses = {
  blue: 'bg-blue-500/10 text-blue-700 border-blue-200',
  purple: 'bg-purple-500/10 text-purple-700 border-purple-200',
  indigo: 'bg-indigo-500/10 text-indigo-700 border-indigo-200',
  amber: 'bg-amber-500/10 text-amber-700 border-amber-200',
  emerald: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
  rose: 'bg-rose-500/10 text-rose-700 border-rose-200',
  gray: 'bg-gray-500/10 text-gray-600 border-gray-200',
  green: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
};

export function Badge({ variant = 'gray', children, className = '' }: BadgeProps) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-[4px] border ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}

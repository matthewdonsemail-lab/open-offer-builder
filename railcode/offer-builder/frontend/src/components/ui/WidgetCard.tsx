import React from 'react';

interface WidgetCardProps {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function WidgetCard({ title, subtitle, action, children, className = '' }: WidgetCardProps) {
  return (
    <div className={`bg-[var(--ods-bg-primary,#ffffff)] border border-[var(--ods-border,#e5e5ea)] rounded-[6px] flex flex-col overflow-hidden ${className}`}>
      {(title || action) && (
        <div className="h-8 min-h-[32px] px-3 border-b border-[var(--ods-border,#e5e5ea)] flex items-center justify-between">
          <div className="flex flex-col">
            {title && (
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ods-text-tertiary,#8a8a93)]">
                {title}
              </span>
            )}
            {subtitle && (
              <span className="text-[12px] text-[var(--ods-text-secondary,#575757)] mt-0.5">
                {subtitle}
              </span>
            )}
          </div>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-3 md:p-4 flex-1">
        {children}
      </div>
    </div>
  );
}

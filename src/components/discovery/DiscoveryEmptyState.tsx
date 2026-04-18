import React from 'react';

type DiscoveryEmptyStateProps = {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
};

export function DiscoveryEmptyState({ icon, title, description, action }: DiscoveryEmptyStateProps) {
  return (
    <div className="glass-panel flex flex-col items-center rounded-[1.75rem] border-dashed py-12 text-center">
      {icon != null && (
        <div className="glass-surface mb-4 rounded-full p-4">{icon}</div>
      )}
      <p className="text-lg font-semibold text-foreground">{title}</p>
      <p className="mt-2 text-sm text-muted">{description}</p>
      {action != null && <div className="mt-6">{action}</div>}
    </div>
  );
}

import React from 'react';

type DiscoveryHeaderProps = {
  kicker: React.ReactNode;
  kickerClassName?: string;
  title: string;
  subtitle: string;
  aside?: React.ReactNode;
  /** Content rendered below the title row, inside the glass panel (e.g. active filter chips) */
  children?: React.ReactNode;
};

export function DiscoveryHeader({
  kicker,
  kickerClassName,
  title,
  subtitle,
  aside,
  children,
}: DiscoveryHeaderProps) {
  return (
    <div className="glass-panel mb-6 rounded-[1.75rem] p-6 sm:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div
            className={`editorial-kicker mb-4 w-fit ${kickerClassName ?? 'border-brand/20 bg-brand/10 text-brand-soft'}`}
          >
            {kicker}
          </div>
          <h1 className="text-3xl font-semibold text-foreground">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>
        </div>
        {aside != null && <div className="flex-shrink-0">{aside}</div>}
      </div>
      {children != null && <div className="mt-5">{children}</div>}
    </div>
  );
}

type SemanticToneConfig = {
    badge: string;
    dot: string;
    heroPrimaryToken: string;
    heroSecondaryToken: string;
    icon: string;
    panel: string;
    pill: string;
    row: string;
    track: string;
};

export type SemanticTone =
    | 'approval'
    | 'brand'
    | 'connection'
    | 'danger'
    | 'discovery'
    | 'info'
    | 'success'
    | 'warning';

type LegacyTone = 'amber' | 'emerald' | 'rose' | 'sky' | 'violet';

export type ToneName = SemanticTone | LegacyTone;

const semanticToneClasses: Record<SemanticTone, SemanticToneConfig> = {
    approval: {
        badge: 'border-approval/20 bg-approval/10 text-approval-soft',
        dot: 'bg-approval',
        heroPrimaryToken: '--color-approval-start-rgb',
        heroSecondaryToken: '--color-discovery-end-rgb',
        icon: 'bg-approval/12 text-approval',
        panel: 'border-approval/18 bg-approval/10',
        pill: 'border border-approval/20 bg-approval/15 text-approval-soft',
        row: 'hover:border-approval/30',
        track: 'peer-checked:bg-approval/60',
    },
    brand: {
        badge: 'border-brand/20 bg-brand/10 text-brand-soft',
        dot: 'bg-brand',
        heroPrimaryToken: '--color-brand-start-rgb',
        heroSecondaryToken: '--color-discovery-end-rgb',
        icon: 'bg-brand/12 text-brand',
        panel: 'border-brand/18 bg-brand/10',
        pill: 'border border-brand/20 bg-brand/15 text-brand-soft',
        row: 'hover:border-brand/30',
        track: 'peer-checked:bg-brand/60',
    },
    connection: {
        badge: 'border-connection/20 bg-connection/10 text-connection-soft',
        dot: 'bg-connection',
        heroPrimaryToken: '--color-connection-start-rgb',
        heroSecondaryToken: '--color-connection-end-rgb',
        icon: 'bg-connection/12 text-connection',
        panel: 'border-connection/18 bg-connection/10',
        pill: 'border border-connection/20 bg-connection/15 text-connection-soft',
        row: 'hover:border-connection/30',
        track: 'peer-checked:bg-connection/60',
    },
    danger: {
        badge: 'border-danger/20 bg-danger/10 text-danger-soft',
        dot: 'bg-danger',
        heroPrimaryToken: '--color-danger-start-rgb',
        heroSecondaryToken: '--color-connection-end-rgb',
        icon: 'bg-danger/12 text-danger',
        panel: 'border-danger/18 bg-danger/10',
        pill: 'border border-danger/20 bg-danger/15 text-danger-soft',
        row: 'hover:border-danger/30',
        track: 'peer-checked:bg-danger/60',
    },
    discovery: {
        badge: 'border-discovery/20 bg-discovery/10 text-discovery-soft',
        dot: 'bg-discovery',
        heroPrimaryToken: '--color-discovery-start-rgb',
        heroSecondaryToken: '--color-info-end-rgb',
        icon: 'bg-discovery/12 text-discovery',
        panel: 'border-discovery/18 bg-discovery/10',
        pill: 'border border-discovery/20 bg-discovery/15 text-discovery-soft',
        row: 'hover:border-discovery/30',
        track: 'peer-checked:bg-discovery/60',
    },
    info: {
        badge: 'border-info/20 bg-info/10 text-info-soft',
        dot: 'bg-info',
        heroPrimaryToken: '--color-info-start-rgb',
        heroSecondaryToken: '--color-discovery-end-rgb',
        icon: 'bg-info/12 text-info',
        panel: 'border-info/18 bg-info/10',
        pill: 'border border-info/20 bg-info/15 text-info-soft',
        row: 'hover:border-info/30',
        track: 'peer-checked:bg-info/60',
    },
    success: {
        badge: 'border-success/20 bg-success/10 text-success-soft',
        dot: 'bg-success',
        heroPrimaryToken: '--color-success-start-rgb',
        heroSecondaryToken: '--color-approval-end-rgb',
        icon: 'bg-success/12 text-success',
        panel: 'border-success/18 bg-success/10',
        pill: 'border border-success/20 bg-success/15 text-success-soft',
        row: 'hover:border-success/30',
        track: 'peer-checked:bg-success/60',
    },
    warning: {
        badge: 'border-warning/20 bg-warning/10 text-warning-soft',
        dot: 'bg-warning',
        heroPrimaryToken: '--color-warning-start-rgb',
        heroSecondaryToken: '--color-connection-end-rgb',
        icon: 'bg-warning/12 text-warning',
        panel: 'border-warning/18 bg-warning/10',
        pill: 'border border-warning/20 bg-warning/15 text-warning-soft',
        row: 'hover:border-warning/30',
        track: 'peer-checked:bg-warning/60',
    },
};

const legacyToneAliases: Record<LegacyTone, SemanticTone> = {
    amber: 'warning',
    emerald: 'approval',
    rose: 'danger',
    sky: 'info',
    violet: 'discovery',
};

const isSemanticTone = (tone: ToneName): tone is SemanticTone =>
    Object.prototype.hasOwnProperty.call(semanticToneClasses, tone);

export const getSemanticToneClasses = (tone: ToneName) =>
    semanticToneClasses[isSemanticTone(tone) ? tone : legacyToneAliases[tone]];

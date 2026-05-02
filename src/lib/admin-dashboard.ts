

export type AdminDashboardOverview = {
  totalProfiles: number;
  verifiedProfiles: number;
  completedProfiles: number;
  totalMessages: number;
  totalFavorites: number;
  totalNotifications: number;
  unreadNotifications: number;
  activePushSubscriptions: number;
  totalReports: number;
  pendingReports: number;
  totalVerificationRequests: number;
  pendingVerificationRequests: number;
};

export type AdminQueueUser = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  verified: boolean;
  location: string | null;
  avatarUrl: string | null;
};

export type AdminReportQueueItem = {
  id: string;
  reason: string;
  status: string;
  createdAt: string | null;
  reporterId: string | null;
  reportedId: string | null;
  reporter: AdminQueueUser | null;
  reported: AdminQueueUser | null;
};

export type AdminVerificationQueueItem = {
  id: string;
  userId: string;
  status: string;
  createdAt: string | null;
  profile: AdminQueueUser | null;
};

export type AdminQuickActions = {
  pendingReports: number;
  pendingVerificationRequests: number;
  flaggedUsers: number;
  unreadNotifications: number;
  totalQueueItems: number;
};

export type AdminSystemControls = {
  maintenanceBannerText: string;
  moderationHold: boolean;
  followUpUserIds: string[];
  updatedAt: string | null;
};

export const DEFAULT_ADMIN_SYSTEM_CONTROLS: AdminSystemControls = {
  maintenanceBannerText: '',
  moderationHold: false,
  followUpUserIds: [],
  updatedAt: null,
};

export type AdminDashboardSnapshot = {
  overview: AdminDashboardOverview;
  queues: {
    reports: AdminReportQueueItem[];
    verificationRequests: AdminVerificationQueueItem[];
  };
  quickActions: AdminQuickActions;
  systemControls: AdminSystemControls;
  lastUpdatedAt: string;
};

export type AdminUserSearchResult = {
  id: string;
  displayName: string;
  firstName: string | null;
  lastName: string | null;
  verified: boolean;
  location: string | null;
  joinedAt: string | null;
  lastActiveAt: string | null;
  openReports: number;
  pendingVerification: boolean;
  savedSearchCount: number;
  blockedCount: number;
  messageCount: number;
  flaggedForFollowUp: boolean;
};

export type AdminInvestigationMessage = {
  id: string;
  createdAt: string | null;
  direction: 'sent' | 'received';
  content: string;
  sender: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
  receiver: {
    id: string;
    firstName: string | null;
    lastName: string | null;
  };
};

export type AdminSavedSearchRecord = {
  id: string;
  name: string;
  query: string | null;
  location: string | null;
  language: string | null;
  gender: string | null;
  minAge: number | null;
  maxAge: number | null;
  passionIds: string[];
  createdAt: string | null;
};

export type AdminBlockedUserRecord = {
  id: string;
  blockedId: string | null;
  createdAt: string | null;
  profile: AdminQueueUser | null;
};

export type AdminVerificationHistoryRecord = {
  id: string;
  status: string;
  createdAt: string | null;
};

export type AdminNotificationRecord = {
  id: string;
  type: string;
  read: boolean;
  createdAt: string | null;
  actorId: string | null;
  title: string | null;
  body: string | null;
  url: string | null;
};

export type AdminUserInvestigation = {
  user: AdminUserSearchResult & {
    aboutMe: string | null;
    age: number | null;
    gender: string | null;
    passions: string[];
    languages: string[];
    isPrivate: boolean;
  };
  messages: AdminInvestigationMessage[];
  savedSearches: AdminSavedSearchRecord[];
  blockedUsers: AdminBlockedUserRecord[];
  verificationHistory: AdminVerificationHistoryRecord[];
  notifications: AdminNotificationRecord[];
  reportsFiled: AdminReportQueueItem[];
  reportsAgainst: AdminReportQueueItem[];
};

export type AdminOutreachRequest = {
  action: 'send-message' | 'send-notification' | 'toggle-verification' | 'toggle-follow-up';
  content?: string;
  title?: string;
  url?: string;
  verified?: boolean;
  followUp?: boolean;
};

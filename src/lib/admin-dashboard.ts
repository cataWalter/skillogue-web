export type LeaderboardEntry = {
  label: string;
  value: number;
};

export type DailySeriesPoint = {
  date: string;
  label: string;
  totalEvents: number;
  searches: number;
  messages: number;
  favorites: number;
  profileViews: number;
  notifications: number;
};

export type HealthItem = {
  title: string;
  status: 'good' | 'watch' | 'critical';
  detail: string;
};

export type RecentEvent = {
  id: string;
  eventName: string;
  path: string | null;
  createdAt: string | null;
  properties: Record<string, unknown>;
};

export type AdminAnalyticsFilters = {
  eventType: string | null;
  path: string | null;
  availableEventTypes: string[];
  availablePaths: string[];
  exportUrl: string;
};

export type AnalyticsOverview = {
  range: {
    days: number | null;
    label: string;
    trendWindowDays: number;
  };
  filters: AdminAnalyticsFilters;
  overview: {
    totalEvents: number;
    pageViews: number;
    uniquePaths: number;
    lastEventAt: string | null;
    totalProfiles: number;
    verifiedProfiles: number;
    completedProfiles: number;
    totalMessages: number;
    totalFavorites: number;
  };
  acquisition: {
    signupCompleted: number;
    emailVerified: number;
    onboardingCompleted: number;
    funnel: LeaderboardEntry[];
  };
  search: {
    submitted: number;
    resultsLoaded: number;
    zeroResults: number;
    resultClicks: number;
    savedSearches: number;
    averageResultsPerSearch: number;
    topQueries: LeaderboardEntry[];
    topPassions: LeaderboardEntry[];
    topLocations: LeaderboardEntry[];
    topLanguages: LeaderboardEntry[];
  };
  engagement: {
    profileViews: number;
    favoritesAdded: number;
    favoritesRemoved: number;
    messageStarted: number;
    messagesSent: number;
    funnel: LeaderboardEntry[];
  };
  notifications: {
    total: number;
    unread: number;
    activePushSubscriptions: number;
    pushEnabled: number;
    pushDisabled: number;
    notificationOpened: number;
  };
  trustAndSafety: {
    totalReports: number;
    pendingReports: number;
    openReports: number;
    reportSubmittedTracked: number;
    totalVerificationRequests: number;
    pendingVerificationRequests: number;
    verificationRequestedTracked: number;
  };
  content: {
    topPaths: LeaderboardEntry[];
    topViewedProfiles: LeaderboardEntry[];
    topPassions: LeaderboardEntry[];
    topLocations: LeaderboardEntry[];
    topLanguages: LeaderboardEntry[];
  };
  activity: {
    eventsLast7d: number;
    eventsLast30d: number;
    activeDaysLast7d: number;
    activeDaysLast30d: number;
    trendWindowDays: number;
    dailySeries: DailySeriesPoint[];
    peakDay: {
      date: string;
      label: string;
      totalEvents: number;
    } | null;
  };
  rates: {
    searchClickThroughRate: number;
    zeroResultRate: number;
    verificationRate: number;
    onboardingCompletionRate: number;
    favoritesToMessageRate: number;
    messageCompletionRate: number;
    pushAdoptionRate: number;
    notificationOpenRate: number;
  };
  health: {
    score: number;
    items: HealthItem[];
  };
  eventLeaderboard: LeaderboardEntry[];
  recentEvents: RecentEvent[];
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
  analyticsRefreshMinutes: number;
  moderationHold: boolean;
  followUpUserIds: string[];
  updatedAt: string | null;
};

export const DEFAULT_ADMIN_SYSTEM_CONTROLS: AdminSystemControls = {
  maintenanceBannerText: '',
  analyticsRefreshMinutes: 15,
  moderationHold: false,
  followUpUserIds: [],
  updatedAt: null,
};

export type AdminDashboardSnapshot = {
  analytics: AnalyticsOverview;
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

export type AdminAnalyticsExport = {
  exportedAt: string;
  filters: {
    days: number | null;
    eventType: string | null;
    path: string | null;
  };
  totalEvents: number;
  events: RecentEvent[];
};
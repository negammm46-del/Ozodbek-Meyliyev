export interface UserProfile {
  id: string;
  email: string;
  authProvider: string;
  username: string;
  displayName: string;
  avatar: string;
  countryCode: string;
  geoLevel: string;
  learningFocus: string;
  englishLevel: string;
  dailyGoalMin: number;
  favoriteContinent: string;
  onboardingDone: boolean;
  emailVerified: boolean;
  isPro: boolean;
  proStatus?: 'active' | 'inactive' | 'expired';
  subscriptionType?: 'free' | 'paid' | 'promo' | 'lifetime';
  proPlan: string;
  subscriptionStart?: string | null;
  proExpiresAt: string | null;
  lifetimePro?: boolean;
  promoCode?: string;
  xp: number;
  coins?: number;
  photoURL?: string;
  streak: number;
  lastActiveDate: string | null;
  aiVoiceUri?: string;
  aiSpeechRate?: number;
  role?: 'student' | 'admin';
  createdAt: string;
}

export interface SubscriptionInfo {
  uid: string;
  subscriptionStatus: 'inactive' | 'active' | 'past_due' | 'canceled' | 'expired';
  subscriptionType?: 'free' | 'paid' | 'promo' | 'lifetime';
  subscriptionPlan: 'free' | 'monthly' | 'yearly' | 'lifetime';
  subscriptionStartDate: string | null;
  subscriptionEndDate: string | null;
  proStatus?: 'inactive' | 'active' | 'expired';
  lifetimePro?: boolean;
  promoCode?: string;
  paymentProvider: 'none' | 'stripe' | 'admin_grant' | 'promo_code';
  entitlementStatus: 'free' | 'pro';
}

export interface LearningHistoryEntry {
  id: string;
  title: string;
  type: string;
  xp: number;
  at: string;
}

export interface UserProgress {
  favorites: string[];
  completedCountries: string[];
  completedTerritories: string[];
  unlockedBadges: string[];
  masteredFlashcards: string[];
  exploredCountries: string[];
  quizzesCompleted: number;
  gamesWon: number;
  highScores: Record<string, number>;
  learningHistory: LearningHistoryEntry[];
  dailyCompleted: boolean;
  expertCertified: boolean;
}

export interface ServiceStatus {
  googleAuthConfigured: boolean;
  googleClientId: string | null;
  stripeConfigured: boolean;
  geminiConfigured: boolean;
  firebaseConfigured?: boolean;
  firebaseProjectId?: string | null;
}

export interface LeaderboardEntry {
  rank: number;
  id: string;
  username: string;
  avatar: string;
  countryCode: string;
  xp: number;
  streak: number;
  isPro: boolean;
}

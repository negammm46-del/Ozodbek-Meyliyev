# GeoWorld Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Identity Ownership**: Every document under `/users/{uid}` and its subcollections (`gameResults`, `learningProgress`, `achievements`, `favorites`, `dailyChallenges`, `mediaUploads`) strictly belongs to `uid` matching `request.auth.uid`.
2. **PII Isolation**: `/users/{uid}` (which stores `email`) is readable ONLY by `isOwner(uid)` or `isAdmin()`. Public rankings live in `/leaderboard/{uid}` with zero PII (`email` forbidden).
3. **PRO Entitlement Protection**: Clients can NEVER set `proStatus: true`, `subscriptionPlan: 'monthly'|'yearly'|'lifetime'`, write to `/subscriptions/{uid}`, or create/modify `/promoRedemptions/{redemptionId}`. Only Cloud Functions, verified backend endpoints, or verified admins update entitlements and promo redemption records.
4. **Anti-XP / Anti-Coin Cheating**: Users cannot register with arbitrary XP (`xp <= 100`, `coins <= 50`), cannot log a single game result with `xpEarned > 250`, and cannot jump `users/{uid}.xp` by more than `+250` per update.
5. **Admin Verification**: `isAdmin()` checks `exists(/databases/$(database)/documents/admins/$(request.auth.uid))` OR (`request.auth.token.email_verified == true && request.auth.token.email == 'negammm46@gmail.com'`). Never trusts client claims alone or unverified email strings.
6. **Temporal Integrity**: `createdAt`, `completedAt`, `unlockedAt`, `savedAt`, `redeemedAt`, and `updatedAt` are validated against `request.time`.

## 2. The "Dirty Dozen" Payloads (Must Return PERMISSION_DENIED)
1. **Self-Promote to PRO (Create)**: `users/{uid}` create with `proStatus: true` -> DENIED.
2. **Self-Promote to PRO (Update)**: `users/{uid}` update changing `proStatus: true` or `subscriptionPlan: 'lifetime'` -> DENIED.
3. **Self-Assign Admin Role**: `users/{uid}` create or update with `role: 'admin'` -> DENIED.
4. **Privilege Escalation on `/admins/{uid}`**: Non-admin attempting to create `/admins/{uid}` -> DENIED.
5. **Forge PRO Subscription**: Non-admin writing `/subscriptions/{uid}` -> DENIED.
6. **Forge Promo Redemption**: Non-admin creating `/promoRedemptions/userA_OZODBRO` -> DENIED.
7. **Arbitrary XP Inflation**: `users/{uid}` update setting `xp: 999999` (`xp - existing.xp > 250`) -> DENIED.
8. **Forged Game Reward**: Creating `/users/{uid}/gameResults/{id}` with `xpEarned: 50000` -> DENIED.
9. **Cross-User PII & Promo Snooping**: Signed-in user A reading `/users/{userB}` or `/promoRedemptions/{userB_FREE100}` -> DENIED.
10. **Shadow/Ghost Field Injection**: `users/{uid}` update with extra unknown field `{ isSuperUser: true }` -> DENIED (`hasOnly` check).
11. **ID Poisoning**: Document ID > 128 chars or containing invalid symbols (`../bad`) -> DENIED (`isValidId`).
12. **Spoofed Unverified Admin Email**: Auth token with `email: 'negammm46@gmail.com'` and `email_verified: false` writing `/publicCountries/uz` -> DENIED.
13. **Client Timestamp Forgery**: Creating `gameResults` with backdated client timestamp instead of server `request.time` -> DENIED.

# Changelog

All notable changes to this project will be documented in this file.

## [2.0.0] - 2026-05-23

### Breaking Changes — Team → Space rename

Platform tenant concept renamed from **Team** to **Space** to align with GeniSpace product naming.

- **`client.spaces`** replaces `client.teams` as the canonical resource client (`Spaces` class, `/spaces/*` routes).
- **`client.teams`** remains as a deprecated alias (same instance as `client.spaces`) for one major version.
- **`Teams` export** deprecated; use **`Spaces`** instead.
- **User settings**: `teamId` → **`spaceId`** in `getSettings()` / `updateSettings()` types and payloads.
- **`getTeams()`** → **`getSpaces()`** (`GET /users/teams` compat path); `getTeams()` deprecated.
- **Statistics**: `teamsCount` → **`spacesCount`** in `getStatistics()` response type.
- **API keys**: `listTeamKeys` → **`listSpaceKeys`**; parameters renamed to **`spaceId`** (HTTP paths remain `/api-keys/teams/:spaceId/*` until API adds `/spaces` aliases).
- **Agents**: session types and filters use **`spaceId`** instead of `teamId`.
- **Data resource**: documentation updated — requests target the **space** database implied by the token.

### Migration

```typescript
// Before (1.x)
const members = await client.teams.listMemberProfiles();
const settings = await client.users.getSettings(); // settings.teamId

// After (2.x)
const members = await client.spaces.listMemberProfiles();
const settings = await client.users.getSettings(); // settings.spaceId
```

The API continues to accept legacy `/teams/*` routes and `teamId` request fields during the compatibility window; prefer `spaceId` and `/spaces/*` for new integrations.

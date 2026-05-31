# Changelog

All notable changes to this project will be documented in this file.

## [3.0.0] - 2026-05-31

### Breaking Changes — Phase 7 compat removal

Legacy Team APIs removed after the API compatibility window closed.

- **Removed** `client.teams` getter and `Teams` export — use **`client.spaces`** / **`Spaces`** only.
- **Removed** `users.getTeams()` — use **`users.getSpaces()`** (`GET /users/spaces`).
- **Removed** `apiKeys.listTeamKeys()` — use **`apiKeys.listSpaceKeys(spaceId)`** (`GET /api-keys/spaces/:spaceId`).
- API no longer serves `/teams/*`, `/users/teams`, or `/users/switch-team/*` (404).

### Migration

```typescript
// Before (2.x deprecated aliases)
const list = await client.users.getTeams();
const keys = await client.apiKeys.listTeamKeys(spaceId);

// After (3.x)
const list = await client.users.getSpaces();
const keys = await client.apiKeys.listSpaceKeys(spaceId);
```

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

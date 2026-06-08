# GeniSpace JavaScript SDK

> Official JavaScript/TypeScript SDK for GeniSpace AI Platform

[![npm version](https://badge.fury.io/js/genispace.svg)](https://www.npmjs.com/package/genispace)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-supported-blue.svg)](https://www.typescriptlang.org/)

## 🎯 Overview

GeniSpace JavaScript SDK is the official client library for [GeniSpace.ai](https://genispace.ai) AI platform, providing complete API access for user management, agent control, task execution, and other core features.

### Key Features

- 🔐 **API Key Authentication** - Secure API key management and authentication
- 👤 **User Management** - Complete user profile and preference management
- 🤖 **Agent Control** - Agent creation, configuration, execution, and session management
- 📋 **Task Execution** - Task creation, scheduling, monitoring, and log management
- 🧩 **Workbench** - Workbench CRUD, versioning, activation, and restore APIs
- 🛡️ **Type Safety** - Complete TypeScript type definitions
- 🔄 **Auto Retry** - Built-in network error retry mechanism
- 📊 **Unified Error Handling** - Standardized error response handling

## 🚀 Installation

```bash
npm install genispace
```

## 🔧 Quick Start

### Basic Usage

```javascript
import GeniSpace from 'genispace';

// Initialize client
const client = new GeniSpace({
  apiKey: 'your-api-key-here',
  baseURL: 'https://api.genispace.ai', // Optional, default value
  timeout: 30000, // Optional, default 30 seconds
  retries: 3      // Optional, default 3 retries
});

// Get current user information
try {
  const user = await client.users.getProfile();
  console.log('Current user:', user);
} catch (error) {
  console.error('Failed to get user info:', error.message);
}
```

### TypeScript Usage

```typescript
import GeniSpace, { User, GeniSpaceError } from 'genispace';

const client = new GeniSpace({
  apiKey: process.env.GENISPACE_API_KEY!
});

async function getUserProfile(): Promise<User | null> {
  try {
    const user = await client.users.getProfile();
    return user;
  } catch (error) {
    if (error instanceof GeniSpaceError) {
      console.error(`API Error [${error.code}]:`, error.message);
    }
    return null;
  }
}
```

## 📚 API Reference

### User Management (Users)

```javascript
// Get user profile
const profile = await client.users.getProfile();

// Update user profile
await client.users.updateProfile({
  name: 'New Name',
  company: 'New Company'
});

// Change password
await client.users.updatePassword({
  currentPassword: 'current-password',
  newPassword: 'new-password'
});

// Get user preferences
const preferences = await client.users.getPreferences();

// Update preferences
await client.users.updatePreferences({
  theme: 'dark',
  language: 'en',
  timeZone: 'America/New_York'
});

// Get user teams
const spaces = await client.users.getSpaces();

// Get user statistics
const stats = await client.users.getStatistics();
```

### API Key Management (ApiKeys)

```javascript
// Get all API keys
const apiKeys = await client.apiKeys.list();

// Create new API key
const newKey = await client.apiKeys.create({
  name: 'Development Key',
  application: 'Client Application',
  expiresAt: '2025-12-31T23:59:59Z',
  permissions: ['read:tasks', 'write:agents']
});

console.log('New key:', newKey.key); // Only returned during creation

// Update API key
await client.apiKeys.update('key-id', {
  name: 'Updated Name'
});

// Revoke API key
await client.apiKeys.revoke('key-id');

// Validate API key
const validation = await client.apiKeys.validate('your-api-key-to-check');
console.log('Key valid:', validation.valid);
if (validation.keyInfo) {
  console.log('Key owner:', validation.keyInfo.owner.name);
}
```

### Agent Management (Agents)

```javascript
// Get agent list
const { data: agents, pagination } = await client.agents.list({
  page: 1,
  limit: 20,
  agentType: 'CHAT'
});

// Create agent
const agent = await client.agents.create({
  name: 'Customer Service Assistant',
  model: 'gpt-4',
  modelId: 'gpt-4',
  systemPrompt: 'You are a professional customer service assistant',
  promptTemplate: 'User: {{input}}\n\nAssistant: ',
  agentType: 'CHAT',
  description: 'Professional customer service assistant'
});

// Agent chat
const response = await client.agents.chat(agent.id, {
  contents: [
    {
      type: 'text',
      text: 'Hello, I need help'
    }
  ],
  session_id: 'session-123',
  stream: false
});

// Execute agent task
const result = await client.agents.execute(agent.id, {
  inputs: {
    query: 'Analyze this document',
    memory: true,
    context: true
  },
  settings: {
    temperature: 0.7,
    maxTokens: 2000
  }
});

// Create session
const session = await client.agents.createSession({
  userAgentId: agent.id, // Optional parameter
  title: 'Customer Service Chat',
  sessionType: 'chat'
});
```

### Task Management (Tasks)

```javascript
// Get task list
const { data: tasks, pagination } = await client.tasks.list({
  status: 'COMPLETED',
  type: 'SCHEDULED',
  page: 1,
  limit: 10
});

// Create task
const task = await client.tasks.create({
  name: 'Data Sync Task',
  type: 'SCHEDULED',
  schedule: '0 0 * * *', // Run daily at midnight
  priority: 'HIGH',
  workflow: {
    nodes: [
      {
        id: 'fetch-data',
        type: 'api-call',
        config: { url: 'https://api.example.com/data' }
      }
    ]
  }
});

// Execute task
const execution = await client.tasks.execute(task.id, 'async');

// Get task details
const taskDetails = await client.tasks.getTask(task.id);

// Get task logs
const logs = await client.tasks.getLogs(task.id);

// Get task statistics
const taskStats = await client.tasks.getStatistics();

// Delete task
await client.tasks.deleteTask(task.id);
```

### Workbench Management (Workbenches)

```javascript
// List workbenches (team-scoped; permissions apply on server)
const { items } = await client.workbenches.list({
  page: 1,
  limit: 20,
  status: 'ACTIVE',
  isActive: true
});

// Get detail
const wb = await client.workbenches.getWorkbench(items[0].id);

// Create
const created = await client.workbenches.create({
  name: 'Sales Dashboard',
  description: 'Team KPI overview',
  config: {
    appConfig: { name: 'Sales Dashboard', version: '1.0.0' },
    pages: {}
  }
});

// Update
await client.workbenches.updateWorkbench(created.id, {
  name: 'Sales Dashboard v2',
  config: created.config
});

// Toggle active
await client.workbenches.setActive(created.id, true);

// Versions & restore by version record id
const versions = await client.workbenches.listVersions(created.id);
await client.workbenches.restoreVersion(created.id, versions[0].id);

// Alternate restore by version string when API exposes `/restore/:version`
// await client.workbenches.restoreSnapshot(created.id, '1.0.0');

// Delete (requires admin permission on server)
await client.workbenches.deleteWorkbench(created.id);
```

## 🔐 Authentication and Security

### Getting API Key

1. Login to [GeniSpace Platform](https://genispace.ai)
2. Go to "Settings" → "API Keys"
3. Create a new API key
4. Copy the key and store it securely

### Environment Variables Configuration

Recommended to use environment variables to store API keys:

```bash
# .env file
GENISPACE_API_KEY=your-api-key-here
GENISPACE_BASE_URL=https://api.genispace.ai
```

```javascript
import GeniSpace from 'genispace';

const client = new GeniSpace({
  apiKey: process.env.GENISPACE_API_KEY,
  baseURL: process.env.GENISPACE_BASE_URL
});
```

## 🛠️ Advanced Usage

### Error Handling

```javascript
import { GeniSpaceError } from 'genispace';

try {
  const result = await client.agents.execute('agent-id', { inputs: {} });
} catch (error) {
  if (error instanceof GeniSpaceError) {
    switch (error.code) {
      case 'UNAUTHORIZED':
        console.error('API key is invalid or expired');
        break;
      case 'RATE_LIMIT_EXCEEDED':
        console.error('Rate limit exceeded, please retry later');
        break;
      case 'AGENT_NOT_FOUND':
        console.error('The specified agent does not exist');
        break;
      default:
        console.error('API error:', error.message);
    }
  } else {
    console.error('Network error:', error.message);
  }
}
```

### Configuration Updates

```javascript
// Update API Key at runtime
client.updateApiKey('new-api-key');

// Update base URL at runtime
client.updateBaseURL('https://custom-api.example.com');

// Get current configuration
const config = client.getConfig();
console.log('Current config:', config);
```

### Pagination Handling

```javascript
async function getAllTasks() {
  const allTasks = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const { data, pagination } = await client.tasks.list({
      page,
      limit: 100
    });

    allTasks.push(...data);
    hasMore = page < pagination.pages;
    page++;
  }

  return allTasks;
}
```

## Operators (`POST /operators/execute`)

Team-scoped **UserOperator** execution uses **`POST /operators/execute`**. The SDK exposes this as **`client.operators.execute(...)`**.

**Auth**: Bearer **`accessToken`** (GeniApp / browser) or **`apiKey`**, same as other resources. **`accessToken` takes precedence** when both are set.

**`baseURL`**: Use the same API root as for `client.data` / `client.tasks` (typically includes the `/api` prefix, e.g. `https://api.genispace.ai/api`). The server also mounts routes at `/`, so a host-only `baseURL` can work if your deployment exposes `/operators/execute` at the root.

**Request shape** (matches Console operator debugger):

- `config.operatorId`: UserOperator **`identifier`** string for the current team (enabled clone).
- `config.methodId`: optional method identifier; omit or pass the method’s identifier.
- `inputs`: **required object** — use `{}` when the method has no inputs.
- `context`: optional; the API enriches execution from the session (`teamId` / `userId`) server-side.

**Response**: Flat JSON (`success`, `result`, `operator`, `executionTime`, …) — not wrapped in `{ data: ... }`.

```typescript
import GeniSpace from 'genispace';

const client = new GeniSpace({
  apiKey: process.env.GENISPACE_API_KEY!,
  baseURL: 'https://api.genispace.ai/api',
});

const out = await client.operators.execute({
  config: { operatorId: 'my-team-operator-id', methodId: 'default' },
  inputs: { query: 'example' },
});
console.log(out.result, out.executionTime);
```

## 📊 DataSources (team SQL READ)

Team-scoped SQL DataSources use **`GET /datasources`** and **`GET /datasources/:id/data`**. The SDK wraps these on `GeniSpace` as **`client.dataSources`**.

**Permission**: **`team.datasource.read`** (Bearer token — same auth as the rest of the platform API).

**Typical GeniApp flow** (product name; API fields `managedByGeniapp` / `geniappIdentifier` are L2 contract names)

1. After install, managed seeds are upserted with `metadata.managedByGeniapp` and `metadata.geniappIdentifier` matching the app (e.g. `hr-timesheet`).
2. List datasources with `limit` high enough to include seeds, then pick the row where `identifier` matches your seed key (e.g. `hr_ts_submitted_by_project`).
3. Call `queryDataSourceRead(id, { page, limit, ... })` — extra keys become SQL bind parameters when the datasource statement uses `{{param}}` placeholders.

```typescript
import GeniSpace from 'genispace';

const client = new GeniSpace({
  apiKey: process.env.GENISPACE_TOKEN!,
  baseURL: 'https://api.example.com',
});

const { items } = await client.dataSources.listDataSources({ limit: 500 });
const row = items.find(
  (x) =>
    x.identifier === 'hr_ts_submitted_by_project' &&
    (x.metadata as any)?.managedByGeniapp === true &&
    (x.metadata as any)?.geniappIdentifier === 'hr-timesheet'
);
if (!row?.id) throw new Error('Managed datasource not found');

const result = await client.dataSources.queryDataSourceRead(row.id, { limit: 1000 });
console.log(result.data);
```

Generate or refresh OutputSchema without manually providing required SQL parameters:

```typescript
const schemaResult = await client.dataSources.generateOutputSchema(row.id, {
  parameters: {},
  strict: false,
  save: true,
  baseDate: '2026-06-06',
});

console.log(schemaResult.columns);
console.log(schemaResult.outputSchema);
console.log(schemaResult.usedParameters);
```

## 📖 Example Usage

See the complete usage example in [example-usage.js](example-usage.js) which demonstrates:

- Basic client initialization and configuration
- User profile management and authentication  
- Agent creation, execution, and chat interactions
- Task creation, monitoring, and management
- Error handling and best practices

## 🔗 Related Links

- **Website**: [https://genispace.ai](https://genispace.ai)
- **Documentation**: [https://docs.genispace.ai](https://docs.genispace.ai)
- **GitHub**: [https://github.com/genispace/sdk-javascript](https://github.com/genispace/sdk-javascript)
- **Issue Reports**: [GitHub Issues](https://github.com/genispace/sdk-javascript/issues)

## 📄 License

This project is open source under the [MIT License](LICENSE).

---

**Built by [GeniSpace.ai Dev Team](https://genispace.ai)**

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
  baseURL: 'https://api.genispace.com', // Optional, default value
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
const teams = await client.users.getTeams();

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
GENISPACE_BASE_URL=https://api.genispace.com
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

## 🤝 Operator Service Integration

GeniSpace SDK can be configured to communicate with custom operator services:

```javascript
// Configure operator service endpoint
const operatorClient = new GeniSpace({
  apiKey: process.env.GENISPACE_API_KEY,
  baseURL: 'http://your-operator-service:8080' // Operator service address
});

// Use operator service APIs (depends on specific operator service interfaces)
// For example, get operator information
const operators = await operatorClient.get('/api/operators');

// Operator services typically provide their own API specifications
// Please refer to your operator service documentation for specific usage
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

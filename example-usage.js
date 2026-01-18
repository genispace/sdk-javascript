#!/usr/bin/env node

/**
 * GeniSpace SDK 使用示例
 * 展示如何使用SDK进行常见操作
 */

const axios = require('axios');

// 创建简化的SDK客户端
class GeniSpaceSDK {
  constructor(config) {
    this.config = {
      baseURL: 'https://api.genispace.ai',
      timeout: 30000,
      ...config
    };
    
    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`,
        'User-Agent': 'GeniSpace-SDK-JS/1.0.0'
      }
    });
  }
  
  // 用户API
  async getProfile() {
    const response = await this.client.get('/users/me');
    return response.data;
  }
  
  // 智能体API
  async listAgents() {
    const response = await this.client.get('/agents');
    return response.data;
  }
  
  async createAgent(agentData) {
    const response = await this.client.post('/agents', agentData);
    return response.data;
  }
  
  async deleteAgent(agentId) {
    const response = await this.client.delete(`/agents/${agentId}`);
    return response.data;
  }
  
  // 任务API
  async listTasks() {
    const response = await this.client.get('/tasks');
    return response.data;
  }
  
  async createTask(taskData) {
    const response = await this.client.post('/tasks', taskData);
    return response.data;
  }
  
  async deleteTask(taskId) {
    const response = await this.client.delete(`/tasks/${taskId}`);
    return response.data;
  }
  
  // API Key管理
  async listApiKeys() {
    const response = await this.client.get('/api-keys');
    return response.data;
  }
}

// 使用示例
async function example() {
  console.log('🚀 GeniSpace SDK 使用示例\n');
  
  // 初始化SDK
  const sdk = new GeniSpaceSDK({
    apiKey: 'knqg4fkFrekIwTr1WzoAYNvUHixHajFNumyWqq44'
  });
  
  try {
    // 1. 获取用户信息
    console.log('📋 获取用户信息...');
    const profile = await sdk.getProfile();
    console.log(`用户: ${profile.data.name} (${profile.data.email})\n`);
    
    // 2. 查看智能体列表
    console.log('🤖 获取智能体列表...');
    const agents = await sdk.listAgents();
    console.log(`共有 ${agents.data.length} 个智能体\n`);
    
    // 3. 创建新智能体
    console.log('✨ 创建新智能体...');
    const agentData = {
      name: '示例智能体',
      model: 'gpt-3.5-turbo',
      modelId: 'gpt-3.5-turbo',
      systemPrompt: '你是一个帮助用户的AI助手。',
      promptTemplate: '用户: {{input}}\n\n助手: ',
      description: 'SDK示例智能体',
      agentType: 'CHAT'
    };
    
    const newAgent = await sdk.createAgent(agentData);
    const agentId = newAgent.data.id;
    console.log(`✅ 智能体创建成功: ${agentId}\n`);
    
    // 4. 查看任务列表
    console.log('📋 获取任务列表...');
    const tasks = await sdk.listTasks();
    console.log(`共有 ${tasks.data.length} 个任务\n`);
    
    // 5. 创建新任务
    console.log('✨ 创建新任务...');
    const taskData = {
      name: '示例任务',
      type: 'MANUAL',
      description: 'SDK示例任务',
      priority: 'MEDIUM',
      tags: ['example', 'sdk-demo']
    };
    
    const newTask = await sdk.createTask(taskData);
    const taskId = newTask.data.id;
    console.log(`✅ 任务创建成功: ${taskId}\n`);
    
    // 6. 查看API密钥
    console.log('🔑 获取API密钥列表...');
    const apiKeys = await sdk.listApiKeys();
    console.log(`共有 ${apiKeys.data.length} 个API密钥\n`);
    
    // 7. 清理资源
    console.log('🧹 清理创建的资源...');
    await sdk.deleteAgent(agentId);
    console.log('✅ 智能体已删除');
    
    await sdk.deleteTask(taskId);
    console.log('✅ 任务已删除\n');
    
    console.log('🎉 示例完成！');
    
  } catch (error) {
    console.error('❌ 示例执行失败:', error.response?.data || error.message);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  example().catch(console.error);
}

module.exports = { GeniSpaceSDK };

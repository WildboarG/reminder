import { generateId, sendJSON } from './utils.js';
import {
  getSupportedPushTypes,
  validatePushConfig,
  getSafeConfig
} from './push-registry.js';

export async function getPushConfigs(userId, env) {
  try {
    const ADMIN_USERNAME = env.ADMIN_USERNAME || '';
    let data;

    // 管理员使用固定的 KV 键
    if (userId === 'admin') {
      data = await env.REMINDERS_KV.get('push_configs:admin');
      // 如果不存在则初始化
      if (!data) {
        const emptyConfigs = [];
        await env.REMINDERS_KV.put('push_configs:admin', JSON.stringify(emptyConfigs));
        data = JSON.stringify(emptyConfigs);
      }
    } else {
      data = await env.REMINDERS_KV.get('push_configs:' + userId);
    }

    const configs = data ? JSON.parse(data) : [];

    // 使用注册器获取安全的配置信息
    const safeConfigs = configs.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      config: getSafeConfig(c.type, c.config)
    }));

    return sendJSON(safeConfigs);
  } catch (error) {
    return sendJSON({ error: error.message }, 500);
  }
}

export async function addPushConfig(request, userId, env) {
  try {
    const body = await request.json();
    const { name, type, config } = body;

    if (!name || name.trim().length === 0 || name.length > 30) {
      return sendJSON({ error: '配置名称不合法' }, 400);
    }

    if (!type || !getSupportedPushTypes().includes(type)) {
      return sendJSON({ error: '推送类型不合法' }, 400);
    }

    // 使用注册器验证配置
    try {
      validatePushConfig(type, config);
    } catch (error) {
      return sendJSON({ error: error.message }, 400);
    }

    const pushConfig = {
      id: generateId(),
      name: name.trim(),
      type,
      config,
      createdAt: new Date().toISOString()
    };

    const ADMIN_USERNAME = env.ADMIN_USERNAME || '';
    const key = userId === 'admin' ? 'push_configs:admin' : 'push_configs:' + userId;
    const data = await env.REMINDERS_KV.get(key);
    const configs = data ? JSON.parse(data) : [];
    configs.push(pushConfig);

    await env.REMINDERS_KV.put(key, JSON.stringify(configs));

    return sendJSON({
      success: true,
      pushConfig: { id: pushConfig.id, name: pushConfig.name, type: pushConfig.type }
    }, 201);
  } catch (error) {
    return sendJSON({ error: '请求格式错误' }, 400);
  }
}

export async function deletePushConfig(request, userId, env) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return sendJSON({ error: '缺少 id 参数' }, 400);
    }

    if (!/^[a-z0-9]+$/.test(id)) {
      return sendJSON({ error: 'id 格式不合法' }, 400);
    }

    const ADMIN_USERNAME = env.ADMIN_USERNAME || '';
    const key = userId === 'admin' ? 'push_configs:admin' : 'push_configs:' + userId;
    const data = await env.REMINDERS_KV.get(key);
    const configs = data ? JSON.parse(data) : [];
    const filtered = configs.filter(c => c.id !== id);

    await env.REMINDERS_KV.put(key, JSON.stringify(filtered));

    return sendJSON({ success: true });
  } catch (error) {
    return sendJSON({ error: error.message }, 500);
  }
}

export async function testPushConfig(request, userId, env) {
  try {
    const body = await request.json();
    const { id } = body;

    const ADMIN_USERNAME = env.ADMIN_USERNAME || '';
    const key = userId === 'admin' ? 'push_configs:admin' : 'push_configs:' + userId;
    const data = await env.REMINDERS_KV.get(key);
    const configs = data ? JSON.parse(data) : [];
    const config = configs.find(c => c.id === id);

    if (!config) {
      return sendJSON({ error: '配置不存在' }, 404);
    }

    const result = await sendPush(config, '测试通知', '这是一条测试通知');
    return sendJSON(result);
  } catch (error) {
    return sendJSON({ error: '请求格式错误' }, 400);
  }
}

export async function testNewPushConfig(request, userId, env) {
  try {
    const body = await request.json();
    const { config, type } = body;
    
    if (!config || !type) {
      return sendJSON({ error: '缺少配置信息' }, 400);
    }
    
    const pushConfig = { id: 'test', type, config };
    const result = await sendPush(pushConfig, '测试通知', '这是一条测试通知');
    return sendJSON(result);
  } catch (error) {
    return sendJSON({ error: '请求格式错误' }, 400);
  }
}

async function sendPush(pushConfig, title, content) {
  try {
    // 动态导入推送注册器以获取推送服务
    const { PUSH_SERVICES } = await import('./push-registry.js');

    const service = PUSH_SERVICES[pushConfig.type];
    if (!service) {
      return { success: false, error: '不支持的推送类型' };
    }

    return await service.send(pushConfig.config, title, content);
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export { sendPush };

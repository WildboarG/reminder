import { generateId, sendJSON } from './utils.js';
import { sendPush } from './push.js';

export async function getReminders(userId, env) {
  try {
    const ADMIN_USERNAME = env.ADMIN_USERNAME || '';
    const userKey = userId === 'admin' ? 'admin' : userId;

    const data = await env.REMINDERS_KV.get('reminders:' + userKey);
    const reminders = data ? JSON.parse(data) : [];

    const pushConfigsData = await env.REMINDERS_KV.get('push_configs:' + userKey);
    const pushConfigs = pushConfigsData ? JSON.parse(pushConfigsData) : [];

    const result = reminders.map(r => {
      const pushConfig = pushConfigs.find(p => p.id === r.pushConfigId);
      return {
        id: r.id,
        date: r.date,
        title: r.title,
        content: r.content,
        pushConfigId: r.pushConfigId,
        pushConfigName: pushConfig ? pushConfig.name : '未知'
      };
    });

    return sendJSON(result);
  } catch (error) {
    return sendJSON({ error: error.message }, 500);
  }
}

export async function addReminder(request, userId, env) {
  try {
    const body = await request.json();
    const { date, title, content, pushConfigId } = body;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return sendJSON({ error: '日期格式不合法' }, 400);
    }

    if (!title || title.trim().length === 0 || title.length > 100) {
      return sendJSON({ error: '标题长度必须在1-100之间' }, 400);
    }

    if (content && content.length > 500) {
      return sendJSON({ error: '内容长度不能超过500字符' }, 400);
    }

    if (!pushConfigId || !/^[a-z0-9]+$/.test(pushConfigId)) {
      return sendJSON({ error: '推送配置ID不合法' }, 400);
    }

    const ADMIN_USERNAME = env.ADMIN_USERNAME || '';
    const userKey = userId === 'admin' ? 'admin' : userId;

    const pushConfigsData = await env.REMINDERS_KV.get('push_configs:' + userKey);
    const pushConfigs = pushConfigsData ? JSON.parse(pushConfigsData) : [];
    const pushConfig = pushConfigs.find(p => p.id === pushConfigId);

    if (!pushConfig) {
      return sendJSON({ error: '推送配置不存在' }, 400);
    }

    const reminder = {
      id: generateId(),
      date,
      title: title.trim(),
      content: (content || '').trim(),
      pushConfigId,
      createdAt: new Date().toISOString()
    };

    const data = await env.REMINDERS_KV.get('reminders:' + userKey);
    const reminders = data ? JSON.parse(data) : [];
    reminders.push(reminder);

    await env.REMINDERS_KV.put('reminders:' + userKey, JSON.stringify(reminders));

    return sendJSON({
      success: true,
      reminder: { id: reminder.id, date: reminder.date, title: reminder.title, pushConfigName: pushConfig.name }
    }, 201);
  } catch (error) {
    return sendJSON({ error: '请求格式错误' }, 400);
  }
}

export async function deleteReminder(request, userId, env) {
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
    const userKey = userId === 'admin' ? 'admin' : userId;

    const data = await env.REMINDERS_KV.get('reminders:' + userKey);
    const reminders = data ? JSON.parse(data) : [];
    const filtered = reminders.filter(r => r.id !== id);

    await env.REMINDERS_KV.put('reminders:' + userKey, JSON.stringify(filtered));

    return sendJSON({ success: true });
  } catch (error) {
    return sendJSON({ error: error.message }, 500);
  }
}

export async function testCheckReminders(userId, env) {
  const today = new Date().toISOString().split('T')[0];

  try {
    const ADMIN_USERNAME = env.ADMIN_USERNAME || '';
    const userKey = userId === 'admin' ? 'admin' : userId;

    const remindersData = await env.REMINDERS_KV.get('reminders:' + userKey);
    const reminders = remindersData ? JSON.parse(remindersData) : [];
    const todayReminders = reminders.filter(r => r.date === today);

    return sendJSON({
      success: true,
      message: '今日共有 ' + todayReminders.length + ' 个提醒',
      count: todayReminders.length
    });
  } catch (error) {
    return sendJSON({ error: error.message }, 500);
  }
}

export async function checkAndSendReminders(env) {
  const today = new Date().toISOString().split('T')[0];

  try {
    const usersData = await env.REMINDERS_KV.get('users');
    const users = usersData ? JSON.parse(usersData) : {};

    // 检查管理员提醒
    const ADMIN_USERNAME = env.ADMIN_USERNAME || '';
    const adminRemindersData = await env.REMINDERS_KV.get('reminders:admin');
    if (adminRemindersData) {
      const adminReminders = JSON.parse(adminRemindersData);
      const todayReminders = adminReminders.filter(r => r.date === today);
      const oldReminders = adminReminders.filter(r => r.date < today);

      if (oldReminders.length > 0) {
        const filtered = adminReminders.filter(r => r.date >= today);
        await env.REMINDERS_KV.put('reminders:admin', JSON.stringify(filtered));
      }

      if (todayReminders.length > 0) {
        const adminPushConfigsData = await env.REMINDERS_KV.get('push_configs:admin');
        const adminPushConfigs = adminPushConfigsData ? JSON.parse(adminPushConfigsData) : [];

        for (const reminder of todayReminders) {
          const pushConfig = adminPushConfigs.find(p => p.id === reminder.pushConfigId);
          if (pushConfig) {
            await sendPush(pushConfig, reminder.title, reminder.content);
          }
        }
      }
    }

    // 检查普通用户提醒
    for (const username in users) {
      const userId = users[username].id;

      const remindersData = await env.REMINDERS_KV.get('reminders:' + userId);
      if (!remindersData) continue;

      const reminders = JSON.parse(remindersData);
      const todayReminders = reminders.filter(r => r.date === today);

      const oldReminders = reminders.filter(r => r.date < today);
      if (oldReminders.length > 0) {
        const filtered = reminders.filter(r => r.date >= today);
        await env.REMINDERS_KV.put('reminders:' + userId, JSON.stringify(filtered));
      }

      if (todayReminders.length === 0) continue;

      const pushConfigsData = await env.REMINDERS_KV.get('push_configs:' + userId);
      const pushConfigs = pushConfigsData ? JSON.parse(pushConfigsData) : [];

      for (const reminder of todayReminders) {
        const pushConfig = pushConfigs.find(p => p.id === reminder.pushConfigId);
        if (pushConfig) {
          await sendPush(pushConfig, reminder.title, reminder.content);
        }
      }
    }
  } catch (error) {
    console.error('Error checking reminders:', error);
  }
}

import { sendJSON, isAdmin as checkAdmin } from './utils.js';

export async function getAllUsers(request, adminUserId, env) {
  try {
    if (!await checkAdmin(adminUserId, env)) {
      return sendJSON({ error: '权限不足' }, 403);
    }

    const usersData = await env.REMINDERS_KV.get('users');
    const users = usersData ? JSON.parse(usersData) : {};

    const userList = Object.keys(users).map(username => ({
      id: users[username].id,
      username: username,
      isAdmin: false,
      createdAt: users[username].createdAt
    }));

    // 添加管理员到列表
    const ADMIN_USERNAME = env.ADMIN_USERNAME || '';
    if (ADMIN_USERNAME && !users[ADMIN_USERNAME]) {
      userList.unshift({
        id: 'admin',
        username: ADMIN_USERNAME,
        isAdmin: true,
        createdAt: new Date().toISOString()  // 系统预设
      });
    }

    return sendJSON({ users: userList });
  } catch (error) {
    return sendJSON({ error: error.message }, 500);
  }
}

export async function deleteUser(request, adminUserId, env) {
  try {
    if (!await checkAdmin(adminUserId, env)) {
      return sendJSON({ error: '权限不足' }, 403);
    }

    const body = await request.json();
    const { userId, username } = body;

    if (!userId && !username) {
      return sendJSON({ error: '缺少用户信息' }, 400);
    }

    // 禁止删除管理员账户
    const ADMIN_USERNAME = env.ADMIN_USERNAME || '';
    if ((userId && userId === 'admin') || (username && username === ADMIN_USERNAME)) {
      return sendJSON({ error: '不能删除管理员账户' }, 403);
    }

    const usersData = await env.REMINDERS_KV.get('users');
    const users = usersData ? JSON.parse(usersData) : {};

    let deleteKey = null;

    if (userId) {
      for (const u in users) {
        if (users[u].id === userId) {
          deleteKey = u;
          break;
        }
      }
    } else if (username) {
      deleteKey = username;
    }

    if (!deleteKey || !users[deleteKey]) {
      return sendJSON({ error: '用户不存在' }, 404);
    }

    const userIdToDelete = users[deleteKey].id;

    delete users[deleteKey];
    await env.REMINDERS_KV.put('users', JSON.stringify(users));
    await env.REMINDERS_KV.delete('push_configs:' + userIdToDelete);
    await env.REMINDERS_KV.delete('reminders:' + userIdToDelete);

    return sendJSON({
      success: true,
      message: '用户 ' + deleteKey + ' 已删除'
    });
  } catch (error) {
    return sendJSON({ error: error.message }, 500);
  }
}

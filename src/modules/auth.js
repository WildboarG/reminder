import { generateId, generateToken, hashPassword, validateInput, sendJSON, checkRateLimit, authenticate, getUserById } from './utils.js';

const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_LOGIN_ATTEMPTS = 5;
let loginAttempts = {};

export async function handleRegister(request, env, clientIP) {
  try {
    const body = await request.json();
    const { username, password, inviteCode } = body;

    const INVITE_CODE = env.INVITE_CODE || '123456';
    const ADMIN_USERNAME = env.ADMIN_USERNAME || '';

    const usernameErr = validateInput(username, '用户名', 3, 20);
    if (usernameErr) {
      return sendJSON({ error: usernameErr }, 400);
    }

    if (!password || password.length < 6) {
      return sendJSON({ error: '密码长度至少6位' }, 400);
    }

    // 禁止注册管理员用户名
    if (username === ADMIN_USERNAME) {
      return sendJSON({ error: '不能注册管理员账号' }, 403);
    }

    const usersData = await env.REMINDERS_KV.get('users');
    const users = usersData ? JSON.parse(usersData) : {};

    if (users[username]) {
      return sendJSON({ error: '用户名已存在' }, 400);
    }

    if (inviteCode !== INVITE_CODE) {
      return sendJSON({ error: '邀请码错误' }, 400);
    }

    const userId = generateId();
    users[username] = {
      id: userId,
      username,
      password: hashPassword(password),
      isAdmin: false,
      createdAt: new Date().toISOString()
    };

    await env.REMINDERS_KV.put('users', JSON.stringify(users));
    await env.REMINDERS_KV.put('push_configs:' + userId, JSON.stringify([]));
    await env.REMINDERS_KV.put('reminders:' + userId, JSON.stringify([]));

    const token = generateToken(userId, username);
    return sendJSON({
      success: true,
      user: { id: userId, username, isAdmin: false },
      token
    }, 201);
  } catch (error) {
    return sendJSON({ error: '请求格式错误' }, 400);
  }
}

export async function handleLogin(request, env, clientIP) {
  const rateLimit = checkRateLimit(loginAttempts, clientIP, 'login', RATE_LIMIT_WINDOW, MAX_LOGIN_ATTEMPTS);
  if (!rateLimit.allowed) {
    return sendJSON({ error: '登录过于频繁，请稍后再试' }, 429);
  }

  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return sendJSON({ error: '用户名和密码不能为空' }, 400);
    }

    const ADMIN_USERNAME = env.ADMIN_USERNAME || '';
    const ADMIN_PASSWORD = env.ADMIN_PASSWORD || '';

    // 检查是否是管理员账号
    if (username === ADMIN_USERNAME) {
      if (!ADMIN_PASSWORD || password !== ADMIN_PASSWORD) {
        return sendJSON({ error: '用户名或密码错误' }, 401);
      }
      // 管理员登录成功
      const token = generateToken('admin', username);
      return sendJSON({
        success: true,
        user: { id: 'admin', username: username, isAdmin: true },
        token
      });
    }

    // 普通用户登录
    const usersData = await env.REMINDERS_KV.get('users');
    const users = usersData ? JSON.parse(usersData) : {};

    const user = users[username];
    if (!user || user.password !== hashPassword(password)) {
      return sendJSON({ error: '用户名或密码错误' }, 401);
    }

    const token = generateToken(user.id, username);
    return sendJSON({
      success: true,
      user: { id: user.id, username: user.username, isAdmin: false },
      token
    });
  } catch (error) {
    return sendJSON({ error: '请求格式错误' }, 400);
  }
}

export async function handleGetUser(request, env) {
  const authResult = await authenticate(request, env);
  if (!authResult.success) {
    return sendJSON({ error: 'Unauthorized' }, 401);
  }

  const user = await getUserById(authResult.userId, env);

  return sendJSON({
    user: {
      id: authResult.userId,
      username: authResult.username,
      isAdmin: user?.isAdmin || false
    }
  });
}

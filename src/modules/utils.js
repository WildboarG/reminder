function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

function generateToken(userId, username) {
  return userId + ':' + username + ':' + Date.now() + ':' + generateId().substring(0, 8);
}

function hashPassword(password) {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return hash.toString(16);
}

function validateInput(str, name, minLen, maxLen) {
  if (!str || typeof str !== 'string') return name + '不能为空';
  str = str.trim();
  if (str.length < minLen) return name + '长度至少' + minLen + '位';
  if (str.length > maxLen) return name + '长度不能超过' + maxLen + '位';
  if (!/^[a-zA-Z0-9_]+$/.test(str)) return name + '只能包含字母、数字和下划线';
  return null;
}

function sendJSON(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Content-Type-Options': 'nosniff',
      ...extraHeaders
    }
  });
}

function checkRateLimit(loginAttempts, ip, type, windowMs = 60000, maxAttempts = 5) {
  const now = Date.now();
  const key = ip + ':' + type;
  if (!loginAttempts[key]) loginAttempts[key] = { count: 0, firstAttempt: now };
  
  if (now - loginAttempts[key].firstAttempt > windowMs) {
    loginAttempts[key] = { count: 1, firstAttempt: now };
    return { allowed: true };
  }
  
  loginAttempts[key].count++;
  if (loginAttempts[key].count > maxAttempts) {
    return { allowed: false };
  }
  return { allowed: true };
}

async function authenticate(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { success: false };
  }

  const token = authHeader.substring(7);
  try {
    const parts = token.split(':');
    if (parts.length < 4) return { success: false };

    const userId = parts[0];
    const username = parts[1];

    const ADMIN_USERNAME = env.ADMIN_USERNAME || '';

    // 管理员验证
    if (username === ADMIN_USERNAME && userId === 'admin') {
      return {
        success: true,
        userId: 'admin',
        username,
        isAdmin: true
      };
    }

    // 普通用户验证
    const usersData = await env.REMINDERS_KV.get('users');
    const users = usersData ? JSON.parse(usersData) : {};

    if (!users[username] || users[username].id !== userId) {
      return { success: false };
    }

    return {
      success: true,
      userId,
      username,
      isAdmin: false
    };
  } catch (e) {
    return { success: false };
  }
}

async function getUserById(userId, env) {
  const ADMIN_USERNAME = env.ADMIN_USERNAME || '';

  // 管理员用户
  if (userId === 'admin') {
    return { username: ADMIN_USERNAME, isAdmin: true };
  }

  // 普通用户
  const usersData = await env.REMINDERS_KV.get('users');
  const users = usersData ? JSON.parse(usersData) : {};
  for (const username in users) {
    if (users[username].id === userId) {
      return { username, ...users[username], isAdmin: false };
    }
  }
  return null;
}

async function isAdmin(userId, env) {
  const user = await getUserById(userId, env);
  return user?.isAdmin === true;
}

export {
  generateId,
  generateToken,
  hashPassword,
  validateInput,
  sendJSON,
  checkRateLimit,
  authenticate,
  getUserById,
  isAdmin
};

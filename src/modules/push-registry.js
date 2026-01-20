import { generateId, sendJSON } from './utils.js';

// 推送服务配置 - 添加新推送方式只需在这里注册
const PUSH_SERVICES = {
  bark: {
    name: 'Bark',
    validateConfig: (config) => {
      if (!config.url || !config.url.startsWith('http')) {
        throw new Error('Bark URL 不合法');
      }
    },
    getSafeConfig: (config) => ({
      hasUrl: true,
      sound: config.sound ? { sound: config.sound } : {}
    }),
    send: async (config, title, content) => {
      const { url, sound } = config;
      const cleanUrl = url.replace(/\/$/, '');
      const encodedTitle = encodeURIComponent(title);
      const encodedContent = encodeURIComponent(content);

      let requestUrl = cleanUrl + '/' + encodedTitle + '/' + encodedContent;
      if (sound) {
        requestUrl += '?sound=' + sound;
      }

      const response = await fetch(requestUrl, { method: 'GET' });
      const text = await response.text();
      let result;
      try {
        result = JSON.parse(text);
      } catch {
        result = { code: response.ok ? 200 : 400 };
      }

      return {
        success: result.code === 200,
        message: result.code === 200 ? '发送成功' : (result.message || '发送失败'),
        status: response.status
      };
    }
  },

  serverchan: {
    name: 'Server酱',
    validateConfig: (config) => {
      if (!config.sendKey || config.sendKey.length < 5) {
        throw new Error('SendKey 不合法');
      }
    },
    getSafeConfig: (config) => ({
      hasKey: true
    }),
    send: async (config, title, content) => {
      const { sendKey, channel } = config;
      const apiUrl = 'https://sctapi.ftqq.com/' + sendKey + '.send';

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title,
          desp: content,
          channel: channel || 'default'
        })
      });

      return {
        success: response.ok,
        message: response.ok ? '发送成功' : '发送失败',
        status: response.status
      };
    }
  }

  // 添加新的推送服务示例：
  // webhook: {
  //   name: '自定义 Webhook',
  //   validateConfig: (config) => {
  //     if (!config.url || !config.url.startsWith('http')) {
  //       throw new Error('Webhook URL 不合法');
  //     }
  //   },
  //   getSafeConfig: (config) => ({
  //     hasUrl: true,
  //     method: config.method || 'POST'
  //   }),
  //   send: async (config, title, content) => {
  //     const { url, method = 'POST', headers = {} } = config;
  //
  //     const response = await fetch(url, {
  //       method: method,
  //       headers: {
  //         'Content-Type': 'application/json',
  //         ...headers
  //       },
  //       body: JSON.stringify({
  //         title: title,
  //         content: content,
  //         timestamp: new Date().toISOString()
  //       })
  //     });
  //
  //     return {
  //       success: response.ok,
  //       message: response.ok ? '发送成功' : '发送失败',
  //       status: response.status
  //     };
  //   }
  // }
};

// 获取支持的推送类型
export function getSupportedPushTypes() {
  return Object.keys(PUSH_SERVICES);
}

// 验证推送配置
export function validatePushConfig(type, config) {
  if (!PUSH_SERVICES[type]) {
    throw new Error('不支持的推送类型');
  }
  PUSH_SERVICES[type].validateConfig(config);
}

// 获取安全的配置信息（隐藏敏感数据）
export function getSafeConfig(type, config) {
  if (!PUSH_SERVICES[type]) {
    return {};
  }
  return PUSH_SERVICES[type].getSafeConfig(config);
}

// 导出推送服务配置
export { PUSH_SERVICES };
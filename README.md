# ⏰ Cloudflare 时间提醒服务

基于 Cloudflare Worker + KV 的时间提醒服务，支持每日定时检查并通过多种方式推送通知。

## 🚀 快速开始

### 使用 GitHub 一键部署（最简单）

1. **Fork 项目** 到你的 GitHub
2. **配置 Secrets**：
   - `CF_API_TOKEN`: 从 Cloudflare Dashboard 获取
   - `CF_ACCOUNT_ID`: 你的 Cloudflare Account ID
3. **推送代码** 或手动触发 Actions
4. **访问部署 URL** 开始使用！

### 手动部署

```bash
# 1. 克隆项目
git clone https://github.com/your-username/cloudflare-reminder.git
cd cloudflare-reminder

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp wrangler.toml.example wrangler.toml  # 编辑配置

# 4. 部署
npm run deploy
```

## 功能特性

- 🔐 **密码认证** - 只有知道密码的人才能访问和添加提醒
- 🎨 **炫酷界面** - 紫色粒子背景动画效果
- 📝 简约优雅的事件添加界面
- 📅 支持设置提醒日期、标题、内容
- 🔔 通过 Bark 推送通知
- ⏰ 每天自动检查并推送当日提醒
- 💾 数据持久化存储在 KV 数据库

## 部署到 Cloudflare

### 方法一：手动部署（推荐用于学习和调试）

#### 1. 安装 Wrangler CLI

```bash
npm install -g wrangler
```

#### 2. 登录 Cloudflare

```bash
npx wrangler login
```

#### 3. 创建 KV 命名空间

```bash
npx wrangler kv:namespace create "REMINDERS_KV"
```

#### 4. 配置 Wrangler

编辑 `wrangler.toml`，修改以下配置：

```toml
[[kv_namespaces]]
binding = "REMINDERS_KV"
id = "你的-KV-ID"  # 替换为上一步创建的 KV ID

[vars]
INVITE_CODE = "123456"          # 用户注册邀请码
ADMIN_USERNAME = "admin"        # 管理员用户名
ADMIN_PASSWORD = "admin123456"  # 管理员密码
```

#### 5. 部署到 Cloudflare

```bash
npm run deploy
```

#### 6. 设置定时任务

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 Workers & Pages
3. 找到你的 worker，点击"Triggers"
4. 在"Cron Triggers"部分点击"Add"
5. 设置 cron 表达式：`0 8 * * *`（每天 UTC 8 点，即北京时间 16 点）
6. 点击"Save and Deploy"

### 方法二：GitHub Actions 一键部署（无需本地 wrangler）

#### 1. Fork 项目到你的 GitHub

1. 访问项目仓库
2. 点击右上角 "Fork" 按钮

#### 2. 配置 GitHub Secrets

在你的 GitHub 仓库中，进入 **Settings > Secrets and variables > Actions**：

添加以下密钥：

| Secret Name | 描述 | 示例值 |
|-------------|------|--------|
| `CF_API_TOKEN` | Cloudflare API Token | `your-cloudflare-api-token` |
| `CF_ACCOUNT_ID` | Cloudflare Account ID | `your-account-id` |
| `KV_NAMESPACE_ID` | KV Namespace ID (可选，GitHub Actions 会自动创建) | `your-kv-namespace-id` |
| `INVITE_CODE` | 用户注册邀请码 | `123456` |
| `ADMIN_USERNAME` | 管理员用户名 | `admin` |
| `ADMIN_PASSWORD` | 管理员密码 | `admin123456` |

##### 如何获取 Cloudflare API Token：

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **My Profile > API Tokens**
3. 点击 "Create Token"
4. 选择 "Edit Cloudflare Workers" 模板
5. 创建 Token 并复制

##### 如何获取 Account ID：

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 在右侧面板中找到 "Account ID"
3. 复制 Account ID

##### 如何获取 KV Namespace ID：

**方法1：使用 GitHub Actions（推荐）**
- GitHub Actions 会自动为你创建 KV namespace
- 无需手动配置 `KV_NAMESPACE_ID`，Actions 会自动处理

**方法2：手动创建**
```bash
# 如果你有 wrangler，可以运行：
npx wrangler kv:namespace create "REMINDERS_KV"
```

**方法3：在 Cloudflare Dashboard 中创建**
1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages > KV**
3. 点击 "Create a namespace"
4. 命名空间名称：`REMINDERS_KV`
5. 创建后复制生成的 ID

**注意：**
- 如果使用 GitHub Actions，首次部署会自动创建 KV namespace
- 手动创建的 namespace ID 需要添加到 GitHub Secrets 中的 `KV_NAMESPACE_ID`
- 同一个 namespace 可以被多个 Worker 使用

#### 3. 推送代码自动部署

```bash
# 克隆你的 fork
git clone https://github.com/your-username/cloudflare-reminder.git
cd cloudflare-reminder

# 修改配置（可选）
# 编辑 wrangler.toml 中的 name 和其他配置

# 推送代码，触发自动部署
git add .
git commit -m "Deploy to Cloudflare"
git push origin main
```

#### 4. 查看部署状态

1. 进入 GitHub 仓库的 **Actions** 标签页
2. 查看最新的 workflow 运行状态
3. 部署成功后，在 "deploy" job 的输出中查看 Worker URL

### 环境变量配置详解

| 变量名 | 必需 | 说明 | 默认值 | 示例 |
|--------|------|------|--------|------|
| `INVITE_CODE` | ✅ | 用户注册邀请码 | `123456` | `abc123def456` |
| `ADMIN_USERNAME` | ✅ | 管理员用户名 | `admin` | `administrator` |
| `ADMIN_PASSWORD` | ✅ | 管理员密码 | `admin123456` | `your-secure-password` |

**注意：**
- 管理员账号通过环境变量固定，不能通过注册创建
- 建议定期更换管理员密码
- 生产环境使用强密码

## 使用说明

### 1. 认证访问

首次访问时会要求输入密码：
- 默认密码：`123456`
- 可在 `wrangler.toml` 的 `[vars]` 部分修改 `AUTH_PASSWORD`

### 2. 获取 Bark 设备 Key

1. 在 iPhone 上安装 [Bark App](https://apps.apple.com/cn/app/bark-custom-notifications/id1403753865)
2. 打开 App，点击底部的按钮获取设备 Key
3. 格式类似：`https://api.day.app/你的设备key`

### 3. 添加提醒

1. 输入密码认证进入
2. 选择提醒日期（支持未来任意日期）
3. 输入标题和内容
4. 填写 Bark 服务器地址
5. 点击"添加提醒"

### 4. 测试功能

- **测试每日检查**：模拟检查今天的提醒
- **测试 Bark 推送**：测试 Bark 通知是否正常工作

## 推送方式扩展

### 支持的推送服务

目前支持以下推送服务：

- **Bark**: iOS 通知服务
- **Server酱**: 微信推送服务

### 添加新的推送方式

添加新的推送方式只需要在 `src/modules/push-registry.js` 中的 `PUSH_SERVICES` 对象里注册即可。

#### 1. 在推送注册器中添加新服务

编辑 `src/modules/push-registry.js`，在 `PUSH_SERVICES` 对象中添加新的推送服务：

```javascript
PUSH_SERVICES.your_service = {
  name: 'Your Service Name',           // 显示名称
  validateConfig: (config) => {        // 配置验证函数
    if (!config.apiKey || config.apiKey.length < 10) {
      throw new Error('API Key 不合法');
    }
    // 添加其他验证逻辑...
  },
  getSafeConfig: (config) => ({        // 返回安全的配置信息（隐藏敏感数据）
    hasApiKey: true,
    hasOtherParam: !!config.otherParam
  }),
  send: async (config, title, content) => {  // 推送实现函数
    const { apiKey, otherParam } = config;
    const apiUrl = `https://api.your-service.com/push`;

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          title: title,
          content: content,
          // 其他参数...
        })
      });

      return {
        success: response.ok,
        message: response.ok ? '发送成功' : '发送失败',
        status: response.status
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}
```

#### 2. 更新前端界面（可选）

如果需要自定义配置表单，可以修改 `src/index.js` 中的 HTML 模板：

```html
<!-- 在推送类型选择中添加新选项 -->
<option value="your_service">Your Service Name</option>
```

#### 3. 示例：添加钉钉机器人推送

```javascript
PUSH_SERVICES.dingtalk = {
  name: '钉钉机器人',
  validateConfig: (config) => {
    if (!config.webhook || !config.webhook.includes('dingtalk.com')) {
      throw new Error('DingTalk Webhook 不合法');
    }
  },
  getSafeConfig: (config) => ({
    hasWebhook: true,
    hasSecret: !!config.secret
  }),
  send: async (config, title, content) => {
    const { webhook, secret } = config;

    let requestBody = {
      msgtype: "text",
      text: {
        content: `${title}\n\n${content}`
      }
    };

    // 如果有 secret，计算签名
    if (secret) {
      const timestamp = Date.now();
      const stringToSign = timestamp + '\n' + secret;
      const sign = await crypto.subtle.digest('SHA256', new TextEncoder().encode(stringToSign));
      const signHex = Array.from(new Uint8Array(sign)).map(b => b.toString(16).padStart(2, '0')).join('');
      requestBody.timestamp = timestamp;
      requestBody.sign = signHex;
    }

    const response = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    return {
      success: response.ok,
      message: response.ok ? '发送成功' : '发送失败',
      status: response.status
    };
  }
}
```

#### 4. 示例：添加企业微信推送

```javascript
PUSH_SERVICES.wechat = {
  name: '企业微信',
  validateConfig: (config) => {
    if (!config.corpid || !config.corpsecret || !config.agentid) {
      throw new Error('企业微信配置不完整');
    }
  },
  getSafeConfig: (config) => ({
    hasCorpId: true,
    hasAgentId: true
  }),
  send: async (config, title, content) => {
    const { corpid, corpsecret, agentid } = config;

    // 获取 access_token（生产环境建议缓存）
    const tokenResponse = await fetch(`https://qyapi.weixin.qq.com/cgi-bin/gettoken?corpid=${corpid}&corpsecret=${corpsecret}`);
    const tokenData = await tokenResponse.json();

    if (tokenData.errcode !== 0) {
      return { success: false, error: tokenData.errmsg };
    }

    // 发送消息
    const response = await fetch(`https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token=${tokenData.access_token}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        touser: "@all",
        agentid: agentid,
        msgtype: "text",
        text: {
          content: `${title}\n\n${content}`
        }
      })
    });

    const result = await response.json();
    return {
      success: result.errcode === 0,
      message: result.errcode === 0 ? '发送成功' : result.errmsg,
      status: response.status
    };
  }
}
```

#### 5. 测试新推送方式

1. 重新部署 Worker
2. 在前端添加新的推送配置
3. 使用"测试推送"功能验证
4. 检查推送服务是否正常接收消息

**优势：**
- ✅ 只需在一个文件中添加配置
- ✅ 自动集成验证和安全处理
- ✅ 前端界面自动支持（如果使用标准配置字段）
- ✅ 完整的错误处理和日志记录

### 推送配置模板

| 服务名称 | 配置参数 | 示例 |
|----------|----------|------|
| Bark | `url`, `sound` | `https://api.day.app/YOUR_KEY` |
| Server酱 | `sendKey`, `channel` | `SCT1234567890` |
| 钉钉机器人 | `webhook`, `secret` | `https://oapi.dingtalk.com/robot/send?access_token=xxx` |

## 项目结构

```
cloudflare-reminder/
├── .github/workflows/     # GitHub Actions 配置
│   └── deploy.yml        # 自动部署工作流
├── wrangler.toml         # Cloudflare Worker 配置
├── package.json          # 项目依赖
├── src/
│   ├── index.js          # Worker 主入口和路由
│   └── modules/          # 模块化代码
│       ├── auth.js       # 认证模块
│       ├── push.js       # 推送配置模块
│       ├── push-registry.js  # 推送服务注册器 ⭐ 新增
│       ├── reminder.js   # 提醒管理模块
│       ├── admin.js      # 管理员功能模块
│       └── utils.js      # 工具函数
└── README.md             # 使用文档
```

## 定时任务工作流程

1. 每天定时触发（可在 wrangler.toml 中修改时间）
2. 获取 KV 中存储的所有提醒
3. 筛选出当天的提醒
4. 通过 Bark API 发送推送通知
5. 日志记录推送结果

## 环境变量

| 变量名 | 说明 | 默认值 |
|--------|------|--------|
| `AUTH_PASSWORD` | 访问密码 | `123456` |

在 `wrangler.toml` 中配置：

```toml
[vars]
AUTH_PASSWORD = "你的密码"
```

## 注意事项

- 定时任务使用 UTC 时区，请根据需要调整，比如你要检查时间为每天早上8点北京时间。那定时应该设置 0点 UTC
- Bark 推送需要有效的服务器地址和设备 Key
- 密码认证使用 sessionStorage，刷新页面需要重新输入
- 生产环境建议添加更复杂的安全机制

## License

MIT

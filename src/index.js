import { handleRegister, handleLogin, handleGetUser } from './modules/auth.js';
import { getPushConfigs, addPushConfig, deletePushConfig, testPushConfig, testNewPushConfig } from './modules/push.js';
import { getReminders, addReminder, deleteReminder, testCheckReminders, checkAndSendReminders } from './modules/reminder.js';
import { getAllUsers, deleteUser } from './modules/admin.js';
import {
  authenticate,
  generateToken,
  hashPassword,
  validateInput,
  sendJSON,
  checkRateLimit
} from './modules/utils.js';

// HTML 模板函数（保留在主文件中）
function getHTML() {
  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Time Reminder</title>
  <meta name="referrer" content="no-referrer">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; background: #0a0a0f; min-height: 100vh; color: #fff; }
    #particles { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 0; }
    .container { position: relative; z-index: 1; max-width: 900px; margin: 0 auto; padding: 40px 20px; }
    .header { text-align: center; margin-bottom: 50px; }
    .header h1 { color: #fff; font-size: 2.5em; font-weight: 200; letter-spacing: 4px; text-shadow: 0 0 40px rgba(139, 92, 246, 0.5); margin-bottom: 10px; }
    .header p { color: rgba(255,255,255,0.6); font-size: 1em; letter-spacing: 2px; }
    .card { background: rgba(255, 255, 255, 0.05); backdrop-filter: blur(20px); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 24px; padding: 30px; margin-bottom: 25px; transition: all 0.4s ease; }
    .card:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(139, 92, 246, 0.3); box-shadow: 0 20px 60px rgba(139, 92, 246, 0.2); }
    .card h2 { color: #fff; margin-bottom: 25px; font-weight: 400; font-size: 1.3em; display: flex; align-items: center; gap: 10px; }
    .card h2::before { content: ""; width: 4px; height: 20px; background: linear-gradient(180deg, #8b5cf6, #6366f1); border-radius: 2px; }
    .auth-form { max-width: 400px; margin: 40px auto; text-align: center; }
    .auth-icon { font-size: 60px; margin-bottom: 20px; }
    .tabs { display: flex; gap: 10px; margin-bottom: 20px; justify-content: center; }
    .tab { padding: 10px 25px; border: none; border-radius: 10px; background: rgba(255,255,255,0.1); color: rgba(255,255,255,0.6); cursor: pointer; transition: all 0.3s; font-size: 14px; }
    .tab.active { background: rgba(139, 92, 246, 0.3); color: #fff; }
    .tab:hover { background: rgba(139, 92, 246, 0.2); }
    .form-group { margin-bottom: 20px; }
    label { display: block; margin-bottom: 8px; color: rgba(255,255,255,0.8); font-size: 0.9em; }
    input, textarea, select { width: 100%; padding: 14px 18px; border: 2px solid rgba(255, 255, 255, 0.1); border-radius: 12px; font-size: 15px; color: #fff; background: rgba(255, 255, 255, 0.05); transition: all 0.3s; }
    input:focus, textarea:focus, select:focus { outline: none; border-color: #8b5cf6; background: rgba(255, 255, 255, 0.1); box-shadow: 0 0 20px rgba(139, 92, 246, 0.2); }
    input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.3); }
    textarea { min-height: 100px; resize: vertical; }
    select option { background: #1a1a2e; }
    .btn { padding: 14px 30px; border: none; border-radius: 12px; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.3s; position: relative; overflow: hidden; }
    .btn-primary { background: linear-gradient(135deg, #8b5cf6, #6366f1); color: white; width: 100%; }
    .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(139, 92, 246, 0.4); }
    .btn-primary::before { content: ""; position: absolute; top: 0; left: -100%; width: 100%; height: 100%; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent); transition: left 0.5s ease; }
    .btn-primary:hover::before { left: 100%; }
    .btn-danger { background: rgba(239, 68, 68, 0.2); border: 2px solid #ef4444; color: #ef4444; padding: 8px 16px; font-size: 13px; }
    .btn-danger:hover { background: #ef4444; color: white; }
    .btn-small { padding: 10px 20px; font-size: 13px; margin-right: 10px; }
    .btn-secondary { background: rgba(139, 92, 246, 0.2); border: 1px solid rgba(139, 92, 246, 0.3); color: #a78bfa; }
    .btn-secondary:hover { background: rgba(139, 92, 246, 0.3); }
    .reminder-item { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 20px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-start; transition: all 0.3s; }
    .reminder-item:hover { background: rgba(255, 255, 255, 0.06); transform: translateX(5px); border-color: rgba(139, 92, 246, 0.3); }
    .reminder-info h3 { color: #fff; font-size: 1.05em; margin-bottom: 6px; }
    .reminder-info p { color: rgba(255,255,255,0.5); font-size: 0.9em; margin-bottom: 8px; word-break: break-word; }
    .reminder-meta { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; font-size: 0.85em; }
    .badge { padding: 4px 10px; border-radius: 15px; font-size: 12px; }
    .badge-push { background: rgba(139, 92, 246, 0.2); border: 1px solid rgba(139, 92, 246, 0.3); color: #a78bfa; }
    .badge-date { color: #8b5cf6; }
    .push-config-item { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 18px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
    .push-config-info h4 { color: #fff; font-size: 1em; margin-bottom: 5px; }
    .push-config-info p { color: rgba(255,255,255,0.5); font-size: 0.85em; }
    .empty-state { text-align: center; padding: 40px; color: rgba(255,255,255,0.4); }
    .toolbar { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; flex-wrap: wrap; gap: 10px; }
    .user-info { color: rgba(255,255,255,0.6); font-size: 0.9em; }
    .hidden { display: none !important; }
    .fade-in { animation: fadeIn 0.5s ease; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
    .section-title { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .section-title h3 { color: #fff; font-size: 1.1em; }
    .error-message { color: #ef4444; background: rgba(239, 68, 68, 0.1); padding: 12px; border-radius: 10px; margin-bottom: 15px; font-size: 0.9em; }
    .success-message { color: #10b981; background: rgba(16, 185, 129, 0.1); padding: 12px; border-radius: 10px; margin-bottom: 15px; font-size: 0.9em; }
    .sound-options { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 10px; }
    .sound-option { padding: 8px 14px; border: 1px solid rgba(255,255,255,0.2); border-radius: 8px; cursor: pointer; transition: all 0.2s; font-size: 0.85em; color: rgba(255,255,255,0.7); }
    .sound-option:hover { border-color: rgba(139, 92, 246, 0.5); }
    .sound-option.selected { background: rgba(139, 92, 246, 0.3); border-color: #8b5cf6; color: #fff; }
    .config-masked { font-family: monospace; background: rgba(0,0,0,0.2); padding: 8px 12px; border-radius: 6px; margin-top: 8px; font-size: 0.8em; color: rgba(255,255,255,0.5); }
    .loading { opacity: 0.6; pointer-events: none; }
    .tooltip { position: relative; }
    .tooltip::after { content: "已屏蔽敏感信息"; position: absolute; bottom: 100%; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); padding: 5px 10px; border-radius: 4px; font-size: 12px; white-space: nowrap; opacity: 0; transition: opacity 0.3s; pointer-events: none; }
    .tooltip:hover::after { opacity: 1; }
    .user-item { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 14px; padding: 18px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; }
    .user-item:hover { background: rgba(255, 255, 255, 0.06); }
    .user-info h4 { color: #fff; font-size: 1em; margin-bottom: 5px; }
    .user-info p { color: rgba(255,255,255,0.5); font-size: 0.85em; }
    .badge-admin { background: rgba(139, 92, 246, 0.3); border: 1px solid rgba(139, 92, 246, 0.5); color: #a78bfa; padding: 4px 10px; border-radius: 15px; font-size: 12px; margin-left: 8px; }
  </style>
</head>
<body>
  <canvas id="particles"></canvas>
  <div class="container">
    <header class="header">
      <h1>REMINDER</h1>
      <p>一个基于日期的提醒工具</p>
    </header>

    <div id="authSection" class="card auth-form fade-in">
      <div class="auth-icon">🔐</div>
      <div class="tabs">
        <button class="tab active" data-tab="login" onclick="showAuthTab('login')">登录</button>
        <button class="tab" data-tab="register" onclick="showAuthTab('register')">注册</button>
      </div>
      <div id="authError" class="error-message hidden"></div>
      <div id="authSuccess" class="success-message hidden"></div>

      <div id="loginForm">
        <form onsubmit="handleLogin(event)">
          <div class="form-group">
            <input type="text" id="loginUsername" placeholder="用户名" required autocomplete="username" spellcheck="false">
          </div>
          <div class="form-group">
            <input type="password" id="loginPassword" placeholder="密码" required autocomplete="current-password">
          </div>
          <button type="submit" class="btn btn-primary">登录</button>
        </form>
      </div>

      <div id="registerForm" class="hidden">
        <form onsubmit="handleRegister(event)">
          <div class="form-group">
            <input type="text" id="regUsername" placeholder="用户名 (3-20位, 字母/数字/下划线)" required minlength="3" maxlength="20" pattern="[a-zA-Z0-9_]+" autocomplete="username">
          </div>
          <div class="form-group">
            <input type="password" id="regPassword" placeholder="密码 (至少6位)" required minlength="6" autocomplete="new-password">
          </div>
          <div class="form-group">
            <input type="text" id="regInviteCode" placeholder="邀请码" required autocomplete="off">
          </div>
          <button type="submit" class="btn btn-primary">注册</button>
        </form>
      </div>
    </div>

    <div id="mainSection" class="hidden">
      <div class="toolbar">
        <span class="user-info">👤 <span id="displayUsername"></span></span>
        <button class="btn btn-secondary btn-small" onclick="logout()">退出</button>
      </div>

      <div class="card fade-in">
        <div class="section-title">
          <h3>🔔 推送配置</h3>
          <button class="btn btn-primary btn-small" onclick="showAddPushConfig()">添加推送</button>
        </div>
        <div id="pushConfigsList"></div>
      </div>

      <div class="card fade-in">
        <h2>📅 添加提醒</h2>
        <div id="reminderError" class="error-message hidden"></div>
        <div id="reminderSuccess" class="success-message hidden"></div>
        <form onsubmit="handleAddReminder(event)">
          <div class="form-group">
            <label>提醒日期</label>
            <input type="date" id="reminderDate" required>
          </div>
          <div class="form-group">
            <label>标题</label>
            <input type="text" id="reminderTitle" placeholder="输入提醒标题" required maxlength="100">
          </div>
          <div class="form-group">
            <label>内容</label>
            <textarea id="reminderContent" placeholder="输入提醒内容" maxlength="500"></textarea>
          </div>
          <div class="form-group">
            <label>推送方式</label>
            <select id="reminderPushConfig" required>
              <option value="">请选择推送配置</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary">添加提醒</button>
        </form>
      </div>

      <div class="card fade-in">
        <h2>📋 提醒列表</h2>
        <div id="remindersList"></div>
      </div>

      <div id="adminSection" class="card fade-in hidden">
        <div class="section-title">
          <h3>👥 用户管理</h3>
          <button class="btn btn-primary btn-small" onclick="loadUsers()">刷新</button>
        </div>
        <div id="usersList"></div>
      </div>
    </div>

    <div id="pushConfigModal" class="card hidden" style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 100; width: 90%; max-width: 500px;">
      <h2 id="pushConfigModalTitle">添加推送配置</h2>
      <div id="pushConfigError" class="error-message hidden"></div>
      <div id="pushConfigSuccess" class="success-message hidden"></div>

      <form onsubmit="handleAddPushConfig(event)">
        <div class="form-group">
          <label>配置名称</label>
          <input type="text" id="pushConfigName" placeholder="例如: 我的iPhone" required maxlength="30">
        </div>

        <div class="form-group">
          <label>推送类型</label>
          <select id="pushConfigType" onchange="updatePushConfigFields()" required>
            <option value="">请选择类型</option>
            <option value="bark">Bark</option>
            <option value="serverchan">Server酱</option>
          </select>
        </div>

        <div id="barkFields" class="hidden">
          <div class="form-group">
            <label>Bark 服务器地址</label>
            <input type="url" id="barkUrl" placeholder="例如: https://api.day.app/ABC123">
          </div>
          <div class="form-group">
            <label>通知声音 (可选)</label>
            <div class="sound-options">
              <div class="sound-option" data-sound="" onclick="selectSound(this)">无</div>
              <div class="sound-option" data-sound="bells" onclick="selectSound(this)">bloom</div>
              <div class="sound-option" data-sound="california" onclick="selectSound(this)">chime</div>
              <div class="sound-option" data-sound="chime" onclick="selectSound(this)">choo</div>
              <div class="sound-option" data-sound="glass" onclick="selectSound(this)">glass</div>
              <div class="sound-option" data-sound="notification" onclick="selectSound(this)">paymentsuccess</div>
            </div>
          </div>
        </div>

        <div id="serverchanFields" class="hidden">
          <div class="form-group">
            <label>SendKey</label>
            <input type="text" id="serverchanKey" placeholder="Server酱的 SendKey">
          </div>
        </div>

        <div style="display: flex; gap: 10px; margin-top: 20px;">
          <button type="button" class="btn btn-secondary btn-small" onclick="hidePushConfigModal()">取消</button>
          <button type="button" class="btn btn-secondary btn-small" onclick="testCurrentPushConfig()">测试</button>
          <button type="submit" class="btn btn-primary">保存</button>
        </div>
      </form>
    </div>

    <div id="modalOverlay" class="hidden" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 99;" onclick="hidePushConfigModal()"></div>

  </div>

  <script>
    var API_BASE = "/api";
    var token = localStorage.getItem("token");
    var currentPushConfigs = [];
    var selectedSound = "";
    var isLoading = false;
    console.log("Time Reminder v2.0 - Loaded");

    (function() {
      var canvas = document.getElementById("particles");
      if (!canvas) return;
      var ctx = canvas.getContext("2d");
      var particles = [];
      var particleCount = 60;
      function resizeCanvas() { canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
      resizeCanvas(); window.addEventListener("resize", resizeCanvas);
      function Particle() { this.reset(); }
      Particle.prototype.reset = function() {
        this.x = Math.random() * canvas.width; this.y = Math.random() * canvas.height;
        this.vx = (Math.random() - 0.5) * 0.3; this.vy = (Math.random() - 0.5) * 0.3;
        this.radius = Math.random() * 2 + 1; this.alpha = Math.random() * 0.4 + 0.1; this.hue = 250 + Math.random() * 30;
      };
      Particle.prototype.update = function() {
        this.x += this.vx; this.y += this.vy;
        if (this.x < 0 || this.x > canvas.width || this.y < 0 || this.y > canvas.height) { this.reset(); }
      };
      Particle.prototype.draw = function() {
        ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = "hsla(" + this.hue + ", 70%, 60%, " + this.alpha + ")"; ctx.fill();
      };
      function initParticles() { particles = []; for (var i = 0; i < particleCount; i++) { particles.push(new Particle()); } }
      function animateParticles() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        for (var i = 0; i < particles.length; i++) { particles[i].update(); particles[i].draw(); }
        for (var i = 0; i < particles.length; i++) {
          for (var j = i + 1; j < particles.length; j++) {
            var p1 = particles[i]; var p2 = particles[j];
            var dx = p1.x - p2.x; var dy = p1.y - p2.y;
            var distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 120) {
              ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y);
              ctx.strokeStyle = "rgba(139, 92, 246, " + (0.08 * (1 - distance / 120)) + ")";
              ctx.lineWidth = 0.5; ctx.stroke();
            }
          }
        }
        requestAnimationFrame(animateParticles);
      }
      initParticles(); animateParticles();
    })();

    function showAuthTab(tab) {
      console.log("showAuthTab called with:", tab);
      document.getElementById("loginForm").classList.toggle("hidden", tab !== "login");
      document.getElementById("registerForm").classList.toggle("hidden", tab !== "register");
      document.querySelectorAll(".tab").forEach(function(t) {
        t.classList.toggle("active", t.getAttribute("data-tab") === tab);
      });
      document.querySelectorAll(".error-message, .success-message").forEach(function(el) { el.classList.add("hidden"); });
    }

    function handleRegister(e) {
      console.log("handleRegister called");
      e.preventDefault();
      if (isLoading) return;
      isLoading = true;
      var btn = e.target.querySelector('button[type="submit"]');
      if (!btn) { isLoading = false; return; }
      btn.textContent = "注册中..."; btn.classList.add("loading");

      var username = document.getElementById("regUsername").value.trim();
      var password = document.getElementById("regPassword").value;
      var inviteCode = document.getElementById("regInviteCode").value.trim();
      console.log("Attempting registration for:", username);

      ajaxRequest("/api/auth/register", "POST",
        { username: username, password: password, inviteCode: inviteCode },
        function(res) {
          console.log("Register response:", res);
          isLoading = false;
          if (btn) { btn.textContent = "注册"; btn.classList.remove("loading"); }
          if (res.error) {
            console.log("Add push config error:", res.error);
            showMessage("authError", res.error);
          }
          else {
            console.log("Registration successful, showing login");
            showMessage("authSuccess", "注册成功，请登录");
            setTimeout(function() {
              showAuthTab("login");
              document.getElementById("regUsername").value = "";
              document.getElementById("regPassword").value = "";
              document.getElementById("regInviteCode").value = "";
            }, 1500);
          }
        },
        function(status) {
          isLoading = false;
          if (btn) { btn.textContent = "注册"; btn.classList.remove("loading"); }
          showMessage("authError", "注册失败 (HTTP " + status + ")");
        },
        10000
      );
    }

    function handleLogin(e) {
      console.log("handleLogin called");
      e.preventDefault();
      if (isLoading) return;
      isLoading = true;
      var btn = e.target.querySelector('button[type="submit"]');
      if (!btn) { isLoading = false; return; }
      btn.textContent = "登录中..."; btn.classList.add("loading");

      var username = document.getElementById("loginUsername").value.trim();
      var password = document.getElementById("loginPassword").value;
      console.log("Attempting login for:", username);

      ajaxRequest("/api/auth/login", "POST",
        { username: username, password: password },
        function(res) {
          console.log("Login response:", res);
          isLoading = false;
          if (btn) { btn.textContent = "登录"; btn.classList.remove("loading"); }
          if (res.error) { showMessage("authError", res.error); }
          else {
            console.log("Login successful, saving token and reloading");
            localStorage.setItem("token", res.token); localStorage.setItem("username", res.user.username); localStorage.setItem("isAdmin", res.user.isAdmin ? "true" : "false"); location.reload();
          }
        },
        function(err) {
          console.log("Login error:", err);
          isLoading = false;
          if (btn) { btn.textContent = "登录"; btn.classList.remove("loading"); }
          showMessage("authError", "登录失败，请稍后重试");
        },
        10000
      );
    }

    function logout() {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      localStorage.removeItem("isAdmin");
      location.reload();
    }

    function showMessage(id, msg) {
      var el = document.getElementById(id);
      if (el) { el.textContent = msg; el.classList.remove("hidden"); }
      setTimeout(function() { if (el) { el.classList.add("hidden"); } }, 4000);
    }

    function ajaxRequest(url, method, data, onSuccess, onError, timeout) {
      console.log("ajaxRequest:", method, url);
      var xhr = new XMLHttpRequest();
      xhr.open(method, url, true);
      xhr.setRequestHeader("Content-Type", "application/json");
      if (token) { xhr.setRequestHeader("Authorization", "Bearer " + token); }
      if (timeout) { xhr.timeout = timeout; }
      xhr.onreadystatechange = function() {
        if (xhr.readyState === 4) {
          console.log("ajaxRequest response:", xhr.status, xhr.statusText);
          if (xhr.status >= 200 && xhr.status < 300) {
            try { onSuccess(JSON.parse(xhr.responseText)); } catch(e) { onSuccess(xhr.responseText); }
          } else { onError(xhr.status); }
        }
      };
      xhr.ontimeout = function() { console.log("ajaxRequest timeout"); onError(408); };
      xhr.onerror = function() { console.log("ajaxRequest error"); onError(0); };
      xhr.send(JSON.stringify(data || {}));
    }

    function showMainSection() {
      console.log("showMainSection called");
      document.getElementById("authSection").classList.add("hidden");
      document.getElementById("mainSection").classList.remove("hidden");
      document.getElementById("displayUsername").textContent = localStorage.getItem("username") || "";
      loadPushConfigs();
      loadReminders();
      document.getElementById("reminderDate").valueAsDate = new Date();
      if (localStorage.getItem("isAdmin") === "true") {
        document.getElementById("adminSection").classList.remove("hidden");
        loadUsers();
      } else {
        document.getElementById("adminSection").classList.add("hidden");
      }
    }

    function loadPushConfigs() {
      ajaxRequest("/api/pushConfigs", "GET", null, function(configs) {
        currentPushConfigs = configs;
        var html = "";
        if (configs.length === 0) { html = "<div class='empty-state'>暂无推送配置，点击右上角添加</div>"; }
        else {
          for (var i = 0; i < configs.length; i++) {
            var c = configs[i];
            var typeName = c.type === "bark" ? "Bark" : "Server酱";
            var preview = maskConfig(c);
            html += '<div class="push-config-item"><div class="push-config-info"><h4>' + escapeHtml(c.name) + '</h4><p>' + typeName + (c.config.sound ? " - " + c.config.sound : "") + '</p><div class="config-masked tooltip">' + preview + '</div></div><div><button class="btn btn-secondary btn-small" data-id="' + escapeHtml(c.id) + '" onclick="testPushConfigById(this.dataset.id)">测试</button><button class="btn btn-danger" data-id="' + escapeHtml(c.id) + '" onclick="deletePushConfig(this.dataset.id)">删除</button></div></div>';
          }
        }
        document.getElementById("pushConfigsList").innerHTML = html;

        var select = document.getElementById("reminderPushConfig");
        select.innerHTML = '<option value="">请选择推送配置</option>';
        for (var j = 0; j < configs.length; j++) {
          var opt = document.createElement("option");
          opt.value = configs[j].id;
          opt.textContent = configs[j].name + " (" + (configs[j].type === "bark" ? "Bark" : "Server酱") + ")";
          select.appendChild(opt);
        }
      });
    }

    function maskConfig(config) {
      if (config.type === "bark") {
        var url = config.config.url || "";
        var parts = url.split("/");
        if (parts.length > 0) {
          return "URL: " + parts[0] + "//***.***/" + (parts[parts.length - 1] || "***");
        }
        return "已配置";
      } else if (config.type === "serverchan") {
        var key = config.config.sendKey || "";
        return "Key: " + key.substring(0, 4) + "****" + key.substring(key.length - 2);
      }
      return "已配置";
    }

    function loadReminders() {
      ajaxRequest("/api/reminders", "GET", null, function(reminders) {
        var html = "";
        if (!reminders || reminders.length === 0) { html = "<div class='empty-state'>暂无提醒</div>"; }
        else {
          var sorted = reminders.slice().sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
          for (var i = 0; i < sorted.length; i++) {
            var r = sorted[i];
            var dateStr = new Date(r.date).toLocaleDateString("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" });
            html += '<div class="reminder-item"><div class="reminder-info"><h3>' + escapeHtml(r.title) + '</h3><p>' + escapeHtml(r.content || "") + '</p><div class="reminder-meta"><span class="badge badge-push">' + escapeHtml(r.pushConfigName) + '</span><span class="badge badge-date">' + dateStr + '</span></div></div><button class="btn btn-danger" data-id="' + escapeHtml(r.id) + '" onclick="deleteReminder(this.dataset.id)">删除</button></div>';
          }
        }
        document.getElementById("remindersList").innerHTML = html;
      });
    }

    function loadUsers() {
      ajaxRequest("/api/admin/users", "GET", null, function(res) {
        if (res.error) {
          document.getElementById("usersList").innerHTML = "<div class='empty-state'>" + res.error + "</div>";
          return;
        }
        var html = "";
        if (!res.users || res.users.length === 0) {
          html = "<div class='empty-state'>暂无用户</div>";
        } else {
          for (var i = 0; i < res.users.length; i++) {
            var u = res.users[i];
            var isCurrentUser = u.username === localStorage.getItem("username");
            html += '<div class="user-item"><div class="user-info"><h4>' + escapeHtml(u.username) + (u.isAdmin ? '<span class="badge-admin">管理员</span>' : '') + '</h4><p>注册时间: ' + new Date(u.createdAt).toLocaleString("zh-CN") + '</p></div><div class="user-actions">' + (isCurrentUser ? '<span style="color: rgba(255,255,255,0.4); font-size: 0.85em;">当前用户</span>' : '<button class="btn btn-danger btn-small" data-id="' + escapeHtml(u.id) + '" data-username="' + escapeHtml(u.username) + '" onclick="deleteUser(this.dataset.id, this.dataset.username)">删除</button>') + '</div></div>';
          }
        }
        document.getElementById("usersList").innerHTML = html;
      });
    }

    function showAddPushConfig() {
      document.getElementById("pushConfigModalTitle").textContent = "添加推送配置";
      document.getElementById("pushConfigName").value = "";
      document.getElementById("pushConfigType").value = "";
      document.getElementById("barkUrl").value = "";
      document.getElementById("serverchanKey").value = "";
      updatePushConfigFields();
      document.getElementById("pushConfigModal").classList.remove("hidden");
      document.getElementById("modalOverlay").classList.remove("hidden");
    }

    function hidePushConfigModal() {
      document.getElementById("pushConfigModal").classList.add("hidden");
      document.getElementById("modalOverlay").classList.add("hidden");
    }

    function updatePushConfigFields() {
      var type = document.getElementById("pushConfigType").value;
      document.getElementById("barkFields").classList.toggle("hidden", type !== "bark");
      document.getElementById("serverchanFields").classList.toggle("hidden", type !== "serverchan");
    }

    function selectSound(element) {
      document.querySelectorAll('.sound-option').forEach(function(el) {
        el.classList.remove('selected');
      });
      element.classList.add('selected');
      selectedSound = element.dataset.sound;
    }

    function handleAddPushConfig(e) {
      console.log("handleAddPushConfig called");
      e.preventDefault();
      if (isLoading) {
        console.log("Already loading, ignoring");
        return;
      }
      isLoading = true;

      var name = document.getElementById("pushConfigName").value.trim();
      var type = document.getElementById("pushConfigType").value;
      var config = {};
      if (type === "bark") {
        config.url = document.getElementById("barkUrl").value.trim();
        if (!config.url) { isLoading = false; showMessage("pushConfigError", "请填写 Bark 服务器地址"); return; }
        if (selectedSound) config.sound = selectedSound;
      } else if (type === "serverchan") {
        config.sendKey = document.getElementById("serverchanKey").value.trim();
        if (!config.sendKey) { isLoading = false; showMessage("pushConfigError", "请填写 SendKey"); return; }
      }

      var btn = e.target.querySelector('button[type="submit"]');
      if (btn) { btn.textContent = "保存中..."; btn.classList.add("loading"); }

      ajaxRequest("/api/pushConfigs", "POST", { name: name, type: type, config: config }, function(res) {
        isLoading = false;
        if (btn) { btn.textContent = "保存"; btn.classList.remove("loading"); }
        if (res.error) {
          console.log("Add push config error:", res.error);
          showMessage("pushConfigError", res.error);
        }
        else {
          console.log("Add push config success");
          showMessage("pushConfigSuccess", "添加成功");
          hidePushConfigModal();
          loadPushConfigs();
        }
      }, function(status) {
        isLoading = false;
        if (btn) { btn.textContent = "保存"; btn.classList.remove("loading"); }
        showMessage("pushConfigError", "保存失败 (HTTP " + status + ")");
      });
    }

    function testCurrentPushConfig() {
      var type = document.getElementById("pushConfigType").value;
      if (!type) { showMessage("pushConfigError", "请先选择推送类型"); return; }
      var config = {};
      if (type === "bark") {
        config.url = document.getElementById("barkUrl").value.trim();
        if (!config.url) { showMessage("pushConfigError", "请填写 Bark 服务器地址"); return; }
        if (selectedSound) config.sound = selectedSound;
      } else if (type === "serverchan") {
        config.sendKey = document.getElementById("serverchanKey").value.trim();
        if (!config.sendKey) { showMessage("pushConfigError", "请填写 SendKey"); return; }
      }
      var testData = { config: config, type: type };
      ajaxRequest("/api/pushConfigs/test-new", "POST", testData, function(res) {
        showMessage(res.success ? "pushConfigSuccess" : "pushConfigError", res.message || res.error || "测试完成");
      });
    }

    function testPushConfigById(id) {
      ajaxRequest("/api/pushConfigs/test", "POST", { id: id }, function(res) {
        alert(res.success ? res.message || "测试成功" : res.error || "测试失败");
      });
    }

    function deletePushConfig(id) {
      if (!confirm("确定删除此推送配置？")) return;
      ajaxRequest("/api/pushConfigs?id=" + id, "DELETE", null, function(res) {
        if (res.success) loadPushConfigs();
        else alert("删除失败");
      });
    }

    function handleAddReminder(e) {
      console.log("handleAddReminder called");
      e.preventDefault();

      if (isLoading) {
        console.log("Already loading, ignoring");
        return;
      }
      isLoading = true;

      var btn = e.target.querySelector('button[type="submit"]');
      if (btn) { btn.textContent = "添加中..."; btn.classList.add("loading"); }

      var pushConfigId = document.getElementById("reminderPushConfig").value;
      if (!pushConfigId) {
        isLoading = false;
        if (btn) { btn.textContent = "添加"; btn.classList.remove("loading"); }
        showMessage("reminderError", "请选择推送配置");
        return;
      }

      ajaxRequest("/api/reminders", "POST", {
        date: document.getElementById("reminderDate").value,
        title: document.getElementById("reminderTitle").value.trim(),
        content: document.getElementById("reminderContent").value.trim(),
        pushConfigId: pushConfigId
      }, function(res) {
        console.log("Add reminder response:", res);
        isLoading = false;
        if (btn) { btn.textContent = "添加"; btn.classList.remove("loading"); }

        if (res.success) {
          document.getElementById("reminderTitle").value = "";
          document.getElementById("reminderContent").value = "";
          loadReminders();
          showMessage("reminderSuccess", "添加成功");
        } else {
          showMessage("reminderError", res.error || "添加失败");
        }
      }, function(status) {
        isLoading = false;
        if (btn) { btn.textContent = "添加"; btn.classList.remove("loading"); }
        showMessage("reminderError", "添加失败 (HTTP " + status + ")");
      });
    }

    function deleteReminder(id) {
      if (!confirm("确定删除此提醒？")) return;
      ajaxRequest("/api/reminders?id=" + id, "DELETE", null, function(res) {
        if (res.success) loadReminders();
      });
    }

    function deleteUser(userId, username) {
      if (!confirm("确定要删除用户 " + username + " 吗？此操作不可恢复！")) return;
      ajaxRequest("/api/admin/deleteUser", "POST", { userId: userId, username: username }, function(res) {
        if (res.success) {
          loadUsers();
          showMessage("authSuccess", res.message);
        } else {
          showMessage("authError", res.error);
        }
      });
    }

    function testCheckReminders() {
      ajaxRequest("/api/test/check", "POST", null, function(res) {
        alert(res.message || "测试完成");
        loadReminders();
      });
    }

    function escapeHtml(text) {
      if (!text) return "";
      var div = document.createElement("div");
      div.textContent = text;
      return div.innerHTML;
    }

    if (token) {
      console.log("Token found in localStorage, verifying...");
      ajaxRequest("/api/auth/me", "GET", null, function(res) {
        console.log("/api/auth/me response:", res);
        if (res.user) {
          console.log("Token valid, showing main section");
          showMainSection();
        }
        else {
          console.log("Token invalid, clearing storage");
          localStorage.removeItem("token"); localStorage.removeItem("username"); localStorage.removeItem("isAdmin");
        }
      });
    }
   </script>
 </body>
</html>`;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const clientIP = request.headers.get('cf-connecting-ip') || 'unknown';

    if (path === '/' || path === '/index.html') {
      return new Response(getHTML(), {
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block'
        }
      });
    }

    if (path === '/api/auth/register' && request.method === 'POST') {
      return await handleRegister(request, env, clientIP);
    }
    if (path === '/api/auth/login' && request.method === 'POST') {
      return await handleLogin(request, env, clientIP);
    }
    if (path === '/api/auth/me' && request.method === 'GET') {
      return await handleGetUser(request, env);
    }

    const authResult = await authenticate(request, env);
    if (!authResult.success && path !== '/api/auth/register') {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json', 'X-Content-Type-Options': 'nosniff' }
      });
    }
    const { userId, username } = authResult;

    if (path === '/api/pushConfigs' && request.method === 'GET') {
      return await getPushConfigs(userId, env);
    }
    if (path === '/api/pushConfigs' && request.method === 'POST') {
      return await addPushConfig(request, userId, env);
    }
    if (path === '/api/pushConfigs' && request.method === 'DELETE') {
      return await deletePushConfig(request, userId, env);
    }
    if (path === '/api/pushConfigs/test' && request.method === 'POST') {
      return await testPushConfig(request, userId, env);
    }
    if (path === '/api/pushConfigs/test-new' && request.method === 'POST') {
      return await testNewPushConfig(request, userId, env);
    }

    if (path === '/api/reminders' && request.method === 'GET') {
      return await getReminders(userId, env);
    }
    if (path === '/api/reminders' && request.method === 'POST') {
      return await addReminder(request, userId, env);
    }
    if (path === '/api/reminders' && request.method === 'DELETE') {
      return await deleteReminder(request, userId, env);
    }

    if (path === '/api/test/check' && request.method === 'POST') {
      return await testCheckReminders(userId, env);
    }

    if (path === '/api/admin/users' && request.method === 'GET') {
      return await getAllUsers(request, userId, env);
    }
    if (path === '/api/admin/deleteUser' && request.method === 'POST') {
      return await deleteUser(request, userId, env);
    }

    return new Response('Not Found', { status: 404 });
  },

  async scheduled(event, env, ctx) {
    await checkAndSendReminders(env);
  }
};



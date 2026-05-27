const STORAGE_KEY = "petHotelSystemData_v1";

const roleNames = {
  owner: "飼主",
  receptionist: "櫃檯人員",
  groomer: "美容師",
  admin: "系統管理員"
};

const statusText = {
  pending: "待確認",
  confirmed: "已確認",
  cancelled: "已取消",
  inhouse: "入住中",
  done: "已完成",
  paid: "已付款",
  refunded: "已退款",
  progress: "服務中",
  available: "可使用",
  occupied: "使用中",
  maintenance: "維護中"
};

let state = loadData();
let currentUser = null;
let currentPage = "dashboard";
let authMode = "login";

function loadData() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);

  return {
    users: [
      { id: 1, name: "王小明", username: "owner", password: "123", role: "owner" },
      { id: 2, name: "林櫃台", username: "staff", password: "123", role: "receptionist" },
      { id: 3, name: "陳美容", username: "groomer", password: "123", role: "groomer" },
      { id: 4, name: "系統管理員", username: "admin", password: "123", role: "admin" }
    ],
    pets: [
      { id: 1, ownerId: 1, name: "布丁", type: "狗", breed: "柴犬", age: 3, vaccine: "已完成", need: "怕打雷，睡覺要小毯子" },
      { id: 2, ownerId: 1, name: "奶茶", type: "貓", breed: "英短", age: 2, vaccine: "已完成", need: "不喜歡陌生貓靠近" }
    ],
    rooms: [
      { id: 1, name: "A101 小型犬房", capacity: 1, price: 800, status: "available" },
      { id: 2, name: "B202 貓咪套房", capacity: 1, price: 700, status: "available" },
      { id: 3, name: "C303 大型犬房", capacity: 1, price: 1000, status: "maintenance" }
    ],
    services: [
      { id: 1, name: "基礎洗澡", price: 600, duration: "60 分鐘" },
      { id: 2, name: "洗澡 + 修毛", price: 1200, duration: "120 分鐘" },
      { id: 3, name: "指甲修剪", price: 250, duration: "20 分鐘" }
    ],
    bookings: [
      { id: 1001, ownerId: 1, petId: 1, type: "住宿", roomId: 1, serviceId: null, startDate: "2026-06-02", endDate: "2026-06-04", amount: 1600, bookingStatus: "confirmed", paymentStatus: "paid", serviceStatus: "pending", note: "需要早晚餵藥", report: "精神良好，食慾正常。" },
      { id: 1002, ownerId: 1, petId: 2, type: "美容", roomId: null, serviceId: 2, startDate: "2026-06-08", endDate: "2026-06-08", amount: 1200, bookingStatus: "pending", paymentStatus: "paid", serviceStatus: "pending", note: "請避開尾巴附近", report: "尚未開始服務。" }
    ],
    logs: [
      "系統建立示範資料",
      "王小明建立住宿預約 #1001",
      "王小明建立美容預約 #1002"
    ]
  };
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function $(selector) {
  return document.querySelector(selector);
}

function money(value) {
  return `NT$ ${Number(value || 0).toLocaleString()}`;
}

function nextId(list) {
  return list.length ? Math.max(...list.map(item => item.id)) + 1 : 1;
}

function statusBadge(value) {
  return `<span class="status ${value}">${statusText[value] || value}</span>`;
}

function getPet(id) {
  return state.pets.find(p => p.id === Number(id));
}

function getRoom(id) {
  return state.rooms.find(r => r.id === Number(id));
}

function getService(id) {
  return state.services.find(s => s.id === Number(id));
}

function getOwner(id) {
  return state.users.find(u => u.id === Number(id));
}

function daysBetween(start, end) {
  const s = new Date(start);
  const e = new Date(end);
  const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
  return Math.max(diff, 1);
}

function roleMenu(role) {
  const common = [{ key: "dashboard", label: "首頁總覽" }];
  const menus = {
    owner: [
      ...common,
      { key: "pets", label: "寵物資料" },
      { key: "booking", label: "預約住宿 / 美容" },
      { key: "orders", label: "我的預約與付款" },
      { key: "history", label: "歷史紀錄" }
    ],
    receptionist: [
      ...common,
      { key: "frontDesk", label: "住宿訂單管理" },
      { key: "rooms", label: "房間管理" },
      { key: "petStatus", label: "寵物狀態回報" }
    ],
    groomer: [
      ...common,
      { key: "grooming", label: "美容服務管理" },
      { key: "petStatus", label: "寵物注意事項" }
    ],
    admin: [
      ...common,
      { key: "adminUsers", label: "帳號管理" },
      { key: "adminServices", label: "服務與價格" },
      { key: "rooms", label: "房間資源" },
      { key: "reports", label: "營運報表" },
      { key: "logs", label: "系統紀錄" }
    ]
  };
  return menus[role] || common;
}

function render() {
  const app = $("#app");
  if (!currentUser) {
    app.innerHTML = renderAuth();
    bindAuthEvents();
    return;
  }

  app.innerHTML = `
    <div class="app-shell">
      <aside class="sidebar">
        <div class="logo">
          <div class="logo-icon">🐾</div>
          <div>
            <h1>寵物旅館</h1>
            <p>住宿 × 美容管理系統</p>
          </div>
        </div>
        <div class="user-box">
          <strong>${currentUser.name}</strong>
          <span class="role-badge">${roleNames[currentUser.role]}</span>
        </div>
        <nav>
          ${roleMenu(currentUser.role).map(item => `
            <button class="nav-btn ${currentPage === item.key ? "active" : ""}" data-page="${item.key}">${item.label}</button>
          `).join("")}
        </nav>
        <button class="logout-btn" id="logoutBtn">登出系統</button>
      </aside>
      <main class="main">${renderPage()}</main>
    </div>
  `;

  document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      currentPage = btn.dataset.page;
      render();
    });
  });

  $("#logoutBtn").addEventListener("click", () => {
    currentUser = null;
    currentPage = "dashboard";
    render();
  });

  bindPageEvents();
}

function renderAuth() {
  return `
    <div class="login-page">
      <section class="login-hero">
        <h1>寵物旅館與美容管理系統</h1>
        <p>整合飼主預約、寵物資料、付款、住宿房間、櫃檯入住退房、美容服務回報與管理員報表，作為 UML 設計後的 Generated System 原型。</p>
        <div class="demo-accounts">
          <strong>示範帳號密碼都是 123</strong>
          <code>飼主：owner / 123</code>
          <code>櫃檯：staff / 123</code>
          <code>美容師：groomer / 123</code>
          <code>管理員：admin / 123</code>
        </div>
      </section>
      <section class="login-panel">
        <div class="login-card">
          <h2>${authMode === "login" ? "登入系統" : "註冊飼主帳號"}</h2>
          <p>請使用示範帳號登入，或註冊新的飼主帳號。</p>
          <div class="tabs">
            <button class="tab ${authMode === "login" ? "active" : ""}" data-auth="login">登入</button>
            <button class="tab ${authMode === "register" ? "active" : ""}" data-auth="register">註冊</button>
          </div>
          <div id="authNotice"></div>
          ${authMode === "login" ? `
            <form id="loginForm">
              <div class="field"><label>帳號</label><input name="username" value="owner" required></div>
              <div class="field"><label>密碼</label><input name="password" type="password" value="123" required></div>
              <button class="btn" style="width:100%">登入</button>
            </form>
          ` : `
            <form id="registerForm">
              <div class="field"><label>姓名</label><input name="name" placeholder="例如：吳子昂" required></div>
              <div class="field"><label>帳號</label><input name="username" placeholder="建立登入帳號" required></div>
              <div class="field"><label>密碼</label><input name="password" type="password" placeholder="建立密碼" required></div>
              <button class="btn" style="width:100%">建立帳號</button>
            </form>
          `}
        </div>
      </section>
    </div>
  `;
}

function bindAuthEvents() {
  document.querySelectorAll(".tab").forEach(tab => {
    tab.addEventListener("click", () => {
      authMode = tab.dataset.auth;
      render();
    });
  });

  const loginForm = $("#loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", e => {
      e.preventDefault();
      const form = new FormData(loginForm);
      const username = form.get("username").trim();
      const password = form.get("password").trim();
      const user = state.users.find(u => u.username === username && u.password === password);
      if (!user) {
        $("#authNotice").innerHTML = `<div class="notice">帳號或密碼錯誤，請重新輸入。</div>`;
        return;
      }
      currentUser = user;
      currentPage = "dashboard";
      render();
    });
  }

  const registerForm = $("#registerForm");
  if (registerForm) {
    registerForm.addEventListener("submit", e => {
      e.preventDefault();
      const form = new FormData(registerForm);
      const username = form.get("username").trim();
      if (state.users.some(u => u.username === username)) {
        $("#authNotice").innerHTML = `<div class="notice">此帳號已存在，請換一個帳號。</div>`;
        return;
      }
      const user = {
        id: nextId(state.users),
        name: form.get("name").trim(),
        username,
        password: form.get("password").trim(),
        role: "owner"
      };
      state.users.push(user);
      state.logs.push(`${user.name} 註冊飼主帳號`);
      saveData();
      currentUser = user;
      currentPage = "dashboard";
      render();
    });
  }
}

function pageHeader(title, desc, actions = "") {
  return `
    <div class="topbar">
      <div>
        <h2>${title}</h2>
        <p>${desc}</p>
      </div>
      <div class="quick-actions">${actions}</div>
    </div>
  `;
}

function renderPage() {
  const pages = {
    dashboard: renderDashboard,
    pets: renderPets,
    booking: renderBooking,
    orders: renderOrders,
    history: renderHistory,
    frontDesk: renderFrontDesk,
    rooms: renderRooms,
    petStatus: renderPetStatus,
    grooming: renderGrooming,
    adminUsers: renderAdminUsers,
    adminServices: renderAdminServices,
    reports: renderReports,
    logs: renderLogs
  };
  return (pages[currentPage] || renderDashboard)();
}

function myBookings() {
  if (currentUser.role === "owner") return state.bookings.filter(b => b.ownerId === currentUser.id);
  return state.bookings;
}

function renderDashboard() {
  const bookings = myBookings();
  const todayBookings = bookings.filter(b => b.bookingStatus !== "cancelled");
  const paidTotal = bookings.filter(b => b.paymentStatus === "paid").reduce((sum, b) => sum + b.amount, 0);
  const activePets = currentUser.role === "owner" ? state.pets.filter(p => p.ownerId === currentUser.id).length : state.pets.length;
  const pending = bookings.filter(b => b.bookingStatus === "pending").length;

  return `
    ${pageHeader("首頁總覽", "快速查看目前系統狀態與常用功能。", currentUser.role === "owner" ? `<button class="btn" data-go="booking">新增預約</button>` : "")}
    <div class="grid cols-3">
      <div class="stat-card"><span>寵物數量</span><strong>${activePets}</strong></div>
      <div class="stat-card"><span>有效預約</span><strong>${todayBookings.length}</strong></div>
      <div class="stat-card"><span>待確認訂單</span><strong>${pending}</strong></div>
      <div class="stat-card"><span>付款金額</span><strong>${money(paidTotal)}</strong></div>
      <div class="stat-card"><span>房間總數</span><strong>${state.rooms.length}</strong></div>
      <div class="stat-card"><span>美容服務項目</span><strong>${state.services.length}</strong></div>
    </div>
    <div class="grid cols-2" style="margin-top:18px">
      <div class="card">
        <h3>近期預約</h3>
        ${renderBookingTable(bookings.slice(0, 5), false)}
      </div>
      <div class="card soft">
        <h3>系統功能對應</h3>
        <div class="timeline">
          <div class="timeline-item"><time>飼主</time><div>管理寵物、預約住宿 / 美容、付款、查看紀錄。</div></div>
          <div class="timeline-item"><time>櫃檯</time><div>確認訂單、安排房間、Check-in、Check-out。</div></div>
          <div class="timeline-item"><time>美容師</time><div>查看美容時程、更新服務狀態、回報異常。</div></div>
          <div class="timeline-item"><time>管理員</time><div>管理帳號、資源、服務價格與營運報表。</div></div>
        </div>
      </div>
    </div>
  `;
}

function renderPets() {
  const pets = state.pets.filter(p => p.ownerId === currentUser.id);
  return `
    ${pageHeader("寵物資料管理", "新增與查看寵物基本資料、疫苗狀態與特殊需求。")}
    <div class="grid cols-2">
      <div class="card">
        <h3>新增寵物</h3>
        <form id="petForm">
          <div class="form-row">
            <div class="field"><label>寵物名稱</label><input name="name" required></div>
            <div class="field"><label>種類</label><select name="type"><option>狗</option><option>貓</option><option>兔子</option><option>其他</option></select></div>
          </div>
          <div class="form-row">
            <div class="field"><label>品種</label><input name="breed" placeholder="例如：柴犬"></div>
            <div class="field"><label>年齡</label><input name="age" type="number" min="0" value="1"></div>
          </div>
          <div class="field"><label>疫苗狀態</label><select name="vaccine"><option>已完成</option><option>未完成</option><option>需補件</option></select></div>
          <div class="field"><label>特殊需求</label><textarea name="need" placeholder="例如：怕生、需餵藥、不能吃雞肉"></textarea></div>
          <button class="btn">新增寵物</button>
        </form>
      </div>
      <div class="card">
        <h3>我的寵物</h3>
        <div class="grid">
          ${pets.length ? pets.map(p => renderPetCard(p)).join("") : `<div class="empty">目前尚未新增寵物資料。</div>`}
        </div>
      </div>
    </div>
  `;
}

function renderPetCard(pet) {
  return `
    <div class="pet-card card" style="box-shadow:none;padding:14px">
      <div class="pet-avatar">${pet.type === "貓" ? "🐱" : pet.type === "狗" ? "🐶" : "🐾"}</div>
      <div>
        <h4>${pet.name}｜${pet.breed || pet.type}</h4>
        <p>年齡：${pet.age} 歲｜疫苗：${pet.vaccine}</p>
        <p>特殊需求：${pet.need || "無"}</p>
      </div>
    </div>
  `;
}

function renderBooking() {
  const pets = state.pets.filter(p => p.ownerId === currentUser.id);
  if (!pets.length) {
    return `
      ${pageHeader("預約住宿 / 美容", "預約前需要先建立至少一筆寵物資料。")}
      <div class="empty">請先到「寵物資料」新增寵物，再進行預約。</div>
    `;
  }

  return `
    ${pageHeader("預約住宿 / 美容", "選擇寵物、服務類型、日期與付款方式，系統會自動計算費用。")}
    <div class="grid cols-2">
      <div class="card">
        <h3>建立預約</h3>
        <form id="bookingForm">
          <div class="field"><label>選擇寵物</label><select name="petId">${pets.map(p => `<option value="${p.id}">${p.name}（${p.type}）</option>`).join("")}</select></div>
          <div class="field"><label>服務類型</label><select name="type" id="bookingType"><option value="住宿">住宿</option><option value="美容">美容</option></select></div>
          <div id="bookingExtra"></div>
          <div class="form-row">
            <div class="field"><label>開始日期</label><input name="startDate" type="date" required></div>
            <div class="field"><label>結束日期</label><input name="endDate" type="date" required></div>
          </div>
          <div class="field"><label>備註</label><textarea name="note" placeholder="例如：餵食習慣、健康狀態、接送注意事項"></textarea></div>
          <div class="price-box">預估費用<strong id="pricePreview">NT$ 0</strong></div>
          <button class="btn">確認付款並建立預約</button>
        </form>
      </div>
      <div class="card soft">
        <h3>預約檢查規則</h3>
        <div class="timeline">
          <div class="timeline-item"><time>疫苗</time><div>寵物疫苗狀態需為「已完成」，否則櫃檯可要求補件。</div></div>
          <div class="timeline-item"><time>住宿</time><div>住宿預約會依房型每日價格與住宿天數計算。</div></div>
          <div class="timeline-item"><time>美容</time><div>美容預約會依服務項目計算固定費用。</div></div>
          <div class="timeline-item"><time>付款</time><div>此原型以模擬付款完成，建立預約後會顯示已付款。</div></div>
        </div>
      </div>
    </div>
  `;
}

function bookingExtraHtml(type = "住宿") {
  if (type === "住宿") {
    return `<div class="field"><label>選擇房間</label><select name="roomId" id="roomId">${state.rooms.map(r => `<option value="${r.id}" ${r.status === "maintenance" ? "disabled" : ""}>${r.name}｜每日 ${money(r.price)}｜${statusText[r.status]}</option>`).join("")}</select></div>`;
  }
  return `<div class="field"><label>美容項目</label><select name="serviceId" id="serviceId">${state.services.map(s => `<option value="${s.id}">${s.name}｜${money(s.price)}｜${s.duration}</option>`).join("")}</select></div>`;
}

function renderOrders() {
  return `
    ${pageHeader("我的預約與付款", "查看目前預約狀態，也可以取消預約並模擬退款。")}
    <div class="card">${renderBookingTable(myBookings(), true)}</div>
  `;
}

function renderHistory() {
  const bookings = myBookings().filter(b => b.bookingStatus === "done" || b.bookingStatus === "cancelled");
  return `
    ${pageHeader("歷史紀錄", "查看已完成或已取消的住宿與美容紀錄。")}
    <div class="card">${renderBookingTable(bookings, false)}</div>
  `;
}

function renderFrontDesk() {
  const bookings = state.bookings.filter(b => b.type === "住宿");
  return `
    ${pageHeader("住宿訂單管理", "櫃檯人員可確認預約、安排房間、處理入住與退房。")}
    <div class="card">${renderBookingTable(bookings, true)}</div>
  `;
}

function renderRooms() {
  return `
    ${pageHeader("房間管理", "管理住宿房間狀態與每日價格。")}
    <div class="grid cols-2">
      <div class="card">
        <h3>新增房間</h3>
        <form id="roomForm">
          <div class="field"><label>房間名稱</label><input name="name" placeholder="例如：D404 豪華犬房" required></div>
          <div class="form-row">
            <div class="field"><label>容量</label><input name="capacity" type="number" min="1" value="1"></div>
            <div class="field"><label>每日價格</label><input name="price" type="number" min="0" value="800"></div>
          </div>
          <button class="btn">新增房間</button>
        </form>
      </div>
      <div class="card">
        <h3>房間清單</h3>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>房間</th><th>容量</th><th>價格</th><th>狀態</th><th>操作</th></tr></thead>
            <tbody>${state.rooms.map(r => `
              <tr>
                <td>${r.name}</td><td>${r.capacity}</td><td>${money(r.price)}</td><td>${statusBadge(r.status)}</td>
                <td class="actions">
                  <button class="btn small secondary" data-room-status="${r.id}" data-status="available">可使用</button>
                  <button class="btn small warning" data-room-status="${r.id}" data-status="maintenance">維護</button>
                </td>
              </tr>`).join("")}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderPetStatus() {
  return `
    ${pageHeader("寵物狀態與注意事項", "查看住宿或美容服務中的寵物資訊、特殊需求與回報。")}
    <div class="grid cols-2">
      ${state.pets.map(p => `
        <div class="card">
          ${renderPetCard(p)}
          <h3 style="margin-top:16px">相關預約</h3>
          ${renderBookingTable(state.bookings.filter(b => b.petId === p.id), false)}
        </div>
      `).join("")}
    </div>
  `;
}

function renderGrooming() {
  const bookings = state.bookings.filter(b => b.type === "美容");
  return `
    ${pageHeader("美容服務管理", "美容師可查看時程、寵物注意事項，並更新服務狀態與回報異常。")}
    <div class="card">${renderBookingTable(bookings, true)}</div>
  `;
}

function renderAdminUsers() {
  return `
    ${pageHeader("帳號管理", "管理系統中的飼主、櫃檯人員、美容師與管理員帳號。")}
    <div class="grid cols-2">
      <div class="card">
        <h3>新增帳號</h3>
        <form id="userForm">
          <div class="field"><label>姓名</label><input name="name" required></div>
          <div class="field"><label>帳號</label><input name="username" required></div>
          <div class="field"><label>密碼</label><input name="password" value="123" required></div>
          <div class="field"><label>角色</label><select name="role">${Object.entries(roleNames).map(([key, val]) => `<option value="${key}">${val}</option>`).join("")}</select></div>
          <button class="btn">新增帳號</button>
        </form>
      </div>
      <div class="card">
        <h3>帳號清單</h3>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>姓名</th><th>帳號</th><th>角色</th></tr></thead>
            <tbody>${state.users.map(u => `<tr><td>${u.name}</td><td>${u.username}</td><td>${roleNames[u.role]}</td></tr>`).join("")}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderAdminServices() {
  return `
    ${pageHeader("服務與價格設定", "管理美容服務名稱、價格與預估時間。")}
    <div class="grid cols-2">
      <div class="card">
        <h3>新增服務</h3>
        <form id="serviceForm">
          <div class="field"><label>服務名稱</label><input name="name" placeholder="例如：深層護毛" required></div>
          <div class="field"><label>價格</label><input name="price" type="number" value="800" min="0"></div>
          <div class="field"><label>時間</label><input name="duration" placeholder="例如：90 分鐘" required></div>
          <button class="btn">新增服務</button>
        </form>
      </div>
      <div class="card">
        <h3>服務清單</h3>
        <div class="table-wrap">
          <table class="table">
            <thead><tr><th>服務</th><th>價格</th><th>時間</th></tr></thead>
            <tbody>${state.services.map(s => `<tr><td>${s.name}</td><td>${money(s.price)}</td><td>${s.duration}</td></tr>`).join("")}</tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderReports() {
  const total = state.bookings.filter(b => b.paymentStatus === "paid").reduce((sum, b) => sum + b.amount, 0);
  const stay = state.bookings.filter(b => b.type === "住宿").length;
  const grooming = state.bookings.filter(b => b.type === "美容").length;
  const cancelled = state.bookings.filter(b => b.bookingStatus === "cancelled").length;
  return `
    ${pageHeader("營運報表", "統計預約量、收入、服務使用狀況，提供管理員決策參考。")}
    <div class="grid cols-3">
      <div class="stat-card"><span>總收入</span><strong>${money(total)}</strong></div>
      <div class="stat-card"><span>住宿預約</span><strong>${stay}</strong></div>
      <div class="stat-card"><span>美容預約</span><strong>${grooming}</strong></div>
      <div class="stat-card"><span>取消預約</span><strong>${cancelled}</strong></div>
      <div class="stat-card"><span>使用者數</span><strong>${state.users.length}</strong></div>
      <div class="stat-card"><span>寵物數</span><strong>${state.pets.length}</strong></div>
    </div>
    <div class="card" style="margin-top:18px">
      <h3>訂單明細</h3>
      ${renderBookingTable(state.bookings, false)}
    </div>
  `;
}

function renderLogs() {
  return `
    ${pageHeader("系統紀錄", "記錄重要操作，例如註冊、預約、付款、取消、入住與退房。")}
    <div class="card">
      <div class="timeline">
        ${state.logs.slice().reverse().map((log, index) => `<div class="timeline-item"><time>#${state.logs.length - index}</time><div>${log}</div></div>`).join("")}
      </div>
    </div>
  `;
}

function renderBookingTable(bookings, showActions) {
  if (!bookings.length) return `<div class="empty">目前沒有資料。</div>`;
  return `
    <div class="table-wrap">
      <table class="table">
        <thead>
          <tr><th>編號</th><th>飼主</th><th>寵物</th><th>類型</th><th>日期</th><th>項目 / 房間</th><th>金額</th><th>狀態</th>${showActions ? "<th>操作</th>" : ""}</tr>
        </thead>
        <tbody>
          ${bookings.map(b => {
            const pet = getPet(b.petId);
            const owner = getOwner(b.ownerId);
            const item = b.type === "住宿" ? getRoom(b.roomId)?.name : getService(b.serviceId)?.name;
            return `
              <tr>
                <td>#${b.id}</td>
                <td>${owner?.name || "未知"}</td>
                <td>${pet?.name || "未知"}</td>
                <td>${b.type}</td>
                <td>${b.startDate} ~ ${b.endDate}</td>
                <td>${item || "未指定"}</td>
                <td>${money(b.amount)}</td>
                <td>${statusBadge(b.bookingStatus)} ${statusBadge(b.paymentStatus)}</td>
                ${showActions ? `<td>${bookingActions(b)}</td>` : ""}
              </tr>
            `;
          }).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function bookingActions(b) {
  const actions = [];
  if (currentUser.role === "owner" && b.bookingStatus !== "cancelled" && b.bookingStatus !== "done") {
    actions.push(`<button class="btn small danger" data-cancel="${b.id}">取消/退款</button>`);
  }
  if (currentUser.role === "receptionist" && b.type === "住宿") {
    if (b.bookingStatus === "pending") actions.push(`<button class="btn small success" data-confirm="${b.id}">確認接單</button>`);
    if (b.bookingStatus === "confirmed") actions.push(`<button class="btn small" data-checkin="${b.id}">Check-in</button>`);
    if (b.bookingStatus === "inhouse") actions.push(`<button class="btn small secondary" data-checkout="${b.id}">Check-out</button>`);
  }
  if (currentUser.role === "groomer" && b.type === "美容") {
    if (b.serviceStatus !== "progress" && b.bookingStatus !== "done") actions.push(`<button class="btn small" data-service-start="${b.id}">開始服務</button>`);
    if (b.serviceStatus === "progress") actions.push(`<button class="btn small success" data-service-done="${b.id}">完成服務</button>`);
    actions.push(`<button class="btn small warning" data-report="${b.id}">回報異常</button>`);
  }
  if (currentUser.role === "admin") {
    actions.push(`<button class="btn small secondary" data-confirm="${b.id}">確認</button>`);
  }
  return `<div class="actions">${actions.join("") || "—"}</div>`;
}

function bindPageEvents() {
  document.querySelectorAll("[data-go]").forEach(btn => {
    btn.addEventListener("click", () => {
      currentPage = btn.dataset.go;
      render();
    });
  });

  const petForm = $("#petForm");
  if (petForm) petForm.addEventListener("submit", e => {
    e.preventDefault();
    const f = new FormData(petForm);
    const pet = {
      id: nextId(state.pets),
      ownerId: currentUser.id,
      name: f.get("name").trim(),
      type: f.get("type"),
      breed: f.get("breed").trim(),
      age: Number(f.get("age")),
      vaccine: f.get("vaccine"),
      need: f.get("need").trim()
    };
    state.pets.push(pet);
    state.logs.push(`${currentUser.name} 新增寵物資料：${pet.name}`);
    saveData();
    render();
  });

  const bookingForm = $("#bookingForm");
  if (bookingForm) {
    const typeSelect = $("#bookingType");
    const extra = $("#bookingExtra");
    const updateExtra = () => {
      extra.innerHTML = bookingExtraHtml(typeSelect.value);
      bindPricePreview();
    };
    typeSelect.addEventListener("change", updateExtra);
    updateExtra();
    bookingForm.addEventListener("submit", e => {
      e.preventDefault();
      const f = new FormData(bookingForm);
      const type = f.get("type");
      const pet = getPet(f.get("petId"));
      const startDate = f.get("startDate");
      const endDate = f.get("endDate") || startDate;
      const roomId = type === "住宿" ? Number(f.get("roomId")) : null;
      const serviceId = type === "美容" ? Number(f.get("serviceId")) : null;
      const amount = calculateBookingPrice(type, startDate, endDate, roomId, serviceId);

      if (pet.vaccine !== "已完成") {
        alert("此寵物疫苗狀態不是已完成，仍可建立預約，但櫃檯可能要求補件。此訊息代表預約檢查功能。");
      }

      const booking = {
        id: nextId(state.bookings) < 1000 ? 1001 : nextId(state.bookings),
        ownerId: currentUser.id,
        petId: pet.id,
        type,
        roomId,
        serviceId,
        startDate,
        endDate,
        amount,
        bookingStatus: "pending",
        paymentStatus: "paid",
        serviceStatus: "pending",
        note: f.get("note").trim(),
        report: "尚未回報。"
      };
      state.bookings.push(booking);
      state.logs.push(`${currentUser.name} 建立${type}預約 #${booking.id}，付款 ${money(amount)}`);
      saveData();
      alert(`預約成功！已模擬付款完成，金額：${money(amount)}`);
      currentPage = "orders";
      render();
    });
  }

  const roomForm = $("#roomForm");
  if (roomForm) roomForm.addEventListener("submit", e => {
    e.preventDefault();
    const f = new FormData(roomForm);
    state.rooms.push({ id: nextId(state.rooms), name: f.get("name"), capacity: Number(f.get("capacity")), price: Number(f.get("price")), status: "available" });
    state.logs.push(`${currentUser.name} 新增房間：${f.get("name")}`);
    saveData();
    render();
  });

  const userForm = $("#userForm");
  if (userForm) userForm.addEventListener("submit", e => {
    e.preventDefault();
    const f = new FormData(userForm);
    const username = f.get("username").trim();
    if (state.users.some(u => u.username === username)) return alert("帳號已存在");
    state.users.push({ id: nextId(state.users), name: f.get("name"), username, password: f.get("password"), role: f.get("role") });
    state.logs.push(`${currentUser.name} 新增使用者帳號：${username}`);
    saveData();
    render();
  });

  const serviceForm = $("#serviceForm");
  if (serviceForm) serviceForm.addEventListener("submit", e => {
    e.preventDefault();
    const f = new FormData(serviceForm);
    state.services.push({ id: nextId(state.services), name: f.get("name"), price: Number(f.get("price")), duration: f.get("duration") });
    state.logs.push(`${currentUser.name} 新增美容服務：${f.get("name")}`);
    saveData();
    render();
  });

  document.querySelectorAll("[data-cancel]").forEach(btn => btn.addEventListener("click", () => updateBooking(btn.dataset.cancel, b => {
    b.bookingStatus = "cancelled";
    b.paymentStatus = "refunded";
    state.logs.push(`${currentUser.name} 取消預約 #${b.id} 並退款`);
  })));

  document.querySelectorAll("[data-confirm]").forEach(btn => btn.addEventListener("click", () => updateBooking(btn.dataset.confirm, b => {
    b.bookingStatus = "confirmed";
    state.logs.push(`${currentUser.name} 確認預約 #${b.id}`);
  })));

  document.querySelectorAll("[data-checkin]").forEach(btn => btn.addEventListener("click", () => updateBooking(btn.dataset.checkin, b => {
    b.bookingStatus = "inhouse";
    const room = getRoom(b.roomId);
    if (room) room.status = "occupied";
    state.logs.push(`${currentUser.name} 辦理 Check-in #${b.id}`);
  })));

  document.querySelectorAll("[data-checkout]").forEach(btn => btn.addEventListener("click", () => updateBooking(btn.dataset.checkout, b => {
    b.bookingStatus = "done";
    const room = getRoom(b.roomId);
    if (room) room.status = "available";
    state.logs.push(`${currentUser.name} 辦理 Check-out #${b.id}`);
  })));

  document.querySelectorAll("[data-service-start]").forEach(btn => btn.addEventListener("click", () => updateBooking(btn.dataset.serviceStart, b => {
    b.bookingStatus = "confirmed";
    b.serviceStatus = "progress";
    state.logs.push(`${currentUser.name} 開始美容服務 #${b.id}`);
  })));

  document.querySelectorAll("[data-service-done]").forEach(btn => btn.addEventListener("click", () => updateBooking(btn.dataset.serviceDone, b => {
    b.bookingStatus = "done";
    b.serviceStatus = "done";
    b.report = "美容服務完成，寵物狀態正常。";
    state.logs.push(`${currentUser.name} 完成美容服務 #${b.id}`);
  })));

  document.querySelectorAll("[data-report]").forEach(btn => btn.addEventListener("click", () => {
    const text = prompt("請輸入服務回報或異常狀況：", "服務中發現寵物較緊張，已安撫並通知飼主。");
    if (!text) return;
    updateBooking(btn.dataset.report, b => {
      b.report = text;
      state.logs.push(`${currentUser.name} 回報美容狀況 #${b.id}：${text}`);
    });
  }));

  document.querySelectorAll("[data-room-status]").forEach(btn => btn.addEventListener("click", () => {
    const room = getRoom(btn.dataset.roomStatus);
    room.status = btn.dataset.status;
    state.logs.push(`${currentUser.name} 更新房間 ${room.name} 狀態為 ${statusText[room.status]}`);
    saveData();
    render();
  }));
}

function updateBooking(id, updater) {
  const booking = state.bookings.find(b => b.id === Number(id));
  if (!booking) return;
  updater(booking);
  saveData();
  render();
}

function bindPricePreview() {
  const form = $("#bookingForm");
  const preview = $("#pricePreview");
  if (!form || !preview) return;
  const update = () => {
    const f = new FormData(form);
    const amount = calculateBookingPrice(f.get("type"), f.get("startDate"), f.get("endDate"), Number(f.get("roomId")), Number(f.get("serviceId")));
    preview.textContent = money(amount);
  };
  form.querySelectorAll("input, select").forEach(el => el.addEventListener("input", update));
  update();
}

function calculateBookingPrice(type, startDate, endDate, roomId, serviceId) {
  if (type === "住宿") {
    const room = getRoom(roomId) || state.rooms.find(r => r.status !== "maintenance") || state.rooms[0];
    return (room?.price || 0) * daysBetween(startDate, endDate || startDate);
  }
  const service = getService(serviceId) || state.services[0];
  return service?.price || 0;
}

render();

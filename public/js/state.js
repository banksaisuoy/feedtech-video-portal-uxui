// ==========================================
// MODULE: STATE & I18N SYSTEM (state.js)
// Global reactive store, multilingual dictionary, and utility helpers
// ==========================================

window.state = {
  currentUser: null,
  currentLanguage: localStorage.getItem('feedtech_portal_lang') || 'en',
  isLoggedIn: localStorage.getItem('feedtech_logged_in') === 'true',
  activeWatchVideo: null,
  previousView: 'home',
  users: [],
  videos: [],
  categories: [],
  tags: [],
  events: [],
  history: [],
  favorites: [],
  auditLogs: [],
  accessMatrix: null,
  activeView: 'home',
  selectedVideo: null,
  editDrawerVideoId: null,
  selectedUploadPersons: new Set(),
  selectedDrawerPersons: new Set(),
  tagPickerSelected: {
    modalTags: new Set(),
    uploadVideoTags: new Set(),
    editDrawerTags: new Set()
  }
};

// ---------------- I18N / MULTILINGUAL SYSTEM ----------------

window.translations = {
  en: {
    home: 'Home',
    history: 'History & Continue',
    favorites: 'Favorites',
    categories: 'Categories Hub',
    adminDashboard: 'Dashboard Overview',
    adminUsers: 'User Management',
    adminDepts: 'Manage Categories',
    adminTags: 'Categories & Tags',
    adminVideos: 'Video Management',
    adminMatrix: 'Access Control Matrix',
    adminLogs: 'System Audit Logs',
    settings: 'Settings & Language',
    viewOnlyBadge: 'View-Only Mode (Non-Admin)',
    adminModeBadge: 'Administrator Privileges Active',
    uploadNoPerm: 'Video Upload: <b>View-Only (Non-Admin)</b>',
    uploadPerm: 'Video Upload: <b>Enabled (Admin)</b>',
    adminHidden: 'Admin Console: <b>Hidden (Admins Only)</b>',
    adminActive: 'Admin Console: <b>Active (Admin Console)</b>',
    accessDenied: 'Access denied: Management console is restricted to administrators',
    regularStaffToast: 'Regular employees have view-only access.',
    publicBadge: '🌐 Public Access',
    includeBadge: '👥 Include Whitelist',
    excludeBadge: '🚫 Exclude Blacklist',
    langSwitched: 'Switched interface language to English'
  },
  th: {
    home: 'หน้าหลัก',
    history: 'ประวัติการรับชม',
    favorites: 'วิดีโอที่บันทึกไว้',
    categories: 'ศูนย์รวมหมวดหมู่ (Categories Hub)',
    adminDashboard: 'แดชบอร์ดภาพรวม',
    adminUsers: 'จัดการผู้ใช้งาน',
    adminTags: 'หมวดหมู่และแท็กย่อย',
    adminVideos: 'จัดการคลังวิดีโอ',
    adminMatrix: 'ตารางสิทธิ์การเข้าถึง',
    adminLogs: 'บันทึกประวัติระบบ',
    settings: 'การตั้งค่าหน้าเว็บ & ภาษา',
    viewOnlyBadge: 'พนักงานทั่วไป (ดูได้อย่างเดียว)',
    adminModeBadge: 'สิทธิ์ผู้ดูแลระบบ (Admin Active)',
    uploadNoPerm: 'สิทธิ์อัปโหลดวิดีโอ: <b>ไม่มีสิทธิ์ (ดูได้อย่างเดียว)</b>',
    uploadPerm: 'สิทธิ์อัปโหลดวิดีโอ: <b>มีสิทธิ์อัปโหลด (Admin)</b>',
    adminHidden: 'เมนูแอดมิน: <b>ซ่อนไว้ (สำหรับแอดมินเท่านั้น)</b>',
    adminActive: 'เมนูแอดมิน: <b>เปิดใช้งาน (Admin Console)</b>',
    accessDenied: '⛔ การเข้าถึงถูกปฏิเสธ: เมนูการจัดการและอัปโหลดสำหรับแอดมินเท่านั้น',
    regularStaffToast: 'พนักงานทั่วไปดูได้อย่างเดียว ไม่มีสิทธิ์เข้าถึงหน้าแอดมิน',
    publicBadge: '🌐 สาธารณะ (Public)',
    includeBadge: '👥 กำหนดเฉพาะบุคคล (Include)',
    excludeBadge: '🚫 ยกเว้นบุคคล (Exclude)',
    langSwitched: 'เปลี่ยนภาษาหน้าเว็บเป็นภาษาไทยเรียบร้อยแล้ว'
  }
};

window.t = function(key) {
  const lang = state.currentLanguage || 'en';
  return translations[lang]?.[key] || translations['en']?.[key] || key;
};

window.setPortalLanguage = function(lang) {
  state.currentLanguage = lang;
  localStorage.setItem('feedtech_portal_lang', lang);

  const prefSelect = document.getElementById('prefLanguageSelect');
  if (prefSelect) prefSelect.value = lang;

  const langBadge = document.getElementById('sidebarLangBadge');
  if (langBadge) langBadge.textContent = lang.toUpperCase();

  const navSettingsText = document.getElementById('navSettingsText');
  if (navSettingsText) navSettingsText.textContent = t('settings');

  const mapNav = {
    'nav-home': 'home',
    'nav-history': 'history',
    'nav-favorites': 'favorites',
    'nav-categories': 'categories',
    'nav-admin-dashboard': 'adminDashboard',
    'nav-admin-users': 'adminUsers',
    'nav-admin-tags': 'adminTags',
    'nav-admin-videos': 'adminVideos',
    'nav-admin-matrix': 'adminMatrix',
    'nav-admin-logs': 'adminLogs'
  };

  Object.entries(mapNav).forEach(([id, tKey]) => {
    const el = document.getElementById(id);
    if (el) {
      const span = el.querySelector('span:last-child');
      if (span) span.textContent = t(tKey);
    }
  });

  if (state.currentUser && typeof window.renderCurrentUserUI === 'function') {
    renderCurrentUserUI();
  }

  showToast(t('langSwitched'), 'success');
};

window.showToast = function(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const toast = document.createElement('div');
  let bgColor = 'bg-slate-800';
  let icon = 'info';

  if (type === 'success') {
    bgColor = 'bg-emerald-700';
    icon = 'check_circle';
  } else if (type === 'error') {
    bgColor = 'bg-rose-700';
    icon = 'error';
  } else if (type === 'warning') {
    bgColor = 'bg-amber-600';
    icon = 'warning';
  }

  toast.className = `${bgColor} text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200 pointer-events-auto`;
  toast.innerHTML = `
    <span class="material-symbols-outlined text-base">${icon}</span>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('opacity-0', 'transition-opacity', 'duration-300');
    setTimeout(() => toast.remove(), 300);
  }, 4000);
};

window.formatDate = function(dateString) {
  if (!dateString) return '-';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

window.formatTimeAgo = function(dateString) {
  if (!dateString) return '';
  const now = new Date();
  const past = new Date(dateString);
  const diffHours = Math.floor((now - past) / (1000 * 60 * 60));
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
};

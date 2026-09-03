// State Store
const state = {
  currentUser: null,
  users: [],
  departments: [],
  categories: [],
  tags: [],
  accessibleVideos: [],
  allVideos: [],
  auditLogs: [],
  activeView: 'home',
  selectedDepartment: null,
  selectedCategory: null,
  activeVideo: null,
  searchQuery: '',
  recommendedFilter: 'all',
  events: [
    {
      id: 1,
      title: 'Feedtech Global Science & Nutrition Summit 2026',
      date: 'Sep 15, 2026 • 09:00 - 16:30 ICT',
      location: 'Grand Ballroom & Virtual Stream (Bangkok)',
      category: 'Scientific Keynote',
      department: 'Biotech',
      speaker: 'Dr. Alice Smith & Regional Research Heads',
      thumbnail: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=800&q=80',
      status: 'Upcoming',
      rsvped: true
    },
    {
      id: 2,
      title: 'Swine Biosecurity & Epidemiological Defense Workshop',
      date: 'Aug 28, 2026 • 13:00 ICT',
      location: 'CP Tower Conference Room 3',
      category: 'Field Workshop',
      department: 'Swine',
      speaker: 'Somchai Prasert (Swine Specialist)',
      thumbnail: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80',
      status: 'Recording Available',
      videoId: 4
    },
    {
      id: 3,
      title: 'Southeast Asia Raw Material & Grain Logistics Townhall',
      date: 'Aug 14, 2026 • 10:00 ICT',
      location: 'Executive Auditorium',
      category: 'Townhall & Executive',
      department: 'Raw Material',
      speaker: 'David Miller (Procurement Director)',
      thumbnail: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80',
      status: 'Recording Available',
      videoId: 7
    }
  ]
};

// Initialization on DOM Load
document.addEventListener('DOMContentLoaded', async () => {
  await loadDepartments();
  await loadCategories();
  await loadTags();
  await loadUsers();
  await loadCurrentUser();
  await loadAccessibleVideos();
  await loadAllVideos();
  navigateView('home');
});

// Toast notification helper
function showToast(message, type = 'success') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  const bgColor = type === 'success' ? 'bg-emerald-600' : (type === 'error' ? 'bg-rose-600' : 'bg-slate-800');
  const icon = type === 'success' ? 'check_circle' : (type === 'error' ? 'error' : 'info');

  toast.className = `${bgColor} text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold animate-in slide-in-from-bottom-3 duration-200 pointer-events-auto`;
  toast.innerHTML = `<span class="material-symbols-outlined text-sm">${icon}</span><span>${message}</span>`;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transition = 'opacity 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ---------------- API LOADERS ----------------

async function loadDepartments() {
  try {
    const res = await fetch('/api/departments');
    const json = await res.json();
    if (json.success) {
      state.departments = json.data;
      renderDepartmentsSidebar();
      populateDepartmentSelects();
      renderCategoriesDirectory();
    }
  } catch (err) {
    console.error('Failed to load departments', err);
  }
}

async function loadUsers() {
  try {
    const res = await fetch('/api/users');
    const json = await res.json();
    if (json.success) {
      state.users = json.data;
      renderPersonaSelector();
      renderUserTable();
    }
  } catch (err) {
    console.error('Failed to load users', err);
  }
}

async function loadCurrentUser() {
  try {
    const res = await fetch('/api/current-user');
    const json = await res.json();
    if (json.success) {
      state.currentUser = json.data;
      renderCurrentUserUI();
    }
  } catch (err) {
    console.error('Failed to load current user', err);
  }
}

async function loadAccessibleVideos() {
  try {
    const res = await fetch('/api/videos');
    const json = await res.json();
    if (json.success) {
      state.accessibleVideos = json.data;
      renderHomeVideos();
      renderBiotechVideos();
      renderRecommendedVideos();
      renderContinueWatching();
      renderFavorites();
      renderWatchHistory();
      if (state.selectedDepartment) {
        renderDepartmentHub(state.selectedDepartment);
      }
      updateVisibleCountBanner(json.meta);
    }
  } catch (err) {
    console.error('Failed to load accessible videos', err);
  }
}

async function loadAllVideos() {
  try {
    const res = await fetch('/api/videos/all');
    const json = await res.json();
    if (json.success) {
      state.allVideos = json.data;
      renderVideoManagementTable();
    }
  } catch (err) {
    console.error('Failed to load all videos', err);
  }
}

async function loadAuditLogs() {
  try {
    const res = await fetch('/api/audit-logs');
    const json = await res.json();
    if (json.success) {
      state.auditLogs = json.data;
      renderAuditLogs();
    }
  } catch (err) {
    console.error('Failed to load audit logs', err);
  }
}

// ---------------- PERSONA SIMULATION ENGINE ----------------

async function switchPersona(userId) {
  try {
    const res = await fetch('/api/current-user/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: parseInt(userId) })
    });
    const json = await res.json();
    if (json.success) {
      state.currentUser = json.data;
      renderCurrentUserUI();
      
      // Reload videos dynamically with strict security filter
      await loadAccessibleVideos();
      await loadAllVideos();
      
      showToast(`Switched active persona to ${json.data.name} (${json.data.permission_level})`, 'info');
      
      // Refresh current active view
      if (state.activeView === 'admin-matrix') {
        loadAccessMatrix();
      }
    }
  } catch (err) {
    showToast('Failed to switch persona', 'error');
  }
}

async function quickSwitchToAdmin() {
  const adminUser = state.users.find(u => u.is_admin === 1 || u.role === 'System Administrator' || u.department === 'Executive');
  if (adminUser) {
    await switchPersona(adminUser.id);
    navigateView('admin-tags');
    showToast('Switched to Admin: Opened Tag & Category Management', 'success');
  }
}

function renderPersonaSelector() {
  const sel = document.getElementById('personaSelector');
  if (!sel) return;
  sel.innerHTML = state.users.map(u => `
    <option value="${u.id}" ${state.currentUser && state.currentUser.id === u.id ? 'selected' : ''}>
      ${u.name} — [Tags: ${u.allowed_tags || '#general'}] (${u.department}) ${u.is_admin ? '🛡️ Admin' : ''}
    </option>
  `).join('');
}

function renderCurrentUserUI() {
  const u = state.currentUser;
  if (!u) return;

  const isAdmin = (u.is_admin === 1 || u.role === 'System Administrator' || u.department === 'Executive');

  // Top control bar
  const badge = document.getElementById('personaLevelBadge');
  const deptText = document.getElementById('personaDeptText');
  const sel = document.getElementById('personaSelector');
  if (sel) sel.value = u.id;

  if (badge) {
    badge.textContent = u.permission_level;
    if (u.permission_level === 'Highly Confidential') {
      badge.className = 'px-2 py-0.5 rounded text-[11px] font-bold bg-rose-500/30 text-rose-300 border border-rose-500/50';
    } else if (u.permission_level === 'Restricted') {
      badge.className = 'px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/30 text-amber-300 border border-amber-500/50';
    } else {
      badge.className = 'px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-500/50';
    }
  }

  if (deptText) {
    deptText.textContent = `Dept: ${u.department} | Tags: ${u.allowed_tags || '#general'} | ${isAdmin ? '🛡️ Admin' : '👤 View-Only'}`;
  }

  // Top navbar profile
  const navName = document.getElementById('navUserName');
  const navRole = document.getElementById('navUserRole');
  const navAvatar = document.getElementById('navAvatar');

  if (navName) navName.textContent = u.name;
  if (navRole) navRole.textContent = `Tags: ${u.allowed_tags || '#general'}`;
  if (navAvatar) {
    const initials = u.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    navAvatar.textContent = initials;
    navAvatar.style.backgroundColor = u.avatar_color || '#10b981';
  }

  // Unified Profile & Settings Modal elements
  const modalAvatar = document.getElementById('modalProfileAvatar');
  const modalName = document.getElementById('modalProfileName');
  const modalEmailDept = document.getElementById('modalProfileEmailDept');
  const modalClearance = document.getElementById('modalProfileClearanceBadge');
  const modalAdminBadge = document.getElementById('modalProfileAdminBadge');
  const modalTagsList = document.getElementById('modalProfileTagsList');
  const profileEmpId = document.getElementById('profileEmpId');
  const profileDept = document.getElementById('profileDept');
  const profileVidCount = document.getElementById('profileVidCount');
  const profileAdminStatus = document.getElementById('profileAdminStatus');
  const profileTagsDetail = document.getElementById('profileAllowedTagsDetail');

  const initials = u.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  if (modalAvatar) {
    modalAvatar.textContent = initials;
    modalAvatar.style.backgroundColor = u.avatar_color || '#10b981';
  }
  if (modalName) modalName.textContent = u.name;
  if (modalEmailDept) modalEmailDept.textContent = `${u.email} • ${u.department} Department`;
  if (modalClearance) {
    modalClearance.textContent = u.permission_level;
    if (u.permission_level === 'Highly Confidential') {
      modalClearance.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/80 text-white border border-white/20';
    } else if (u.permission_level === 'Restricted') {
      modalClearance.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/80 text-white border border-white/20';
    } else {
      modalClearance.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/80 text-white border border-white/20';
    }
  }
  if (modalAdminBadge) {
    if (isAdmin) {
      modalAdminBadge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/80 text-white border border-white/30';
      modalAdminBadge.innerHTML = '🛡️ Administrator (Full Access)';
    } else {
      modalAdminBadge.className = 'px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white border border-white/30';
      modalAdminBadge.innerHTML = '👤 View-Only Member';
    }
  }
  if (profileEmpId) profileEmpId.textContent = u.emp_id || 'EMP-1001';
  if (profileDept) profileDept.textContent = u.department;
  if (profileVidCount) profileVidCount.textContent = `${state.accessibleVideos ? state.accessibleVideos.length : 0} / ${state.allVideos ? state.allVideos.length : 10}`;
  if (profileAdminStatus) profileAdminStatus.textContent = isAdmin ? 'Administrator (Full)' : 'View-Only (Non-Admin)';

  const rawTags = (u.allowed_tags || '#general').split(',').map(t => t.trim()).filter(Boolean);
  if (modalTagsList) {
    modalTagsList.innerHTML = rawTags.map(t => `
      <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${t === '*' ? 'bg-purple-300 text-purple-900 font-bold' : (t.includes('confidential') ? 'bg-rose-300 text-rose-950' : 'bg-white/20 text-white')}">
        ${t}
      </span>
    `).join('');
  }
  if (profileTagsDetail) {
    profileTagsDetail.innerHTML = rawTags.map(t => `
      <button onclick="closeProfileModal(); handleTagSearch('${t}');" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold ${t === '*' ? 'bg-purple-100 text-purple-800 border border-purple-200 hover:bg-purple-200' : (t.includes('confidential') ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100' : 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200')} transition-colors" title="คลิกเพื่อกรองวิดีโอตามแท็กนี้">
        <span>${t}</span>
        <span class="material-symbols-outlined text-xs opacity-60">search</span>
      </button>
    `).join('');
  }

  // Render Allowed Tags Chips in Banner
  const bannerTagsContainer = document.getElementById('bannerUserTagsContainer');
  if (bannerTagsContainer) {
    bannerTagsContainer.innerHTML = rawTags.map(t => `
      <button onclick="handleTagSearch('${t}'); return false;" class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-xs" title="คลิกเพื่อค้นหาวิดีโอตามแท็กนี้">
        <span>${t}</span>
        <span class="material-symbols-outlined text-[10px] opacity-60">search</span>
      </button>
    `).join('');
  }

  // Admin vs General User UI Visibility Enforcement
  const viewToggleBtn = document.getElementById('viewToggleBtn');
  const sidebarAdminSection = document.getElementById('sidebarAdminSection');
  const sidebarUploadCta = document.getElementById('sidebarUploadCta');

  if (isAdmin) {
    if (viewToggleBtn) {
      viewToggleBtn.classList.remove('hidden');
      viewToggleBtn.style.display = 'flex';
    }
    if (sidebarAdminSection) {
      sidebarAdminSection.classList.remove('hidden');
    }
    if (sidebarUploadCta) {
      sidebarUploadCta.classList.remove('hidden');
    }
  } else {
    if (viewToggleBtn) {
      viewToggleBtn.classList.add('hidden');
      viewToggleBtn.style.display = 'none';
    }
    if (sidebarAdminSection) {
      sidebarAdminSection.classList.add('hidden');
    }
    if (sidebarUploadCta) {
      sidebarUploadCta.classList.add('hidden');
    }

    // If currently viewing an admin screen while persona switched to non-admin, redirect to home
    if (state.activeView && state.activeView.startsWith('admin')) {
      navigateView('home');
      showToast('Redirected to User Portal: General users only have video viewing clearance.', 'info');
    }
  }

  // Banner in Home Dashboard
  const bannerGreeting = document.getElementById('bannerUserGreeting');
  const bannerPermBadge = document.getElementById('bannerPermBadge');
  const bannerAdminBadge = document.getElementById('bannerAdminBadge');
  const bannerPermDesc = document.getElementById('bannerPermDesc');
  const bannerUploadStatus = document.getElementById('bannerUploadStatus');
  const bannerAdminMenuStatus = document.getElementById('bannerAdminMenuStatus');

  if (bannerGreeting) bannerGreeting.textContent = `Welcome, ${u.name}`;
  if (bannerPermBadge) {
    bannerPermBadge.textContent = u.permission_level;
    if (u.permission_level === 'Highly Confidential') {
      bannerPermBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200';
    } else if (u.permission_level === 'Restricted') {
      bannerPermBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200';
    } else {
      bannerPermBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200';
    }
  }

  if (bannerAdminBadge) {
    if (isAdmin) {
      bannerAdminBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 flex items-center gap-1';
      bannerAdminBadge.innerHTML = `<span class="material-symbols-outlined text-[12px]">admin_panel_settings</span> Administrator Access (Full Rights)`;
    } else {
      bannerAdminBadge.className = 'text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 flex items-center gap-1';
      bannerAdminBadge.innerHTML = `<span class="material-symbols-outlined text-[12px]">visibility</span> พนักงานทั่วไป (ดูได้อย่างเดียว)`;
    }
  }

  if (bannerUploadStatus) {
    if (isAdmin) {
      bannerUploadStatus.innerHTML = `<span class="material-symbols-outlined text-xs text-emerald-600">check_circle</span> สิทธิ์อัปโหลดวิดีโอ: <b class="text-emerald-700">มีสิทธิ์อัปโหลด (Admin)</b>`;
    } else {
      bannerUploadStatus.innerHTML = `<span class="material-symbols-outlined text-xs text-rose-500">block</span> สิทธิ์อัปโหลดวิดีโอ: <b class="text-rose-700">ไม่มีสิทธิ์ (ดูได้อย่างเดียว)</b>`;
    }
  }

  if (bannerAdminMenuStatus) {
    if (isAdmin) {
      bannerAdminMenuStatus.innerHTML = `<span class="material-symbols-outlined text-xs text-emerald-600">check_circle</span> เมนูแอดมิน: <b class="text-emerald-700">เปิดใช้งาน (Admin Console)</b>`;
    } else {
      bannerAdminMenuStatus.innerHTML = `<span class="material-symbols-outlined text-xs text-rose-500">lock</span> เมนูแอดมิน: <b class="text-rose-700">ซ่อนไว้ (สำหรับแอดมินเท่านั้น)</b>`;
    }
  }

  if (bannerPermDesc) {
    if (isAdmin) {
      bannerPermDesc.innerHTML = `Administrator mode active: <b>Full clearance</b> to inspect and curate all departments, manage users, and upload videos.`;
    } else if (u.permission_level === 'Highly Confidential') {
      bannerPermDesc.innerHTML = `Showing authorized <b>Highly Confidential</b> research for <b>${u.department}</b> & company-wide standard videos. (Upload & Admin Menu: Disabled).`;
    } else if (u.permission_level === 'Restricted') {
      bannerPermDesc.innerHTML = `Showing authorized <b>Restricted</b> assets for <b>${u.department}</b> & company-wide standard videos. (Upload & Admin Menu: Disabled).`;
    } else {
      bannerPermDesc.innerHTML = `Standard Employee Clearance: Showing company-wide knowledge assets. (Restricted R&D is strictly hidden, Upload & Admin Menu: Disabled).`;
    }
  }
}

function updateVisibleCountBanner(meta) {
  if (!meta) return;
  const statEl = document.getElementById('visibleCountStat');
  if (statEl) {
    statEl.textContent = `${meta.visible_count} / ${meta.total_portal_videos}`;
  }
  const feedbackEl = document.getElementById('filterFeedbackText');
  if (feedbackEl) {
    if (meta.hidden_count > 0) {
      feedbackEl.textContent = `(${meta.hidden_count} unauthorized video${meta.hidden_count > 1 ? 's' : ''} securely hidden from view)`;
    } else {
      feedbackEl.textContent = `(All catalog videos accessible)`;
    }
  }
}

// ---------------- SIDEBAR & DEPARTMENTS ----------------

function renderDepartmentsSidebar() {
  const container = document.getElementById('deptListContainer');
  if (!container) return;
  container.innerHTML = state.departments.map(d => `
    <a href="#" onclick="openDepartmentHub('${d.name}'); return false;" class="flex items-center justify-between px-3 py-1.5 rounded text-xs text-gray-600 hover:text-primary hover:bg-slate-50 transition-colors">
      <div class="flex items-center gap-2 truncate">
        <span class="material-symbols-outlined text-sm text-gray-400">${d.icon || 'folder'}</span>
        <span class="truncate">${d.name}</span>
      </div>
      <span class="text-[10px] text-gray-400 font-bold bg-slate-100 px-1.5 py-0.2 rounded">${d.video_count || 0}</span>
    </a>
  `).join('');
}

function populateDepartmentSelects() {
  const selects = ['uploadVideoDept', 'modalDept', 'editDrawerDept', 'userDeptFilter', 'videoDeptFilter', 'reqTargetDept', 'modalTagDept'];
  selects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const isFilter = id.includes('Filter');
    let opts = isFilter ? '<option value="">All Departments</option>' : '';
    opts += state.departments.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
    el.innerHTML = opts;
  });
}

function toggleDeptMenu() {
  const container = document.getElementById('deptListContainer');
  const chevron = document.getElementById('deptChevron');
  if (container.classList.contains('hidden')) {
    container.classList.remove('hidden');
    chevron.style.transform = 'rotate(0deg)';
  } else {
    container.classList.add('hidden');
    chevron.style.transform = 'rotate(-90deg)';
  }
}

function openDepartmentHub(deptName) {
  state.selectedDepartment = deptName;
  navigateView('department');
  renderDepartmentHub(deptName);
}

function renderDepartmentHub(deptName) {
  const dept = state.departments.find(d => d.name === deptName) || { name: deptName, code: 'BU', icon: 'domain', description: 'Business Unit Hub' };
  
  const iconEl = document.getElementById('deptHubIcon');
  const codeEl = document.getElementById('deptHubCode');
  const titleEl = document.getElementById('deptHubTitle');
  const descEl = document.getElementById('deptHubDesc');
  const countEl = document.getElementById('deptHubVideoCount');
  const grid = document.getElementById('deptHubVideoGrid');

  if (iconEl) iconEl.textContent = dept.code || dept.name.substring(0, 3).toUpperCase();
  if (codeEl) codeEl.textContent = `Code: ${dept.code || 'BU'}`;
  if (titleEl) titleEl.textContent = `${dept.name} Department`;
  if (descEl) descEl.textContent = dept.description || `Specialized operations, field research, and protocol knowledge base for ${dept.name}.`;

  const deptVideos = state.accessibleVideos.filter(v => v.department === deptName);
  if (countEl) countEl.textContent = `${deptVideos.length} Authorized Videos`;

  if (grid) {
    if (deptVideos.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-gray-300 p-8">
          <span class="material-symbols-outlined text-4xl text-gray-300 mb-2">lock</span>
          <h4 class="text-sm font-bold text-gray-700">No Videos Visible for ${deptName}</h4>
          <p class="text-xs text-gray-400 mt-1 max-w-md mx-auto">
            Videos in this department are restricted to ${deptName} employees or require higher security clearance.
          </p>
        </div>
      `;
    } else {
      grid.innerHTML = deptVideos.map(v => createVideoCardHtml(v)).join('');
    }
  }
}

// ---------------- PROFILE & SETTINGS MODAL ----------------

function openProfileModal(tab = 'overview') {
  renderCurrentUserUI();
  switchProfileTab(tab);
  const modal = document.getElementById('profileModal');
  if (modal) modal.classList.remove('hidden');
}

function closeProfileModal() {
  const modal = document.getElementById('profileModal');
  if (modal) modal.classList.add('hidden');
}

function switchProfileTab(tabName) {
  const tabs = ['overview', 'preferences', 'help'];
  tabs.forEach(t => {
    const btn = document.getElementById(`tabBtn-${t}`);
    const content = document.getElementById(`tabContent-${t}`);
    if (t === tabName) {
      if (btn) {
        btn.className = 'profile-tab-btn pb-2 px-3 border-b-2 border-white text-white font-bold flex items-center gap-1.5 shrink-0 transition-colors';
      }
      if (content) content.classList.remove('hidden');
    } else {
      if (btn) {
        btn.className = 'profile-tab-btn pb-2 px-3 border-b-2 border-transparent text-emerald-200 hover:text-white flex items-center gap-1.5 shrink-0 transition-colors';
      }
      if (content) content.classList.add('hidden');
    }
  });
}

// ---------------- VIEW ROUTING & TOGGLING ----------------

function navigateView(viewName) {
  const u = state.currentUser;
  const isAdmin = u && (u.is_admin === 1 || u.role === 'System Administrator' || u.department === 'Executive');

  // Intercept profile, settings, and support routes to open unified Profile & Settings modal
  if (viewName === 'settings' || viewName === 'preferences') {
    openProfileModal('preferences');
    return;
  }
  if (viewName === 'support' || viewName === 'help') {
    openProfileModal('help');
    return;
  }
  if (viewName === 'profile') {
    openProfileModal('overview');
    return;
  }

  // Security Gate: Non-admins cannot open admin views
  if (viewName.startsWith('admin') && !isAdmin) {
    showToast('⛔ การเข้าถึงถูกปฏิเสธ: เมนูการจัดการและอัปโหลดสำหรับแอดมินเท่านั้น', 'error');
    navigateView('home');
    return;
  }

  state.activeView = viewName;
  
  // Hide all view panels
  document.querySelectorAll('.view-content').forEach(el => el.classList.add('hidden'));

  // Deselect all sidebar links
  document.querySelectorAll('.sidebar-link').forEach(el => {
    el.className = 'sidebar-link flex items-center gap-3 px-4 py-2.5 rounded-r-full text-sm font-medium text-gray-600 hover:bg-slate-100/80 transition-all border-l-4 border-transparent';
  });

  // Activate target view
  const target = document.getElementById(`view-${viewName}`);
  if (target) {
    target.classList.remove('hidden');
  }

  // Highlight active sidebar item
  const activeNav = document.getElementById(`nav-${viewName}`);
  if (activeNav) {
    activeNav.className = 'sidebar-link flex items-center gap-3 px-4 py-2.5 rounded-r-full text-sm font-bold text-primary bg-primary/10 border-l-4 border-primary shadow-xs transition-all';
  }

  // View specific loaders
  if (viewName === 'admin-users') renderUserTable();
  if (viewName === 'admin-tags') {
    loadTags();
    loadCategories();
  }
  if (viewName === 'admin-depts') renderAdminDeptTable();
  if (viewName === 'admin-videos') renderVideoManagementTable();
  if (viewName === 'admin-events') {
    loadEvents().then(() => renderAdminEventsTable());
  }
  if (viewName === 'admin-upload') renderTagPicker('uploadTagsContainer', 'uploadVideoTags', false);
  if (viewName === 'admin-logs') loadAuditLogs();
  if (viewName === 'admin-matrix') loadAccessMatrix();
  if (viewName === 'home') renderHomeVideos();
  if (viewName === 'recommended') renderRecommendedVideos();
  if (viewName === 'favorites') renderFavorites();
  if (viewName === 'meetings') renderMeetingsView();
  if (viewName === 'history' || viewName === 'continue') {
    renderContinueWatching();
    renderWatchHistory();
  }
  if (viewName === 'events') loadEvents();
  if (viewName === 'categories') renderCategoriesDirectory();
}

function togglePortalAdminMode() {
  const u = state.currentUser;
  const isAdmin = u && (u.is_admin === 1 || u.role === 'System Administrator' || u.department === 'Executive');

  if (!isAdmin) {
    showToast('พนักงานทั่วไปดูได้อย่างเดียว ไม่มีสิทธิ์เข้าถึงหน้าแอดมิน', 'error');
    return;
  }

  if (state.activeView.startsWith('admin')) {
    navigateView('home');
    document.getElementById('viewToggleText').textContent = 'Switch to Admin Console';
  } else {
    navigateView('admin-users');
    document.getElementById('viewToggleText').textContent = 'Switch to User Portal';
  }
}

// ---------------- VIDEO RENDERING & INTERACTIONS ----------------

function getPermissionBadgeMarkup(level) {
  if (level === 'Highly Confidential') {
    return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
      <span class="material-symbols-outlined text-[12px]">lock</span> Highly Confidential
    </span>`;
  } else if (level === 'Restricted') {
    return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
      <span class="material-symbols-outlined text-[12px]">gpp_maybe</span> Restricted
    </span>`;
  } else {
    return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
      <span class="material-symbols-outlined text-[12px]">public</span> Standard
    </span>`;
  }
}

function renderHomeVideos() {
  const container = document.getElementById('homeVideoGrid');
  if (!container) return;

  let filtered = state.accessibleVideos;
  if (state.searchQuery) {
    const q = state.searchQuery.toLowerCase();
    filtered = filtered.filter(v => v.title.toLowerCase().includes(q) || v.tags.toLowerCase().includes(q) || v.department.toLowerCase().includes(q));
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-gray-300 p-8">
        <span class="material-symbols-outlined text-4xl text-gray-300 mb-2">visibility_off</span>
        <h4 class="text-sm font-bold text-gray-700">No Authorized Videos Available</h4>
        <p class="text-xs text-gray-400 mt-1 max-w-md mx-auto">
          Videos in this section are either restricted to other departments or require higher security clearance.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(v => createVideoCardHtml(v)).join('');
}

function renderBiotechVideos() {
  const container = document.getElementById('biotechVideoGrid');
  if (!container) return;

  const biotechList = state.accessibleVideos.filter(v => v.department === 'Biotech');
  if (biotechList.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-6 text-center text-xs text-gray-400">
        No Biotech research assets visible under current clearance.
      </div>
    `;
    return;
  }

  container.innerHTML = biotechList.map(v => createVideoCardHtml(v)).join('');
}

function renderRecommendedVideos() {
  const container = document.getElementById('recommendedVideoGrid');
  if (!container) return;

  let list = state.accessibleVideos;
  if (state.recommendedFilter === 'biotech') list = list.filter(v => v.department === 'Biotech');
  if (state.recommendedFilter === 'safety') list = list.filter(v => v.tags.includes('safety') || v.tags.includes('protocols'));
  if (state.recommendedFilter === 'automation') list = list.filter(v => v.tags.includes('automation') || v.tags.includes('silo'));
  if (state.recommendedFilter === 'supply') list = list.filter(v => v.department === 'Raw Material');

  if (list.length === 0) {
    container.innerHTML = `<div class="col-span-full py-8 text-center text-xs text-gray-400">No recommended items under this filter.</div>`;
    return;
  }

  container.innerHTML = list.map(v => createVideoCardHtml(v)).join('');
}

function filterRecommendedCategory(cat) {
  state.recommendedFilter = cat;
  renderRecommendedVideos();
}

function renderContinueWatching() {
  const container = document.getElementById('continueWatchingGrid');
  if (!container) return;

  const inProgress = state.accessibleVideos.slice(0, 3);
  if (inProgress.length === 0) {
    container.innerHTML = `<div class="col-span-full py-8 text-center text-xs text-gray-400">No videos in progress.</div>`;
    return;
  }

  container.innerHTML = inProgress.map((v, idx) => {
    const mockProgress = [75, 45, 20][idx % 3];
    return `
      <div class="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col group cursor-pointer" onclick="openVideoPlayerModal(${v.id})">
        <div class="relative aspect-video bg-slate-900 overflow-hidden">
          <img src="${v.thumbnail_url}" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
          <div class="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button class="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
              <span class="material-symbols-outlined fill text-2xl">play_arrow</span>
            </button>
          </div>
          <span class="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">${v.duration}</span>
          <div class="absolute bottom-0 left-0 right-0 h-1.5 bg-black/50">
            <div class="h-full bg-primary-container" style="width: ${mockProgress}%"></div>
          </div>
        </div>
        <div class="p-4 space-y-2 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">${v.department}</span>
              <span class="text-[11px] text-gray-400 font-semibold">${mockProgress}% completed</span>
            </div>
            <h4 class="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">${v.title}</h4>
          </div>
          <div class="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-slate-100">
            <span>Uploaded by ${v.uploaded_by}</span>
            <button class="text-primary font-bold hover:underline flex items-center gap-0.5">Resume <span class="material-symbols-outlined text-xs">arrow_forward</span></button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderFavorites() {
  const container = document.getElementById('favoritesVideoGrid');
  const countBadge = document.getElementById('favCountBadge');
  if (!container) return;

  const favList = state.accessibleVideos.filter(v => v.is_favorite);
  if (countBadge) countBadge.textContent = `${favList.length} Items`;

  if (favList.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-gray-300 p-8">
        <span class="material-symbols-outlined text-4xl text-rose-300 mb-2">favorite_border</span>
        <h4 class="text-sm font-bold text-gray-700">No Favorites Saved Yet</h4>
        <p class="text-xs text-gray-400 mt-1 max-w-md mx-auto">
          Click the heart icon on any authorized video card to save it here for quick access.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = favList.map(v => createVideoCardHtml(v)).join('');
}

function renderWatchHistory() {
  const container = document.getElementById('watchHistoryContainer');
  if (!container) return;

  const historyList = state.accessibleVideos.slice(0, 5);
  if (historyList.length === 0) {
    container.innerHTML = `<div class="p-8 text-center text-xs text-gray-400">No watch history recorded.</div>`;
    return;
  }

  container.innerHTML = historyList.map((v, idx) => {
    const dates = ['Today at 10:45 AM', 'Yesterday at 15:20 PM', 'Aug 29, 2026', 'Aug 24, 2026', 'Aug 19, 2026'];
    return `
      <div class="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer group" onclick="openVideoPlayerModal(${v.id})">
        <div class="flex items-center gap-3">
          <div class="w-20 h-12 rounded bg-slate-900 overflow-hidden relative shrink-0">
            <img src="${v.thumbnail_url}" class="w-full h-full object-cover">
            <span class="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[8px] font-bold px-1 rounded">${v.duration}</span>
          </div>
          <div>
            <div class="flex items-center gap-2 mb-0.5">
              <span class="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded">${v.department}</span>
              ${getPermissionBadgeMarkup(v.permission_level)}
            </div>
            <h4 class="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">${v.title}</h4>
            <div class="text-[10px] text-gray-400">Watched on ${dates[idx % dates.length]}</div>
          </div>
        </div>
        <button class="px-3 py-1.5 border border-outline-variant rounded-lg text-xs font-semibold text-gray-600 group-hover:border-primary group-hover:text-primary transition-colors flex items-center gap-1">
          <span class="material-symbols-outlined text-sm">replay</span> Replay
        </button>
      </div>
    `;
  }).join('');
}

function clearWatchHistoryDemo() {
  showToast('Watch history cleared for current simulation persona', 'info');
}

function renderEvents() {
  const container = document.getElementById('eventsGrid');
  if (!container) return;

  container.innerHTML = state.events.map(e => `
    <div class="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col justify-between">
      <div class="aspect-video bg-slate-900 relative overflow-hidden">
        <img src="${e.thumbnail}" class="w-full h-full object-cover">
        <span class="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/70 text-white backdrop-blur">${e.category}</span>
        <span class="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold ${e.status === 'Upcoming' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}">${e.status}</span>
      </div>
      <div class="p-5 space-y-3 flex-1 flex flex-col justify-between">
        <div>
          <div class="text-[11px] font-semibold text-emerald-700 mb-1">${e.department} Special Event</div>
          <h3 class="text-sm font-bold text-gray-900 leading-snug">${e.title}</h3>
          <div class="space-y-1 mt-3 text-xs text-gray-500">
            <div class="flex items-center gap-1.5"><span class="material-symbols-outlined text-sm">calendar_today</span> ${e.date}</div>
            <div class="flex items-center gap-1.5"><span class="material-symbols-outlined text-sm">location_on</span> ${e.location}</div>
            <div class="flex items-center gap-1.5"><span class="material-symbols-outlined text-sm">person</span> ${e.speaker}</div>
          </div>
        </div>
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
          ${e.status === 'Upcoming' ? `
            <button onclick="showToast('RSVP Confirmed for ${e.title}', 'success')" class="w-full py-2 bg-primary text-white font-bold text-xs rounded-lg hover:bg-emerald-800 transition-colors">
              RSVP for Live Stream
            </button>
          ` : `
            <button onclick="openVideoPlayerModal(${e.videoId || 1})" class="w-full py-2 bg-slate-100 hover:bg-slate-200 text-gray-800 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-sm">play_circle</span> Watch Recording
            </button>
          `}
        </div>
      </div>
    </div>
  `).join('');
}

function renderCategoriesDirectory() {
  const container = document.getElementById('categoriesGrid');
  if (!container) return;

  const cats = [
    { title: 'Research & Whitepapers', icon: 'menu_book', color: 'bg-emerald-50 text-emerald-700', count: '4 Assets', desc: 'Cellular growth formulas, genetics, and peer-reviewed feed essays.' },
    { title: 'Field Trials & Crop Reports', icon: 'analytics', color: 'bg-blue-50 text-blue-700', count: '3 Assets', desc: 'Drone surveys, multispectral yield metrics, and regional tests.' },
    { title: 'Training & Safety Protocols', icon: 'school', color: 'bg-amber-50 text-amber-700', count: '2 Assets', desc: 'Spectrometry calibration, biohazard control, and OSHA lab safety.' },
    { title: 'Townhall & Executive Briefs', icon: 'campaign', color: 'bg-purple-50 text-purple-700', count: '2 Assets', desc: 'Corporate direction, regional market expansion, and grain futures.' },
    { title: 'Mill & SCADA Operations', icon: 'precision_manufacturing', color: 'bg-rose-50 text-rose-700', count: '3 Assets', desc: 'Automated silo controls, conveyor lines, and smart batching.' },
    { title: 'Vendor Standards & Audits', icon: 'handshake', color: 'bg-teal-50 text-teal-700', count: '1 Asset', desc: 'Supplier quality certifications and raw ingredient assay criteria.' }
  ];

  container.innerHTML = cats.map(c => `
    <div class="bg-white rounded-xl border border-outline-variant p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group" onclick="openCategoryDetail('${c.title}')">
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div class="w-10 h-10 rounded-xl ${c.color} flex items-center justify-center font-bold">
            <span class="material-symbols-outlined text-xl">${c.icon}</span>
          </div>
          <span class="text-xs font-bold text-gray-400">${c.count}</span>
        </div>
        <div>
          <h3 class="font-bold text-sm text-gray-900 group-hover:text-primary transition-colors">${c.title}</h3>
          <p class="text-xs text-gray-500 mt-1 leading-relaxed">${c.desc}</p>
        </div>
      </div>
      <div class="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-primary font-bold">
        <span>Browse Category</span>
        <span class="material-symbols-outlined text-sm">arrow_forward</span>
      </div>
    </div>
  `).join('');
}

function submitClearanceRequest() {
  const level = document.getElementById('reqTargetLevel')?.value;
  const dept = document.getElementById('reqTargetDept')?.value;
  const reason = document.getElementById('reqReason')?.value.trim();

  if (!reason) {
    showToast('กรุณาระบุเหตุผลและความจำเป็นทางธุรกิจ', 'error');
    return;
  }

  showToast(`ส่งคำร้องขอสิทธิ์ [${level} - แผนก ${dept}] ไปยัง IT Admin เรียบร้อยแล้ว`, 'success');
  document.getElementById('reqReason').value = '';
}

function createVideoCardHtml(v) {
  const favIcon = v.is_favorite ? 'favorite' : 'favorite_border';
  const favClass = v.is_favorite ? 'text-rose-500 fill' : 'text-white hover:text-rose-400';
  const progressPercent = v.watch_progress || 0;

  return `
    <div class="group bg-white rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col cursor-pointer" onclick="openVideoPlayerModal(${v.id})">
      <!-- Thumbnail with Overlay -->
      <div class="relative aspect-video w-full bg-slate-900 overflow-hidden">
        <img src="${v.thumbnail_url || 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=600'}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
        
        <!-- Duration Badge -->
        <span class="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
          ${v.duration}
        </span>

        <!-- Favorite Button -->
        <button onclick="event.stopPropagation(); toggleFavorite(${v.id})" class="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-black/70 rounded-full transition-colors ${favClass}">
          <span class="material-symbols-outlined text-base">${favIcon}</span>
        </button>

        <!-- Watch Progress Bar -->
        ${progressPercent > 0 ? `
          <div class="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
            <div class="h-full bg-primary-container" style="width: ${progressPercent}%"></div>
          </div>
        ` : ''}
      </div>

      <!-- Card Body -->
      <div class="p-4 flex-1 flex flex-col justify-between space-y-2.5">
        <div>
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <span class="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">${v.department}</span>
            ${getPermissionBadgeMarkup(v.permission_level)}
          </div>
          <h4 class="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            ${v.title}
          </h4>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-gray-400">
          <span class="flex items-center gap-1">
            <span class="material-symbols-outlined text-xs">visibility</span> ${v.views} views
          </span>
          <span class="truncate max-w-[120px]">${v.uploaded_by || 'Staff'}</span>
        </div>
      </div>
    </div>
  `;
}

// ---------------- VIDEO PLAYER MODAL ----------------

async function openVideoPlayerModal(videoId) {
  try {
    const res = await fetch(`/api/videos/${videoId}`);
    const json = await res.json();
    if (!json.success) {
      showToast('Cannot load video: ' + json.message, 'error');
      return;
    }

    const v = json.data;
    state.activeVideo = v;

    // Track view in backend
    fetch(`/api/videos/${v.id}/watch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress: 65 })
    });

    document.getElementById('playerTitle').textContent = v.title;
    document.getElementById('playerDesc').textContent = v.description || 'No detailed description available.';
    document.getElementById('playerVidCode').textContent = v.video_id;
    document.getElementById('playerDeptBadge').textContent = v.department;
    document.getElementById('playerLevelBadge').outerHTML = getPermissionBadgeMarkup(v.permission_level);

    // Tags
    const tagsContainer = document.getElementById('playerTagsContainer');
    if (tagsContainer && v.tags) {
      const tagList = v.tags.split(',').map(t => t.trim());
      tagsContainer.innerHTML = tagList.map(t => `<span class="text-[10px] font-medium bg-slate-100 text-gray-600 px-2 py-0.5 rounded">${t}</span>`).join('');
    }

    // Video Source
    const player = document.getElementById('activeVideoPlayer');
    player.src = v.video_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    player.load();
    player.play().catch(() => {});

    // Favorite button state
    const favBtn = document.getElementById('playerFavBtn');
    if (favBtn) {
      favBtn.innerHTML = v.is_favorite 
        ? `<span class="material-symbols-outlined text-sm text-rose-500 fill">favorite</span><span class="text-rose-600 font-bold">Favorited</span>`
        : `<span class="material-symbols-outlined text-sm">favorite_border</span><span>Favorite</span>`;
    }

    // Comments
    renderComments(json.comments || []);

    document.getElementById('videoPlayerModal').classList.remove('hidden');
  } catch (err) {
    showToast('Failed to open video player', 'error');
  }
}

function closeVideoPlayerModal() {
  const modal = document.getElementById('videoPlayerModal');
  const player = document.getElementById('activeVideoPlayer');
  if (player) {
    player.pause();
    player.src = '';
  }
  if (modal) modal.classList.add('hidden');
}

async function togglePlayerFavorite() {
  if (!state.activeVideo) return;
  await toggleFavorite(state.activeVideo.id);
  state.activeVideo.is_favorite = !state.activeVideo.is_favorite;
  const favBtn = document.getElementById('playerFavBtn');
  if (favBtn) {
    favBtn.innerHTML = state.activeVideo.is_favorite 
      ? `<span class="material-symbols-outlined text-sm text-rose-500 fill">favorite</span><span class="text-rose-600 font-bold">Favorited</span>`
      : `<span class="material-symbols-outlined text-sm">favorite_border</span><span>Favorite</span>`;
  }
}

function renderComments(comments) {
  const container = document.getElementById('commentsList');
  if (!container) return;
  if (comments.length === 0) {
    container.innerHTML = `<p class="text-[11px] text-gray-400 italic">No comments posted yet. Start the discussion!</p>`;
    return;
  }
  container.innerHTML = comments.map(c => `
    <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
      <div class="flex items-center justify-between mb-1">
        <span class="font-bold text-gray-800">${c.user_name} <span class="text-[10px] font-normal text-gray-400">(${c.user_role})</span></span>
        <span class="text-[10px] text-gray-400">${c.created_at || 'Recently'}</span>
      </div>
      <p class="text-gray-600 leading-snug">${c.comment}</p>
    </div>
  `).join('');
}

async function submitComment() {
  const input = document.getElementById('newCommentInput');
  const comment = input.value.trim();
  if (!comment || !state.activeVideo) return;

  try {
    const res = await fetch(`/api/videos/${state.activeVideo.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment })
    });
    const json = await res.json();
    if (json.success) {
      input.value = '';
      showToast('Comment posted', 'success');
      // Re-fetch video details to refresh comment thread
      openVideoPlayerModal(state.activeVideo.id);
    }
  } catch (err) {
    showToast('Failed to post comment', 'error');
  }
}

async function toggleFavorite(videoId) {
  try {
    const res = await fetch(`/api/videos/${videoId}/favorite`, { method: 'POST' });
    const json = await res.json();
    if (json.success) {
      await loadAccessibleVideos();
      showToast(json.is_favorite ? 'Added to favorites' : 'Removed from favorites', 'info');
    }
  } catch (err) {
    showToast('Failed to update favorite', 'error');
  }
}

// ---------------- USER MANAGEMENT ----------------

function renderUserTable() {
  const tbody = document.getElementById('userTableBody');
  if (!tbody) return;

  const q = (document.getElementById('userTableSearchInput')?.value || '').toLowerCase();
  const dept = document.getElementById('userDeptFilter')?.value || '';
  const level = document.getElementById('userLevelFilter')?.value || '';

  let list = state.users;
  if (q) {
    list = list.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || (u.emp_id && u.emp_id.toLowerCase().includes(q)));
  }
  if (dept) {
    list = list.filter(u => u.department === dept);
  }
  if (level) {
    list = list.filter(u => u.permission_level === level);
  }

  tbody.innerHTML = list.map(u => {
    const initials = u.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
    const isInactive = u.status === 'Inactive';
    const statusColor = isInactive ? 'bg-rose-500' : 'bg-emerald-500';

    return `
      <tr class="hover:bg-slate-50/80 transition-colors ${isInactive ? 'opacity-60 bg-slate-100/50' : ''}">
        <td class="py-3.5 px-5 font-mono font-medium text-gray-500 text-[11px]">${u.emp_id || 'EMP-0000'}</td>
        <td class="py-3.5 px-5">
          <div class="flex items-center gap-2.5">
            <div class="w-7 h-7 rounded-full text-white font-bold flex items-center justify-center text-[10px]" style="background-color: ${u.avatar_color || '#10b981'}">
              ${initials}
            </div>
            <div>
              <div class="font-bold text-gray-900 leading-tight">${u.name}</div>
              <div class="text-[10px] text-gray-400 font-mono">${u.email}</div>
            </div>
          </div>
        </td>
        <td class="py-3.5 px-5 font-semibold text-gray-700">${u.department}</td>
        <td class="py-3.5 px-5">
          <div class="flex flex-wrap gap-1 max-w-[240px]">
            ${(u.allowed_tags || '#general').split(',').map(t => {
              const tag = t.trim();
              const isAll = (tag === '*');
              const isConf = tag.includes('confidential');
              return `
                <span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${isAll ? 'bg-purple-100 text-purple-800 font-bold border border-purple-200' : (isConf ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-700 border border-slate-200')}">
                  ${tag}
                </span>
              `;
            }).join('')}
          </div>
        </td>
        <td class="py-3.5 px-5">${getPermissionBadgeMarkup(u.permission_level)}</td>
        <td class="py-3.5 px-5">
          <span class="inline-flex items-center gap-1.5 font-semibold text-[11px] ${isInactive ? 'text-rose-600' : 'text-emerald-700'}">
            <span class="w-2 h-2 rounded-full ${statusColor}"></span>
            <span>${u.status}</span>
          </span>
        </td>
        <td class="py-3.5 px-5 text-right space-x-1">
          <button onclick="editUserPrompt(${u.id})" class="p-1 text-gray-400 hover:text-primary rounded hover:bg-slate-100" title="Edit User & Tags">
            <span class="material-symbols-outlined text-base">edit</span>
          </button>
          <button onclick="toggleUserStatus(${u.id})" class="p-1 text-gray-400 hover:text-amber-600 rounded hover:bg-slate-100" title="${isInactive ? 'Activate' : 'Deactivate'}">
            <span class="material-symbols-outlined text-base">${isInactive ? 'check_circle' : 'block'}</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function filterUserTable() {
  renderUserTable();
}

// ---------------- REUSABLE SELECTABLE TAG PICKER ----------------

function renderTagPicker(containerId, hiddenInputId, isUserModal = false) {
  const container = document.getElementById(containerId);
  const hiddenInput = document.getElementById(hiddenInputId);
  if (!container || !hiddenInput) return;

  const rawVal = hiddenInput.value || '';
  const currentTags = rawVal.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
  const isAllSelected = currentTags.includes('*');

  // Build list of tags to display
  let allTags = [...state.tags];
  if (allTags.length === 0) {
    allTags = [
      { name: '#biotech', clearance_level: 'Highly Confidential' },
      { name: '#cellular', clearance_level: 'Highly Confidential' },
      { name: '#genetics', clearance_level: 'Highly Confidential' },
      { name: '#swine', clearance_level: 'Restricted' },
      { name: '#nutrition', clearance_level: 'Restricted' },
      { name: '#poultry', clearance_level: 'Standard' },
      { name: '#biosecurity', clearance_level: 'Restricted' },
      { name: '#scada', clearance_level: 'Restricted' },
      { name: '#safety', clearance_level: 'Standard' },
      { name: '#rawmaterial', clearance_level: 'Standard' },
      { name: '#qclab', clearance_level: 'Restricted' },
      { name: '#confidential', clearance_level: 'Highly Confidential' },
      { name: '#general', clearance_level: 'Standard' },
      { name: '#standard', clearance_level: 'Standard' }
    ];
  }

  // If hidden input has custom tags not in state.tags, include them
  currentTags.forEach(ct => {
    if (ct !== '*' && !allTags.some(t => t.name.toLowerCase() === ct)) {
      allTags.push({ name: ct.startsWith('#') ? ct : `#${ct}`, clearance_level: 'Standard' });
    }
  });

  let html = '';

  // For User modal: Add special * (All Tags) pill first
  if (isUserModal) {
    if (isAllSelected) {
      html += `
        <button type="button" onclick="toggleTagInPicker('*', '${hiddenInputId}', '${containerId}', true)" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-purple-600 text-white shadow-sm border border-purple-700">
          <span class="material-symbols-outlined text-xs">check_circle</span>
          <span>* (All Access - สิทธิ์ดูได้ทุกแท็ก)</span>
        </button>
      `;
    } else {
      html += `
        <button type="button" onclick="toggleTagInPicker('*', '${hiddenInputId}', '${containerId}', true)" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200">
          <span class="material-symbols-outlined text-xs">add</span>
          <span>* (All Access)</span>
        </button>
      `;
    }
  }

  // Render all other tags
  allTags.forEach(t => {
    const cleanTag = t.name.toLowerCase();
    const isSelected = isAllSelected || currentTags.includes(cleanTag);
    const isConf = t.clearance_level === 'Highly Confidential';
    const isRest = t.clearance_level === 'Restricted';

    if (isSelected) {
      // Selected State Styling
      let activeBg = isConf ? 'bg-rose-600 text-white border-rose-700' : (isRest ? 'bg-amber-600 text-white border-amber-700' : 'bg-emerald-600 text-white border-emerald-700');
      if (isAllSelected && !isUserModal) activeBg = 'bg-primary text-white border-primary';

      html += `
        <button type="button" onclick="toggleTagInPicker('${t.name}', '${hiddenInputId}', '${containerId}', ${isUserModal})" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${activeBg} shadow-xs border transition-all">
          <span class="material-symbols-outlined text-xs">check</span>
          <span>${t.name}</span>
        </button>
      `;
    } else {
      // Unselected State Styling
      let inactiveBorder = isConf ? 'text-rose-700 border-rose-200 hover:bg-rose-50' : (isRest ? 'text-amber-800 border-amber-200 hover:bg-amber-50' : 'text-slate-700 border-slate-200 hover:bg-slate-100');

      html += `
        <button type="button" onclick="toggleTagInPicker('${t.name}', '${hiddenInputId}', '${containerId}', ${isUserModal})" class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-mono font-medium bg-white border ${inactiveBorder} transition-all">
          <span class="material-symbols-outlined text-xs text-gray-400">add</span>
          <span>${t.name}</span>
        </button>
      `;
    }
  });

  container.innerHTML = html;
}

function toggleTagInPicker(tag, hiddenInputId, containerId, isUserModal = false) {
  const hiddenInput = document.getElementById(hiddenInputId);
  if (!hiddenInput) return;

  const cleanTag = tag.trim().toLowerCase();
  let currentTags = (hiddenInput.value || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean);

  if (cleanTag === '*') {
    if (currentTags.includes('*')) {
      currentTags = currentTags.filter(t => t !== '*');
      if (currentTags.length === 0) currentTags = ['#general'];
    } else {
      currentTags = ['*'];
    }
  } else {
    // If was '*', clear it and start with specific tag
    if (currentTags.includes('*')) {
      currentTags = [cleanTag];
    } else if (currentTags.includes(cleanTag)) {
      currentTags = currentTags.filter(t => t !== cleanTag);
    } else {
      currentTags.push(cleanTag);
    }
  }

  hiddenInput.value = currentTags.join(', ');
  renderTagPicker(containerId, hiddenInputId, isUserModal);
}

function selectAllTagsInPicker(hiddenInputId, containerId, isUserModal = false) {
  const hiddenInput = document.getElementById(hiddenInputId);
  if (!hiddenInput) return;

  if (isUserModal) {
    hiddenInput.value = '*';
  } else {
    hiddenInput.value = state.tags.map(t => t.name).join(', ');
  }
  renderTagPicker(containerId, hiddenInputId, isUserModal);
}

function clearTagsInPicker(hiddenInputId, containerId, isUserModal = false) {
  const hiddenInput = document.getElementById(hiddenInputId);
  if (!hiddenInput) return;
  hiddenInput.value = '';
  renderTagPicker(containerId, hiddenInputId, isUserModal);
}

function addCustomTagToPicker(customInputId, hiddenInputId, containerId, isUserModal = false) {
  const customInput = document.getElementById(customInputId);
  const hiddenInput = document.getElementById(hiddenInputId);
  if (!customInput || !hiddenInput) return;

  let val = customInput.value.trim().toLowerCase();
  if (!val) return;
  if (!val.startsWith('#')) val = `#${val}`;

  let currentTags = (hiddenInput.value || '').split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
  if (currentTags.includes('*')) currentTags = [];
  if (!currentTags.includes(val)) {
    currentTags.push(val);
  }

  hiddenInput.value = currentTags.join(', ');
  customInput.value = '';
  renderTagPicker(containerId, hiddenInputId, isUserModal);
}

function openAddUserModal() {
  document.getElementById('modalUserId').value = '';
  document.getElementById('userModalTitle').textContent = 'Add New Corporate User';
  document.getElementById('modalEmpId').value = '';
  document.getElementById('modalName').value = '';
  document.getElementById('modalEmail').value = '';
  document.getElementById('modalRole').value = 'Staff Member';
  document.getElementById('modalTags').value = '#general, #standard';
  document.getElementById('modalDept').value = state.departments[0]?.name || 'Biotech';
  document.getElementById('modalLevel').value = 'Standard';
  renderTagPicker('userModalTagsContainer', 'modalTags', true);
  document.getElementById('userModal').classList.remove('hidden');
}

function editUserPrompt(userId) {
  const u = state.users.find(x => x.id === userId);
  if (!u) return;
  document.getElementById('modalUserId').value = u.id;
  document.getElementById('userModalTitle').textContent = `Edit User: ${u.name}`;
  document.getElementById('modalEmpId').value = u.emp_id || '';
  document.getElementById('modalName').value = u.name;
  document.getElementById('modalEmail').value = u.email;
  document.getElementById('modalRole').value = u.role || 'Staff Member';
  document.getElementById('modalTags').value = u.allowed_tags || '#general';
  document.getElementById('modalDept').value = u.department;
  document.getElementById('modalLevel').value = u.permission_level;
  renderTagPicker('userModalTagsContainer', 'modalTags', true);
  document.getElementById('userModal').classList.remove('hidden');
}

function closeUserModal() {
  document.getElementById('userModal').classList.add('hidden');
}

function handleTagSearch(tag) {
  const clean = tag.replace(/^#/, '');
  const searchInput = document.getElementById('globalSearchInput');
  if (searchInput) searchInput.value = clean;
  handleGlobalSearch(clean);
  showToast(`Filtering videos with authorized tag: ${tag}`, 'info');
}

async function saveUserModalSubmit() {
  const id = document.getElementById('modalUserId').value;
  const name = document.getElementById('modalName').value.trim();
  const email = document.getElementById('modalEmail').value.trim();
  const department = document.getElementById('modalDept').value;
  const role = document.getElementById('modalRole').value.trim();
  const allowed_tags = document.getElementById('modalTags').value.trim();
  const permission_level = document.getElementById('modalLevel').value;
  const emp_id = document.getElementById('modalEmpId').value.trim();

  if (!name || !email || !allowed_tags) {
    showToast('Please specify Name, Email, and Allowed Tags', 'error');
    return;
  }

  try {
    let res;
    if (id) {
      res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, department, role, allowed_tags, permission_level })
      });
    } else {
      res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emp_id, name, email, department, role, allowed_tags, permission_level })
      });
    }

    const json = await res.json();
    if (json.success) {
      closeUserModal();
      await loadUsers();
      await loadAccessibleVideos();
      showToast(id ? 'User & Allowed Tags updated' : 'User created with Allowed Tags', 'success');
    } else {
      showToast('Error: ' + json.message, 'error');
    }
  } catch (err) {
    showToast('Failed to save user', 'error');
  }
}

function exportUsersCSV() {
  const headers = ['Employee ID', 'Name', 'Email', 'Department', 'Allowed Tags', 'Clearance Level', 'Status'];
  const rows = state.users.map(u => [
    `"${u.emp_id || ''}"`,
    `"${u.name || ''}"`,
    `"${u.email || ''}"`,
    `"${u.department || ''}"`,
    `"${u.allowed_tags || ''}"`,
    `"${u.permission_level || ''}"`,
    `"${u.status || ''}"`
  ]);
  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `feedtech_users_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Users exported to CSV successfully', 'success');
}

function openImportExcelModal() {
  showToast('Import Excel / CSV: Ready for bulk employee data ingestion', 'info');
}

async function toggleUserStatus(userId) {
  try {
    const res = await fetch(`/api/users/${userId}/toggle-status`, { method: 'PATCH' });
    const json = await res.json();
    if (json.success) {
      await loadUsers();
      await loadAccessibleVideos();
      showToast(json.message, 'info');
    }
  } catch (err) {
    showToast('Failed to toggle status', 'error');
  }
}

function exportUsersCSV() {
  let csv = 'Employee ID,Full Name,Email,Department,Role,Permission Level,Status\n';
  state.users.forEach(u => {
    csv += `"${u.emp_id || ''}","${u.name}","${u.email}","${u.department}","${u.role}","${u.permission_level}","${u.status}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Feedtech_Users_Export_${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
  showToast('Exported users to CSV file', 'success');
}

function openImportExcelModal() {
  showToast('Excel Bulk Import Simulation: Ready for Feedtech XLSX template', 'info');
}

// ---------------- VIDEO MANAGEMENT & EDIT DRAWER ----------------

function renderVideoManagementTable() {
  const tbody = document.getElementById('videoTableBody');
  if (!tbody) return;

  const q = (document.getElementById('videoTableSearchInput')?.value || '').toLowerCase();
  const dept = document.getElementById('videoDeptFilter')?.value || '';
  const level = document.getElementById('videoLevelFilter')?.value || '';

  let list = state.allVideos;
  if (q) {
    list = list.filter(v => v.title.toLowerCase().includes(q) || v.video_id.toLowerCase().includes(q));
  }
  if (dept) {
    list = list.filter(v => v.department === dept);
  }
  if (level) {
    list = list.filter(v => v.permission_level === level);
  }

  tbody.innerHTML = list.map(v => `
    <tr class="hover:bg-slate-50 transition-colors group">
      <td class="py-3 px-4">
        <div class="flex items-center gap-3">
          <div class="w-16 h-10 rounded bg-slate-900 overflow-hidden relative shrink-0">
            <img src="${v.thumbnail_url || 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=200'}" class="w-full h-full object-cover">
            <span class="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[8px] font-bold px-1 rounded">${v.duration}</span>
          </div>
          <div>
            <div class="font-bold text-gray-900 line-clamp-1 group-hover:text-primary transition-colors cursor-pointer text-xs" onclick="openEditDrawer(${v.id})">
              ${v.title}
            </div>
            <div class="text-[10px] text-gray-400 font-mono">${v.video_id}</div>
          </div>
        </div>
      </td>
      <td class="py-3 px-4">
        <div class="font-semibold text-gray-800 text-xs">${v.department}</div>
        <div class="text-[10px] text-gray-400 truncate max-w-[140px]">${v.tags || ''}</div>
      </td>
      <td class="py-3 px-4">${getPermissionBadgeMarkup(v.permission_level)}</td>
      <td class="py-3 px-4 text-[11px] text-gray-500">${v.views || 0} views</td>
      <td class="py-3 px-4 text-[11px] text-gray-600">${v.uploaded_by || 'Admin'}</td>
      <td class="py-3 px-4 text-right space-x-1">
        <button onclick="openVideoPlayerModal(${v.id})" class="p-1 text-gray-400 hover:text-primary rounded hover:bg-slate-100" title="Watch Video">
          <span class="material-symbols-outlined text-base">preview</span>
        </button>
        <button onclick="openEditDrawer(${v.id})" class="p-1 text-gray-400 hover:text-primary rounded hover:bg-slate-100" title="Edit Metadata & Permissions">
          <span class="material-symbols-outlined text-base">edit</span>
        </button>
      </td>
    </tr>
  `).join('');
}

function filterVideoTable() {
  renderVideoManagementTable();
}

function openEditDrawer(videoId) {
  const v = state.allVideos.find(x => x.id === videoId);
  if (!v) return;

  document.getElementById('editDrawerVideoId').value = v.id;
  document.getElementById('editDrawerThumb').src = v.thumbnail_url || 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800';
  document.getElementById('editDrawerDuration').textContent = v.duration;
  document.getElementById('editDrawerTitle').value = v.title;
  document.getElementById('editDrawerDesc').value = v.description || '';
  document.getElementById('editDrawerDept').value = v.department;
  document.getElementById('editDrawerLevel').value = v.permission_level;
  document.getElementById('editDrawerTags').value = v.tags || '';
  document.getElementById('editDrawerIsHidden').checked = (v.is_hidden === 1);
  renderTagPicker('editDrawerTagsContainer', 'editDrawerTags', false);

  const overlay = document.getElementById('edit-drawer-overlay');
  const drawer = document.getElementById('edit-drawer');

  overlay.classList.remove('hidden');
  setTimeout(() => {
    overlay.classList.remove('opacity-0');
    overlay.classList.add('opacity-100');
    drawer.classList.add('open');
  }, 10);
}

function closeEditDrawer() {
  const overlay = document.getElementById('edit-drawer-overlay');
  const drawer = document.getElementById('edit-drawer');

  drawer.classList.remove('open');
  overlay.classList.remove('opacity-100');
  overlay.classList.add('opacity-0');
  setTimeout(() => overlay.classList.add('hidden'), 300);
}

async function saveEditDrawerChanges() {
  const videoId = document.getElementById('editDrawerVideoId').value;
  const title = document.getElementById('editDrawerTitle').value.trim();
  const description = document.getElementById('editDrawerDesc').value.trim();
  const department = document.getElementById('editDrawerDept').value;
  const permission_level = document.getElementById('editDrawerLevel').value;
  const tags = document.getElementById('editDrawerTags').value.trim();
  const is_hidden = document.getElementById('editDrawerIsHidden').checked ? 1 : 0;

  try {
    const res = await fetch(`/api/videos/${videoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description, department, permission_level, tags, is_hidden })
    });
    const json = await res.json();
    if (json.success) {
      closeEditDrawer();
      await loadAllVideos();
      await loadAccessibleVideos();
      showToast('Video permissions & metadata saved', 'success');
    }
  } catch (err) {
    showToast('Failed to save changes', 'error');
  }
}

async function deleteVideoPrompt() {
  const videoId = document.getElementById('editDrawerVideoId').value;
  if (!confirm('Are you sure you want to permanently delete this video?')) return;

  try {
    const res = await fetch(`/api/videos/${videoId}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      closeEditDrawer();
      await loadAllVideos();
      await loadAccessibleVideos();
      showToast('Video deleted from portal', 'info');
    }
  } catch (err) {
    showToast('Failed to delete video', 'error');
  }
}

// ---------------- CLOUD UPLOAD HUB ----------------

async function submitUploadVideo() {
  const video_url = document.getElementById('uploadVideoUrl').value.trim();
  const title = document.getElementById('uploadVideoTitle').value.trim();
  const department = document.getElementById('uploadVideoDept').value;
  const description = document.getElementById('uploadVideoDesc').value.trim();
  const permission_level = document.getElementById('uploadVideoLevel').value;
  const category = document.getElementById('uploadVideoCategory').value;
  const duration = document.getElementById('uploadVideoDuration').value.trim() || '12:00';
  const tags = document.getElementById('uploadVideoTags').value.trim();

  if (!title || !department) {
    showToast('Please specify a title and department', 'error');
    return;
  }

  try {
    const res = await fetch('/api/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        department,
        permission_level,
        category,
        duration,
        tags,
        video_url
      })
    });
    const json = await res.json();
    if (json.success) {
      // Clear form
      document.getElementById('uploadVideoUrl').value = '';
      document.getElementById('uploadVideoTitle').value = '';
      document.getElementById('uploadVideoDesc').value = '';
      document.getElementById('uploadVideoTags').value = '';

      await loadAllVideos();
      await loadAccessibleVideos();
      navigateView('admin-videos');
      showToast(`Successfully indexed video (${json.data.video_id}) with [${permission_level}] clearance`, 'success');
    } else {
      showToast('Upload error: ' + json.message, 'error');
    }
  } catch (err) {
    showToast('Failed to upload video', 'error');
  }
}

// ---------------- ACCESS MATRIX EVALUATOR ----------------

async function loadAccessMatrix() {
  const container = document.getElementById('matrixContainer');
  const modalContent = document.getElementById('modalMatrixContent');

  try {
    const res = await fetch('/api/permission-matrix');
    const json = await res.json();
    if (!json.success) return;

    const html = generateMatrixHtml(json.data);
    if (container) container.innerHTML = html;
    if (modalContent) modalContent.innerHTML = html;
  } catch (err) {
    console.error('Failed to load matrix', err);
  }
}

function generateMatrixHtml(matrixData) {
  return `
    <table class="w-full text-left border-collapse text-xs">
      <thead>
        <tr class="bg-slate-50 border-b border-outline-variant font-bold text-gray-500 uppercase text-[10px]">
          <th class="py-3 px-4">User Persona</th>
          <th class="py-3 px-4">Department & Clearance</th>
          <th class="py-3 px-4">สิทธิ์แอดมิน / อัปโหลด</th>
          <th class="py-3 px-4 text-center">Accessible Videos</th>
          <th class="py-3 px-4">Permission Evaluation Breakdown</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-outline-variant">
        ${matrixData.map(row => {
          const u = row.user;
          const isAdmin = (u.is_admin === 1 || u.role === 'System Administrator' || u.department === 'Executive');
          const accessiblePct = Math.round((row.accessibleCount / (row.accessibleCount + row.restrictedCount)) * 100);
          
          return `
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="py-3 px-4 font-bold text-gray-900">
                ${u.name}
                <div class="text-[10px] text-gray-400 font-mono">${u.emp_id}</div>
              </td>
              <td class="py-3 px-4">
                <span class="font-semibold text-gray-700">${u.department}</span>
                <div class="mt-0.5">${getPermissionBadgeMarkup(u.permission_level)}</div>
                <div class="mt-1 text-[10px] text-emerald-800 font-mono bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                  Tags: ${u.allowed_tags || '#general'}
                </div>
              </td>
              <td class="py-3 px-4">
                ${isAdmin ? `
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                    <span class="material-symbols-outlined text-xs">admin_panel_settings</span> แอดมิน (อัปโหลดและจัดการได้)
                  </span>
                ` : `
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    <span class="material-symbols-outlined text-xs">visibility</span> พนักงานทั่วไป (ดูได้อย่างเดียว)
                  </span>
                `}
              </td>
              <td class="py-3 px-4 text-center">
                <span class="font-bold text-emerald-700">${row.accessibleCount}</span> / ${row.accessibleCount + row.restrictedCount}
                <div class="w-20 bg-slate-200 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                  <div class="bg-emerald-500 h-full" style="width: ${accessiblePct}%"></div>
                </div>
              </td>
              <td class="py-3 px-4">
                <div class="flex flex-wrap gap-1 max-w-lg">
                  ${row.accessible.map(a => `
                    <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-800 border border-emerald-200" title="Granted: ${a.title} (${a.level})">
                      <span class="material-symbols-outlined text-[10px]">check</span> ${a.video_id}
                    </span>
                  `).join('')}
                  ${row.restricted.map(r => `
                    <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-rose-50 text-rose-700 border border-rose-200" title="Hidden: ${r.reason}">
                      <span class="material-symbols-outlined text-[10px]">lock</span> ${r.video_id}
                    </span>
                  `).join('')}
                </div>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function openPermissionMatrixModal() {
  loadAccessMatrix();
  document.getElementById('matrixModal').classList.remove('hidden');
}

function closePermissionMatrixModal() {
  document.getElementById('matrixModal').classList.add('hidden');
}

// ---------------- AUDIT LOGS ----------------

function renderAuditLogs() {
  const tbody = document.getElementById('auditLogsBody');
  if (!tbody) return;

  tbody.innerHTML = state.auditLogs.map(l => `
    <tr class="hover:bg-slate-50 transition-colors">
      <td class="py-3 px-4 font-mono text-[11px] text-gray-400 whitespace-nowrap">${l.created_at}</td>
      <td class="py-3 px-4">
        <div class="font-bold text-gray-900">${l.actor_name}</div>
        <div class="text-[10px] text-gray-400">${l.actor_role}</div>
      </td>
      <td class="py-3 px-4">
        <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700 border border-slate-200">${l.action}</span>
      </td>
      <td class="py-3 px-4 font-semibold text-gray-800">${l.target}</td>
      <td class="py-3 px-4 text-gray-500">${l.details || '-'}</td>
    </tr>
  `).join('');
}

function exportAuditLogs() {
  const headers = ['Timestamp', 'Actor Name', 'Actor Role', 'Action', 'Target', 'Details'];
  const rows = state.auditLogs.map(l => [
    `"${l.created_at || ''}"`,
    `"${l.actor_name || ''}"`,
    `"${l.actor_role || ''}"`,
    `"${l.action || ''}"`,
    `"${l.target || ''}"`,
    `"${(l.details || '').replace(/"/g, '""')}"`
  ]);
  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `feedtech_audit_logs_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('Audit logs exported to CSV successfully', 'success');
}

// ---------------- GLOBAL SEARCH ----------------

function handleGlobalSearch(query) {
  state.searchQuery = query.trim();
  if (state.activeView !== 'home') {
    navigateView('home');
  } else {
    renderHomeVideos();
  }
}

function openHeroVideo() {
  if (state.accessibleVideos.length > 0) {
    openVideoPlayerModal(state.accessibleVideos[0].id);
  }
}

function toggleHeroFavorite() {
  if (state.accessibleVideos.length > 0) {
    toggleFavorite(state.accessibleVideos[0].id);
  }
}

// ---------------- TAG & CATEGORY GOVERNANCE ----------------

async function loadTags() {
  try {
    const res = await fetch('/api/tags');
    const json = await res.json();
    if (json.success) {
      state.tags = json.data;
      const countEl = document.getElementById('tagStatCount');
      if (countEl) countEl.textContent = `${state.tags.length} Tags`;
      renderTagTable();
    }
  } catch (err) {
    console.error('Failed to load tags', err);
  }
}

async function loadCategories() {
  try {
    const res = await fetch('/api/categories');
    const json = await res.json();
    if (json.success) {
      state.categories = json.data;
      const countEl = document.getElementById('catStatCount');
      if (countEl) countEl.textContent = `${state.categories.length} Categories`;
      renderAdminCategoryTable();
    }
  } catch (err) {
    console.error('Failed to load categories', err);
  }
}

function renderTagTable() {
  const tbody = document.getElementById('tagTableBody');
  if (!tbody) return;

  const search = (document.getElementById('tagSearchInput')?.value || '').toLowerCase().trim();
  const clearanceFilter = document.getElementById('tagClearanceFilter')?.value || '';

  const filtered = state.tags.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search) || (t.description && t.description.toLowerCase().includes(search)) || t.department.toLowerCase().includes(search);
    const matchClearance = !clearanceFilter || t.clearance_level === clearanceFilter;
    return matchSearch && matchClearance;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-gray-400 italic">No security tags match the selected criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(t => {
    const isConf = t.clearance_level === 'Highly Confidential';
    const isRest = t.clearance_level === 'Restricted';
    const tagBadgeColor = isConf ? 'bg-rose-50 text-rose-800 border-rose-200' : (isRest ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200');

    return `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="py-3 px-5 font-mono font-bold">
          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border ${tagBadgeColor}">
            ${t.name}
          </span>
        </td>
        <td class="py-3 px-5 font-semibold text-gray-700">${t.department}</td>
        <td class="py-3 px-5">${getPermissionBadgeMarkup(t.clearance_level)}</td>
        <td class="py-3 px-5 text-center">
          <button onclick="handleTagSearch('${t.name}')" class="font-bold text-primary hover:underline" title="Click to filter videos with this tag">
            ${t.video_count || 0} videos
          </button>
        </td>
        <td class="py-3 px-5 text-center font-bold text-gray-700">${t.user_count || 0} users</td>
        <td class="py-3 px-5 text-gray-500 max-w-xs truncate" title="${t.description || ''}">${t.description || '-'}</td>
        <td class="py-3 px-5 text-right space-x-1">
          <button onclick="editTagPrompt(${t.id})" class="p-1 text-gray-400 hover:text-primary rounded hover:bg-slate-100" title="Edit Tag Clearance & Scope">
            <span class="material-symbols-outlined text-sm">edit</span>
          </button>
          <button onclick="deleteTagPrompt(${t.id})" class="p-1 text-gray-400 hover:text-rose-600 rounded hover:bg-slate-100" title="Delete Tag">
            <span class="material-symbols-outlined text-sm">delete</span>
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function filterTagTable() {
  renderTagTable();
}

function openAddTagModal() {
  document.getElementById('tagModalTitle').textContent = 'Add New Security Tag';
  document.getElementById('modalTagId').value = '';
  document.getElementById('modalTagName').value = '';
  document.getElementById('modalTagClearance').value = 'Standard';
  document.getElementById('modalTagDesc').value = '';
  document.getElementById('tagModal').classList.remove('hidden');
}

function editTagPrompt(tagId) {
  const tag = state.tags.find(t => t.id === tagId);
  if (!tag) return;

  document.getElementById('tagModalTitle').textContent = 'Edit Security Tag Clearance';
  document.getElementById('modalTagId').value = tag.id;
  document.getElementById('modalTagName').value = tag.name;
  document.getElementById('modalTagClearance').value = tag.clearance_level || 'Standard';
  document.getElementById('modalTagDept').value = tag.department || 'General';
  document.getElementById('modalTagDesc').value = tag.description || '';
  document.getElementById('tagModal').classList.remove('hidden');
}

function closeTagModal() {
  document.getElementById('tagModal').classList.add('hidden');
}

async function saveTagModalSubmit() {
  const id = document.getElementById('modalTagId').value;
  const name = document.getElementById('modalTagName').value.trim();
  const clearance_level = document.getElementById('modalTagClearance').value;
  const department = document.getElementById('modalTagDept').value;
  const description = document.getElementById('modalTagDesc').value.trim();

  if (!name) {
    showToast('Please specify a Tag name', 'error');
    return;
  }

  try {
    let res;
    if (id) {
      res = await fetch(`/api/tags/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, clearance_level, department, description })
      });
    } else {
      res = await fetch('/api/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, clearance_level, department, description })
      });
    }

    const json = await res.json();
    if (json.success) {
      closeTagModal();
      await loadTags();
      await loadAccessibleVideos();
      showToast(id ? 'Security Tag updated' : 'Security Tag created successfully', 'success');
    } else {
      showToast('Error: ' + json.message, 'error');
    }
  } catch (err) {
    showToast('Failed to save security tag', 'error');
  }
}

async function deleteTagPrompt(tagId) {
  const tag = state.tags.find(t => t.id === tagId);
  if (!tag) return;
  if (!confirm(`Are you sure you want to delete security tag "${tag.name}"?`)) return;

  try {
    const res = await fetch(`/api/tags/${tagId}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      await loadTags();
      showToast(`Deleted tag ${tag.name}`, 'success');
    } else {
      showToast('Error: ' + json.message, 'error');
    }
  } catch (err) {
    showToast('Failed to delete tag', 'error');
  }
}

// ---------------- ACADEMIC CATEGORY MANAGEMENT ----------------

function renderAdminCategoryTable() {
  const grid = document.getElementById('adminCategoryGrid');
  if (!grid) return;

  grid.innerHTML = state.categories.map(c => `
    <div class="p-4 rounded-xl border border-outline-variant bg-slate-50 flex items-center justify-between hover:bg-slate-100/70 transition-colors">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-xl bg-white border border-outline-variant flex items-center justify-center font-bold text-primary">
          <span class="material-symbols-outlined text-xl">${c.icon || 'category'}</span>
        </div>
        <div>
          <h4 class="font-bold text-xs text-gray-900">${c.name}</h4>
          <span class="text-[10px] text-gray-400 font-semibold">${c.video_count || 0} cataloged videos</span>
        </div>
      </div>
      <div class="flex items-center gap-1">
        <button onclick="editCategoryPrompt(${c.id})" class="p-1 text-gray-400 hover:text-primary rounded hover:bg-white" title="Edit Category">
          <span class="material-symbols-outlined text-sm">edit</span>
        </button>
        <button onclick="deleteCategoryPrompt(${c.id})" class="p-1 text-gray-400 hover:text-rose-600 rounded hover:bg-white" title="Delete Category">
          <span class="material-symbols-outlined text-sm">delete</span>
        </button>
      </div>
    </div>
  `).join('');
}

function openAddCategoryModal() {
  document.getElementById('categoryModalTitle').textContent = 'Add Academic Category';
  document.getElementById('modalCatId').value = '';
  document.getElementById('modalCatName').value = '';
  document.getElementById('modalCatIcon').value = 'category';
  document.getElementById('categoryModal').classList.remove('hidden');
}

function editCategoryPrompt(catId) {
  const cat = state.categories.find(c => c.id === catId);
  if (!cat) return;
  document.getElementById('categoryModalTitle').textContent = 'Edit Category';
  document.getElementById('modalCatId').value = cat.id;
  document.getElementById('modalCatName').value = cat.name;
  document.getElementById('modalCatIcon').value = cat.icon || 'category';
  document.getElementById('categoryModal').classList.remove('hidden');
}

function closeCategoryModal() {
  document.getElementById('categoryModal').classList.add('hidden');
}

async function saveCategoryModalSubmit() {
  const id = document.getElementById('modalCatId').value;
  const name = document.getElementById('modalCatName').value.trim();
  const icon = document.getElementById('modalCatIcon').value.trim() || 'category';

  if (!name) {
    showToast('Please enter category name', 'error');
    return;
  }

  try {
    let res;
    if (id) {
      res = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, icon })
      });
    } else {
      res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, icon })
      });
    }

    const json = await res.json();
    if (json.success) {
      closeCategoryModal();
      await loadCategories();
      showToast(id ? 'Category updated' : 'Category created successfully', 'success');
    }
  } catch (err) {
    showToast('Failed to save category', 'error');
  }
}

async function deleteCategoryPrompt(catId) {
  if (!confirm('Are you sure you want to delete this category?')) return;
  try {
    const res = await fetch(`/api/categories/${catId}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      await loadCategories();
      showToast('Category deleted', 'success');
    }
  } catch (err) {
    showToast('Failed to delete category', 'error');
  }
}

// ---------------- DEPARTMENT MANAGEMENT ----------------

function renderAdminDeptTable() {
  const grid = document.getElementById('adminDeptGrid');
  if (!grid) return;

  grid.innerHTML = state.departments.map(d => `
    <div class="bg-white p-5 rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div class="w-10 h-10 rounded-xl bg-emerald-50 text-primary flex items-center justify-center font-bold">
            <span class="material-symbols-outlined text-xl">${d.icon || 'domain'}</span>
          </div>
          <span class="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-slate-100 text-slate-700">${d.code || 'BU'}</span>
        </div>
        <div>
          <h3 class="font-bold text-sm text-gray-900">${d.name}</h3>
          <p class="text-xs text-gray-500 mt-1 leading-relaxed">${d.description || 'Specialized business unit repository.'}</p>
        </div>
      </div>
      <div class="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
        <span class="text-xs font-bold text-emerald-800">${d.video_count || 0} Videos Indexed</span>
        <button onclick="openDepartmentHub('${d.name}')" class="text-xs font-bold text-primary hover:underline flex items-center gap-0.5">
          <span>View Hub</span>
          <span class="material-symbols-outlined text-xs">arrow_forward</span>
        </button>
      </div>
    </div>
  `).join('');
}

function openAddDeptModal() {
  document.getElementById('deptModalTitle').textContent = 'Add Business Unit / Department';
  document.getElementById('modalDeptName').value = '';
  document.getElementById('modalDeptCode').value = '';
  document.getElementById('modalDeptIcon').value = 'domain';
  document.getElementById('modalDeptDesc').value = '';
  document.getElementById('deptModal').classList.remove('hidden');
}

function closeDeptModal() {
  document.getElementById('deptModal').classList.add('hidden');
}

async function saveDeptModalSubmit() {
  const name = document.getElementById('modalDeptName').value.trim();
  const code = document.getElementById('modalDeptCode').value.trim();
  const icon = document.getElementById('modalDeptIcon').value.trim() || 'domain';
  const description = document.getElementById('modalDeptDesc').value.trim();

  if (!name || !code) {
    showToast('Name and Code are required', 'error');
    return;
  }

  try {
    const res = await fetch('/api/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, code, icon, description })
    });
    const json = await res.json();
    if (json.success) {
      closeDeptModal();
      await loadDepartments();
      showToast('Department added successfully', 'success');
    }
  } catch (err) {
    showToast('Failed to add department', 'error');
  }
}

// ---------------- MEETING RECORDINGS ----------------

function renderMeetingsView(filter = 'all') {
  const grid = document.getElementById('meetingsVideoGrid');
  if (!grid) return;

  const meetingVideos = state.accessibleVideos.filter(v => {
    const isMeeting = v.category.includes('Townhall') || v.category.includes('Meeting') || (v.tags && v.tags.includes('meeting')) || (v.title && v.title.toLowerCase().includes('townhall'));
    if (filter === 'all') return isMeeting || true; // Show all relevant videos if no specific meetings
    if (filter === 'Townhall') return v.category.includes('Townhall') || (v.tags && v.tags.includes('townhall'));
    if (filter === 'R&D') return v.department === 'Biotech' || v.department === 'QC-Lab';
    if (filter === 'Operations') return v.department === 'Operations' || v.department === 'Swine';
    return true;
  });

  if (meetingVideos.length === 0) {
    grid.innerHTML = `<div class="col-span-full py-12 text-center text-gray-400">No meeting recordings found for the selected filter.</div>`;
    return;
  }

  grid.innerHTML = meetingVideos.map(v => createVideoCardHtml(v)).join('');
}

function filterMeetings(filter) {
  document.querySelectorAll('.meeting-filter-btn').forEach(btn => {
    btn.className = 'meeting-filter-btn px-3 py-1.5 bg-white border border-outline-variant text-gray-600 hover:bg-slate-50 text-xs font-medium rounded-lg';
  });
  event.target.className = 'meeting-filter-btn px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg';
  renderMeetingsView(filter);
}

// ---------------- CATEGORY DETAIL ----------------

function openCategoryDetail(catName) {
  state.selectedCategory = catName;
  navigateView('category-detail');

  const titleEl = document.getElementById('catDetailTitle');
  const descEl = document.getElementById('catDetailDesc');
  const grid = document.getElementById('catDetailVideoGrid');

  if (titleEl) titleEl.textContent = catName;
  if (descEl) descEl.textContent = `Official collection of academic assets, research papers, and SOP video protocols under ${catName}.`;

  const filtered = state.accessibleVideos.filter(v => {
    if (v.category === catName) return true;
    if (catName.includes('Research') && v.department === 'Biotech') return true;
    if (catName.includes('Training') && (v.tags && v.tags.includes('safety'))) return true;
    if (catName.includes('Mill') && (v.tags && v.tags.includes('silo') || v.department === 'Operations')) return true;
    if (catName.includes('Vendor') && v.department === 'Raw Material') return true;
    return false;
  });

  if (grid) {
    if (filtered.length === 0) {
      grid.innerHTML = `<div class="col-span-full py-12 text-center text-gray-400">No videos available under this category with your current security clearance.</div>`;
    } else {
      grid.innerHTML = filtered.map(v => createVideoCardHtml(v)).join('');
    }
  }
}

// ---------------- EVENTS & SYMPOSIA LOGIC (STITCH DESIGN) ----------------

async function loadEvents() {
  try {
    const res = await fetch('/api/events');
    const json = await res.json();
    if (json.success && Array.isArray(json.data)) {
      state.events = json.data;
    }
    if (state.activeView === 'events') {
      renderEvents();
    }
    if (state.activeView === 'admin-events') {
      renderAdminEventsTable();
    }
  } catch (err) {
    console.error('Failed to load events:', err);
  }
}

function renderEvents() {
  const grid = document.getElementById('eventsGrid');
  if (!grid) return;

  if (!state.events || state.events.length === 0) {
    grid.innerHTML = `<div class="col-span-full py-12 text-center text-gray-400">No scheduled events found.</div>`;
    return;
  }

  grid.innerHTML = state.events.map(e => {
    let statusClass = 'bg-primary text-white';
    if (e.status === 'Live') statusClass = 'bg-rose-600 text-white animate-pulse';
    if (e.status === 'Past') statusClass = 'bg-slate-200 text-gray-700';

    const levelBadge = getPermissionBadgeMarkup(e.clearance_level || 'Standard');

    return `
      <div class="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow group">
        <div class="aspect-video w-full relative overflow-hidden bg-slate-900 cursor-pointer" onclick="openEventDetail(${e.id})">
          <img src="${e.banner_url || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800'}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
          <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
          <div class="absolute top-3 left-3 flex items-center gap-1.5">
            <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusClass}">${e.status || 'Upcoming'}</span>
            ${levelBadge}
          </div>
          <div class="absolute bottom-2.5 left-3 right-3 text-white">
            <div class="text-[11px] font-mono flex items-center gap-1 opacity-90">
              <span class="material-symbols-outlined text-xs">calendar_today</span>
              <span>${e.date} • ${e.time || '09:00'}</span>
            </div>
          </div>
        </div>

        <div class="p-5 flex-1 flex flex-col justify-between space-y-3">
          <div>
            <div class="flex items-center gap-1.5 text-[11px] text-gray-400 font-medium mb-1">
              <span class="material-symbols-outlined text-xs">location_on</span>
              <span class="truncate">${e.location}</span>
            </div>
            <h3 class="font-bold text-gray-900 text-sm group-hover:text-primary transition-colors cursor-pointer line-clamp-2" onclick="openEventDetail(${e.id})">
              ${e.title}
            </h3>
            <p class="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
              ${e.description || 'Pioneering agricultural advancements, symposium breakouts, and technical keynotes.'}
            </p>
          </div>

          <div class="pt-3 border-t border-outline-variant/60 flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-7 h-7 rounded-full bg-slate-100 border border-outline-variant flex items-center justify-center text-primary text-xs font-bold">
                ${(e.speaker || 'F').charAt(0)}
              </div>
              <div class="text-[11px]">
                <div class="font-semibold text-gray-800 line-clamp-1">${e.speaker || 'Feedtech Specialist'}</div>
                <div class="text-gray-400 text-[10px]">${e.department || 'General'}</div>
              </div>
            </div>
            <button onclick="openEventDetail(${e.id})" class="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1">
              <span>View Details</span>
              <span class="material-symbols-outlined text-xs">arrow_forward</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function openEventDetail(eventId) {
  const event = state.events.find(x => x.id === eventId);
  if (!event) return;

  // Set breadcrumb & texts
  const bc = document.getElementById('eventDetailBreadcrumb');
  if (bc) bc.textContent = event.title;

  const bg = document.getElementById('eventDetailBannerBg');
  if (bg && event.banner_url) {
    bg.style.backgroundImage = `url('${event.banner_url}')`;
  }

  const titleEl = document.getElementById('eventDetailTitle');
  if (titleEl) titleEl.textContent = event.title;

  const descEl = document.getElementById('eventDetailDesc');
  if (descEl) descEl.textContent = event.description || '';

  const dateEl = document.getElementById('eventDetailDateText');
  if (dateEl) dateEl.innerHTML = `<span class="material-symbols-outlined text-sm">calendar_today</span> ${event.date}`;

  const locEl = document.getElementById('eventDetailLocationText');
  if (locEl) locEl.innerHTML = `<span class="material-symbols-outlined text-sm">location_on</span> ${event.location}`;

  const timeEl = document.getElementById('eventDetailTimeText');
  if (timeEl) timeEl.textContent = event.time || '09:00 - 17:00';

  const deptEl = document.getElementById('eventDetailDeptText');
  if (deptEl) deptEl.textContent = event.department || 'General';

  const attEl = document.getElementById('eventDetailAttendeesText');
  if (attEl) attEl.textContent = `${(event.attendees_count || 320).toLocaleString()} Attendees`;

  const statusBadge = document.getElementById('eventDetailStatusBadge');
  if (statusBadge) {
    statusBadge.textContent = event.status || 'Upcoming';
    if (event.status === 'Live') statusBadge.className = 'bg-rose-600 text-white text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold animate-pulse';
    else if (event.status === 'Past') statusBadge.className = 'bg-slate-300 text-gray-800 text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold';
    else statusBadge.className = 'bg-primary text-white text-[11px] px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold';
  }

  const clearanceBadge = document.getElementById('eventDetailClearanceBadge');
  if (clearanceBadge) clearanceBadge.textContent = event.clearance_level || 'Standard';

  const levelBadge = document.getElementById('eventDetailLevelBadge');
  if (levelBadge) {
    levelBadge.textContent = event.clearance_level || 'Standard';
    if (event.clearance_level === 'Highly Confidential') levelBadge.className = 'px-2 py-0.5 bg-rose-50 text-rose-700 font-bold rounded text-[11px]';
    else if (event.clearance_level === 'Restricted') levelBadge.className = 'px-2 py-0.5 bg-amber-50 text-amber-700 font-bold rounded text-[11px]';
    else levelBadge.className = 'px-2 py-0.5 bg-emerald-50 text-emerald-800 font-bold rounded text-[11px]';
  }

  const speakerName = document.getElementById('eventDetailSpeakerName');
  if (speakerName) speakerName.textContent = event.speaker || 'Feedtech Keynote Speaker';

  const speakerRole = document.getElementById('eventDetailSpeakerRole');
  if (speakerRole) speakerRole.textContent = event.speaker_role || 'Senior Agri-Tech Researcher';

  // Video source
  const videoPlayer = document.getElementById('eventDetailVideoPlayer');
  if (videoPlayer) {
    videoPlayer.src = event.video_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    if (event.banner_url) videoPlayer.poster = event.banner_url;
  }

  // Materials button
  const matBtn = document.getElementById('eventDetailMaterialsBtn');
  if (matBtn) {
    matBtn.href = event.materials_url || '#';
    matBtn.onclick = (ev) => {
      if (!event.materials_url) {
        ev.preventDefault();
        showToast('Event materials PDF downloaded to your device', 'success');
      }
    };
  }

  navigateView('event-detail');
}

function playEventHighlightReel() {
  const player = document.getElementById('eventDetailVideoPlayer');
  if (player) {
    player.scrollIntoView({ behavior: 'smooth', block: 'center' });
    player.play().catch(() => {});
  }
}

function registerForEventPrompt() {
  showToast('🎉 Successfully registered for Live Stream! A calendar invitation has been sent to your email.', 'success');
}

function addEventToCalendar() {
  showToast('📅 Event .ics file downloaded and added to your corporate calendar.', 'info');
}

// ---------------- ADMIN EVENT MANAGEMENT ----------------

function renderAdminEventsTable() {
  const tbody = document.getElementById('adminEventsTableBody');
  if (!tbody) return;

  // Populate department filter
  const deptFilter = document.getElementById('adminEventDeptFilter');
  if (deptFilter && deptFilter.options.length <= 1) {
    deptFilter.innerHTML = `<option value="">All Departments</option>` + state.departments.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
  }

  // Populate KPI counts
  const countEl = document.getElementById('adminEventCount');
  if (countEl) countEl.textContent = `${state.events.length} Events`;

  const attEl = document.getElementById('adminEventAttendees');
  if (attEl) {
    const totalAtt = state.events.reduce((sum, e) => sum + (e.attendees_count || 0), 0);
    attEl.textContent = `${totalAtt.toLocaleString()} Total`;
  }

  filterAdminEventsTable();
}

function filterAdminEventsTable() {
  const tbody = document.getElementById('adminEventsTableBody');
  if (!tbody) return;

  const q = (document.getElementById('adminEventSearchInput')?.value || '').toLowerCase();
  const dept = document.getElementById('adminEventDeptFilter')?.value || '';
  const status = document.getElementById('adminEventStatusFilter')?.value || '';

  let list = state.events;
  if (q) {
    list = list.filter(e => e.title.toLowerCase().includes(q) || (e.speaker && e.speaker.toLowerCase().includes(q)));
  }
  if (dept) {
    list = list.filter(e => e.department === dept);
  }
  if (status) {
    list = list.filter(e => e.status === status);
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-gray-400">No events found matching current criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(e => `
    <tr class="hover:bg-slate-50 transition-colors">
      <td class="py-3 px-4">
        <div class="font-bold text-gray-900 text-xs">${e.title}</div>
        <div class="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
          <span class="material-symbols-outlined text-[12px]">location_on</span>
          <span>${e.location}</span>
        </div>
      </td>
      <td class="py-3 px-4 font-mono text-gray-600">
        <div>${e.date}</div>
        <div class="text-[10px] text-gray-400">${e.time || '09:00'}</div>
      </td>
      <td class="py-3 px-4">
        <div class="font-semibold text-gray-800">${e.speaker || 'TBD'}</div>
        <div class="text-[10px] text-gray-400">${e.speaker_role || 'Speaker'}</div>
      </td>
      <td class="py-3 px-4 font-medium text-gray-700">${e.department || 'General'}</td>
      <td class="py-3 px-4">${getPermissionBadgeMarkup(e.clearance_level || 'Standard')}</td>
      <td class="py-3 px-4">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${e.status === 'Live' ? 'bg-rose-100 text-rose-700 animate-pulse' : (e.status === 'Past' ? 'bg-slate-100 text-gray-600' : 'bg-emerald-100 text-emerald-800')}">
          ${e.status || 'Upcoming'}
        </span>
      </td>
      <td class="py-3 px-4 text-right space-x-1">
        <button onclick="openEventDetail(${e.id})" class="p-1 text-gray-400 hover:text-primary rounded hover:bg-slate-100" title="View Event Detail">
          <span class="material-symbols-outlined text-base">preview</span>
        </button>
        <button onclick="openEditEventModal(${e.id})" class="p-1 text-gray-400 hover:text-primary rounded hover:bg-slate-100" title="Edit Event">
          <span class="material-symbols-outlined text-base">edit</span>
        </button>
        <button onclick="deleteEventPrompt(${e.id})" class="p-1 text-gray-400 hover:text-rose-600 rounded hover:bg-slate-100" title="Delete Event">
          <span class="material-symbols-outlined text-base">delete</span>
        </button>
      </td>
    </tr>
  `).join('');
}

function openAddEventModal() {
  document.getElementById('modalEventId').value = '';
  document.getElementById('eventModalTitle').textContent = 'Create New Event';
  document.getElementById('modalEventTitle').value = '';
  document.getElementById('modalEventDate').value = new Date().toISOString().split('T')[0];
  document.getElementById('modalEventTime').value = '09:00 - 16:30 ICT';
  document.getElementById('modalEventLocation').value = '';
  document.getElementById('modalEventSpeaker').value = '';
  document.getElementById('modalEventSpeakerRole').value = '';
  document.getElementById('modalEventDesc').value = '';
  document.getElementById('modalEventBannerUrl').value = '';
  document.getElementById('modalEventVideoUrl').value = '';
  document.getElementById('modalEventStatus').value = 'Upcoming';
  document.getElementById('modalEventLevel').value = 'Standard';

  const deptSel = document.getElementById('modalEventDept');
  if (deptSel) {
    deptSel.innerHTML = state.departments.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
  }

  document.getElementById('eventModal').classList.remove('hidden');
}

function openEditEventModal(eventId) {
  const e = state.events.find(x => x.id === eventId);
  if (!e) return;

  document.getElementById('modalEventId').value = e.id;
  document.getElementById('eventModalTitle').textContent = `Edit Event: ${e.title}`;
  document.getElementById('modalEventTitle').value = e.title;
  document.getElementById('modalEventDate').value = e.date;
  document.getElementById('modalEventTime').value = e.time || '';
  document.getElementById('modalEventLocation').value = e.location || '';
  document.getElementById('modalEventSpeaker').value = e.speaker || '';
  document.getElementById('modalEventSpeakerRole').value = e.speaker_role || '';
  document.getElementById('modalEventDesc').value = e.description || '';
  document.getElementById('modalEventBannerUrl').value = e.banner_url || '';
  document.getElementById('modalEventVideoUrl').value = e.video_url || '';
  document.getElementById('modalEventStatus').value = e.status || 'Upcoming';
  document.getElementById('modalEventLevel').value = e.clearance_level || 'Standard';

  const deptSel = document.getElementById('modalEventDept');
  if (deptSel) {
    deptSel.innerHTML = state.departments.map(d => `<option value="${d.name}" ${d.name === e.department ? 'selected' : ''}>${d.name}</option>`).join('');
  }

  document.getElementById('eventModal').classList.remove('hidden');
}

function closeEventModal() {
  document.getElementById('eventModal').classList.add('hidden');
}

async function saveEventModalSubmit() {
  const id = document.getElementById('modalEventId').value;
  const title = document.getElementById('modalEventTitle').value.trim();
  const date = document.getElementById('modalEventDate').value;
  const time = document.getElementById('modalEventTime').value.trim();
  const location = document.getElementById('modalEventLocation').value.trim();
  const speaker = document.getElementById('modalEventSpeaker').value.trim();
  const speaker_role = document.getElementById('modalEventSpeakerRole').value.trim();
  const department = document.getElementById('modalEventDept').value;
  const clearance_level = document.getElementById('modalEventLevel').value;
  const status = document.getElementById('modalEventStatus').value;
  const description = document.getElementById('modalEventDesc').value.trim();
  const banner_url = document.getElementById('modalEventBannerUrl').value.trim();
  const video_url = document.getElementById('modalEventVideoUrl').value.trim();

  if (!title || !date || !location) {
    showToast('Please specify Title, Date, and Location', 'error');
    return;
  }

  const payload = { title, date, time, location, speaker, speaker_role, department, clearance_level, status, description, banner_url, video_url };

  try {
    const url = id ? `/api/events/${id}` : '/api/events';
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const json = await res.json();
    if (json.success) {
      showToast(id ? 'Event updated successfully' : 'New event created successfully', 'success');
      closeEventModal();
      await loadEvents();
    } else {
      showToast(json.message || 'Failed to save event', 'error');
    }
  } catch (err) {
    showToast('Network error while saving event', 'error');
  }
}

async function deleteEventPrompt(eventId) {
  const e = state.events.find(x => x.id === eventId);
  if (!e) return;

  if (!confirm(`Are you sure you want to delete the event: "${e.title}"?`)) return;

  try {
    const res = await fetch(`/api/events/${eventId}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      showToast('Event deleted successfully', 'info');
      await loadEvents();
    } else {
      showToast(json.message || 'Failed to delete event', 'error');
    }
  } catch (err) {
    showToast('Network error while deleting event', 'error');
  }
}

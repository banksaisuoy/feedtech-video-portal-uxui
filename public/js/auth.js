// ==========================================
// MODULE: AUTH & PERSONA ENGINE (auth.js)
// Current user management, persona switching, RBAC/PBAC profiles
// ==========================================

async function loadUsers() {
  try {
    const res = await fetch('/api/users');
    const json = await res.json();
    if (json.success) {
      state.users = json.data;
      renderPersonaSelector();
      if (typeof renderUserTable === 'function') renderUserTable();
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
    } else {
      const tbody = document.getElementById('videoTableBody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="py-12 text-center text-xs text-rose-500">Unable to load video assets.</td></tr>';
    }
  } catch (err) {
    console.error('Failed to load all videos', err);
    const tbody = document.getElementById('videoTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="py-12 text-center text-xs text-rose-500">Unable to load video assets. Please try again.</td></tr>';
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
      ${u.name} — ${u.role} (${u.department}) ${u.is_admin ? '👑 Admin' : '👤 User'}
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
    if (isAdmin) {
      badge.textContent = '👑 Super Admin';
      badge.className = 'px-2 py-0.5 rounded text-[11px] font-bold bg-purple-500/40 text-purple-200 border border-purple-400';
    } else if (u.name.includes('Noi') || u.name.includes('Nuntana') || u.department === 'Executive') {
      badge.textContent = '⭐ Executive Board';
      badge.className = 'px-2 py-0.5 rounded text-[11px] font-bold bg-amber-500/40 text-amber-200 border border-amber-400';
    } else if (u.name.includes('Noom') || u.name.includes('Thanawat') || u.role.includes('Lead')) {
      badge.textContent = '🔬 Senior R&D Lead';
      badge.className = 'px-2 py-0.5 rounded text-[11px] font-bold bg-blue-500/40 text-blue-200 border border-blue-400';
    } else {
      badge.textContent = '👤 Authorized Staff';
      badge.className = 'px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-500/30 text-emerald-300 border border-emerald-500/50';
    }
  }

  if (deptText) {
    deptText.textContent = `Dept: ${u.department} | Role: ${u.role} | Access: PBAC`;
  }

  // Top navbar profile
  const navName = document.getElementById('navUserName');
  const navRole = document.getElementById('navUserRole');
  const navAvatar = document.getElementById('navAvatar');

  if (navName) navName.textContent = u.name;
  if (navRole) navRole.textContent = `${u.role} • ${u.is_admin ? 'Admin' : 'User'}`;
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
  const profileEmpId = document.getElementById('profileEmpId');
  const profileDept = document.getElementById('profileDept');
  const profileVidCount = document.getElementById('profileVidCount');
  const profileAdminStatus = document.getElementById('profileAdminStatus');
  const rawTags = (u.allowed_tags || '').split(',').map(tag => tag.trim()).filter(Boolean);

  const initials = u.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  if (modalAvatar) {
    modalAvatar.textContent = initials;
    modalAvatar.style.backgroundColor = u.avatar_color || '#10b981';
  }
  if (modalName) modalName.textContent = u.name;
  if (modalEmailDept) {
    const execTag = (u.is_executive_board === 1 || u.department === 'Executive Board') ? ' • ⭐ Executive Board' : '';
    modalEmailDept.textContent = `${u.email} • ${u.department}${execTag}`;
  }
  if (modalClearance) {
    const isBoard = (u.is_executive_board === 1 || u.department === 'Executive Board');
    modalClearance.textContent = isBoard ? '⭐ Executive Board' : (u.permission_level || 'Authorized Active');
    modalClearance.className = isBoard
      ? 'px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400 text-amber-950 border border-amber-300'
      : 'px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/80 text-white border border-white/20';
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
  if (profileDept) {
    const isBoard = (u.is_executive_board === 1 || u.department === 'Executive Board');
    profileDept.innerHTML = `${u.department || 'General'} ${isBoard ? '<span class="text-[10px] text-amber-600 block">⭐ Executive Board</span>' : ''}`;
  }
  if (profileVidCount) profileVidCount.textContent = `${state.accessibleVideos ? state.accessibleVideos.length : 0} / ${state.allVideos ? state.allVideos.length : 10}`;
  if (profileAdminStatus) profileAdminStatus.textContent = isAdmin ? 'Administrator (Full)' : 'View-Only (Non-Admin)';

  // Render Allowed Tags Chips in Banner
  const bannerTagsContainer = document.getElementById('bannerUserTagsContainer');
  if (bannerTagsContainer) {
    bannerTagsContainer.innerHTML = rawTags.map(t => `
      <button onclick="handleTagSearch('${t}'); return false;" class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 hover:bg-emerald-100 transition-colors shadow-xs" title="Click to search videos by this tag">
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
      showToast('Redirected to User Portal: General users only have video viewing access.', 'info');
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
      bannerAdminBadge.innerHTML = `<span class="material-symbols-outlined text-[12px]">visibility</span> ${t('viewOnlyBadge')}`;
    }
  }

  if (bannerUploadStatus) {
    if (isAdmin) {
      bannerUploadStatus.innerHTML = `<span class="material-symbols-outlined text-xs text-emerald-600">check_circle</span> ${t('uploadPerm')}`;
    } else {
      bannerUploadStatus.innerHTML = `<span class="material-symbols-outlined text-xs text-rose-500">block</span> ${t('uploadNoPerm')}`;
    }
  }

  if (bannerAdminMenuStatus) {
    if (isAdmin) {
      bannerAdminMenuStatus.innerHTML = `<span class="material-symbols-outlined text-xs text-emerald-600">check_circle</span> ${t('adminActive')}`;
    } else {
      bannerAdminMenuStatus.innerHTML = `<span class="material-symbols-outlined text-xs text-rose-500">lock</span> ${t('adminHidden')}`;
    }
  }

  if (bannerPermDesc) {
    if (isAdmin) {
      bannerPermDesc.innerHTML = `Administrator mode active: <b>Full administrator privileges</b> to inspect and curate all departments, manage users, and upload videos.`;
    } else if (u.permission_level === 'Highly Confidential') {
      bannerPermDesc.innerHTML = `Showing authorized <b>Highly Confidential</b> research for <b>${u.department}</b> & company-wide standard videos. (Upload & Admin Menu: Disabled).`;
    } else if (u.permission_level === 'Restricted') {
      bannerPermDesc.innerHTML = `Showing authorized <b>Restricted</b> assets for <b>${u.department}</b> & company-wide standard videos. (Upload & Admin Menu: Disabled).`;
    } else {
      bannerPermDesc.innerHTML = `Standard Employee Access: Showing company-wide knowledge assets. (Confidential R&D is restricted to authorized persons).`;
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



// ---------------- PROFILE & SETTINGS MODAL ----------------

function openProfileModal(tab = 'overview') {
  renderCurrentUserUI();
  if (tab === 'help' || tab === 'profile') tab = 'overview';
  switchProfileTab(tab);
  const modal = document.getElementById('profileModal');
  if (modal) modal.classList.remove('hidden');
}

function closeProfileModal() {
  const modal = document.getElementById('profileModal');
  if (modal) modal.classList.add('hidden');
}

function switchProfileTab(tabName) {
  const tabs = ['overview', 'preferences'];
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

// ---------------- DEDICATED LOGIN & LOGOUT SYSTEM ----------------

async function checkAuthSession() {
  const loginScreen = document.getElementById('loginScreen');
  const simulationBar = document.getElementById('simulationControlBar');
  
  if (!state.isLoggedIn) {
    if (loginScreen) loginScreen.classList.remove('hidden');
    if (simulationBar) simulationBar.classList.add('hidden');
    return false;
  } else {
    if (loginScreen) loginScreen.classList.add('hidden');
    if (simulationBar) simulationBar.classList.remove('hidden');
    return true;
  }
}

async function handleLoginFormSubmit(e) {
  if (e) e.preventDefault();
  const username = document.getElementById('loginUsername')?.value.trim();
  const password = document.getElementById('loginPassword')?.value.trim();
  const errorBox = document.getElementById('loginErrorMessage');
  const errorText = document.getElementById('loginErrorText');

  if (!username || !password) {
    if (errorBox && errorText) {
      errorText.textContent = 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน';
      errorBox.classList.remove('hidden');
    }
    return;
  }

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    const json = await res.json();
    if (json.success) {
      state.isLoggedIn = true;
      localStorage.setItem('feedtech_logged_in', 'true');
      state.currentUser = json.data;

      if (errorBox) errorBox.classList.add('hidden');
      const loginScreen = document.getElementById('loginScreen');
      if (loginScreen) loginScreen.classList.add('hidden');
      const simulationBar = document.getElementById('simulationControlBar');
      if (simulationBar) simulationBar.classList.remove('hidden');

      renderCurrentUserUI();
      await loadAccessibleVideos();
      await loadAllVideos();
      
      const isAdmin = (json.data.is_admin === 1 || json.data.role === 'System Administrator');
      if (isAdmin) {
        navigateView('admin-dashboard');
      } else {
        navigateView('home');
      }
      showToast(json.message || `ยินดีต้อนรับ ${json.data.name}`, 'success');
    } else {
      if (errorBox && errorText) {
        errorText.textContent = json.message || 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง';
        errorBox.classList.remove('hidden');
      }
    }
  } catch (err) {
    if (errorBox && errorText) {
      errorText.textContent = 'ไม่สามารถเชื่อมต่อระบบยืนยันตัวตนได้';
      errorBox.classList.remove('hidden');
    }
  }
}

async function quickDemoLogin(role) {
  const usernameInput = document.getElementById('loginUsername');
  const passwordInput = document.getElementById('loginPassword');
  if (role === 'admin') {
    if (usernameInput) usernameInput.value = 'admin';
    if (passwordInput) passwordInput.value = 'admin';
  } else {
    if (usernameInput) usernameInput.value = 'user';
    if (passwordInput) passwordInput.value = 'user';
  }
  await handleLoginFormSubmit();
}

async function handleLogout() {
  try {
    await fetch('/api/auth/logout', { method: 'POST' });
  } catch (e) {
    console.error('Logout error', e);
  }

  state.isLoggedIn = false;
  localStorage.removeItem('feedtech_logged_in');
  
  const loginScreen = document.getElementById('loginScreen');
  if (loginScreen) loginScreen.classList.remove('hidden');
  const simulationBar = document.getElementById('simulationControlBar');
  if (simulationBar) simulationBar.classList.add('hidden');

  closeProfileModal();
  showToast('ออกจากระบบเรียบร้อยแล้ว (Logged out successfully)', 'info');
}



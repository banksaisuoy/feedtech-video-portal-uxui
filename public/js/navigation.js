// ==========================================
// MODULE: NAVIGATION & VIEW ROUTING (navigation.js)
// Screen switcher, sidebar active state, search handlers
// ==========================================

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
    openProfileModal('overview');
    return;
  }
  if (viewName === 'profile') {
    openProfileModal('overview');
    return;
  }

  // Security Gate: Non-admins cannot open admin views
  if (viewName.startsWith('admin') && !isAdmin) {
    showToast(t('accessDenied'), 'error');
    navigateView('home');
    return;
  }

  if (state.activeView !== 'watch' && viewName === 'watch') {
    state.previousView = state.activeView || 'home';
  }

  state.activeView = viewName;
  
  // Hide all view panels
  document.querySelectorAll('.view-content').forEach(el => el.classList.add('hidden'));

  // Deselect all sidebar links
  document.querySelectorAll('.sidebar-link').forEach(el => {
    el.classList.remove('font-bold', 'text-primary', 'bg-primary/10', 'border-primary', 'shadow-xs');
    el.classList.add('text-gray-600', 'font-medium', 'border-transparent');
  });

  // Activate target view
  const target = document.getElementById(`view-${viewName}`);
  if (target) {
    target.classList.remove('hidden');
    const mainContainer = document.getElementById('mainViewContainer');
    if (mainContainer) mainContainer.scrollTop = 0;
  }

  // Highlight active sidebar item
  const activeNav = document.getElementById(`nav-${viewName}`);
  if (activeNav) {
    activeNav.classList.remove('text-gray-600', 'font-medium', 'border-transparent');
    activeNav.classList.add('font-bold', 'text-primary', 'bg-primary/10', 'border-primary', 'shadow-xs');
  }

  // View specific loaders
  if (viewName === 'admin-dashboard') {
    if (typeof loadAdminDashboard === 'function') loadAdminDashboard();
  }
  if (viewName === 'admin-users') renderUserTable();
  if (viewName === 'admin-tags') {
    loadTags();
    loadCategories();
  }
  if (viewName === 'admin-categories') {
    if (typeof loadCategories === 'function') {
      loadCategories().then(() => {
        if (typeof renderCategoryManagementTable === 'function') renderCategoryManagementTable();
      });
    }
  }
  if (viewName === 'admin-depts') {
    if (typeof loadDepartments === 'function') loadDepartments();
  }
  if (viewName === 'admin-videos') {
    if (typeof loadAllVideos === 'function') {
      loadAllVideos();
    } else {
      renderVideoManagementTable();
    }
  }
  if (viewName === 'admin-events') {
    loadEvents().then(() => renderAdminEventsTable());
  }
  if (viewName === 'admin-upload') renderTagPicker('uploadTagsContainer', 'uploadVideoTags', false);
  if (viewName === 'admin-logs') {
    if (typeof loadAuditLogs === 'function') loadAuditLogs();
  }
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

function goBackFromWatchPage() {
  const vidPlayer = document.getElementById('watchVideoPlayer');
  if (vidPlayer) vidPlayer.pause();
  navigateView(state.previousView || 'home');
}

function togglePortalAdminMode() {
  const u = state.currentUser;
  const isAdmin = u && (u.is_admin === 1 || u.role === 'System Administrator' || u.department === 'Executive');

  if (!isAdmin) {
    showToast(t('regularStaffToast'), 'error');
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



// ---------------- GLOBAL SEARCH ----------------

function handleGlobalSearch(query) {
  state.searchQuery = (query || '').trim();
  if (state.activeView !== 'home') {
    navigateView('home');
  } else {
    renderHomeVideos();
  }
}

function clearGlobalSearch() {
  state.searchQuery = '';
  const input = document.getElementById('globalSearchInput');
  if (input) input.value = '';
  renderHomeVideos();
}
window.clearGlobalSearch = clearGlobalSearch;

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

// ---------------- COLLAPSIBLE MINI SIDEBAR (ICON-ONLY MODE) ----------------

window.initSidebarState = function() {
  const saved = localStorage.getItem('feedtech_sidebar_collapsed');
  if (saved === 'true') {
    setSidebarCollapsed(true);
  }
};

window.toggleSidebarCollapse = function() {
  const sidebar = document.getElementById('mainSidebar');
  if (!sidebar) return;
  const willCollapse = !sidebar.classList.contains('collapsed');
  setSidebarCollapsed(willCollapse);
};

window.setSidebarCollapsed = function(collapsed) {
  const sidebar = document.getElementById('mainSidebar');
  if (!sidebar) return;

  if (collapsed) {
    sidebar.classList.add('collapsed');
    localStorage.setItem('feedtech_sidebar_collapsed', 'true');
  } else {
    sidebar.classList.remove('collapsed');
    localStorage.setItem('feedtech_sidebar_collapsed', 'false');
  }
};

// ---------------- THEME SWITCHER (DARK / LIGHT MODE) ----------------

window.initTheme = function() {
  const savedTheme = localStorage.getItem('feedtech_theme') || 'light';
  applyTheme(savedTheme);
};

window.setPortalTheme = function(theme) {
  applyTheme(theme);
  showToast(theme === 'dark' ? '🌙 สลับเข้าสู่โหมดมืด (Dark Mode)' : '☀️ สลับเข้าสู่โหมดสว่าง (Light Mode)', 'info');
};

window.toggleDarkMode = function() {
  const isDark = document.documentElement.classList.contains('dark');
  const nextTheme = isDark ? 'light' : 'dark';
  applyTheme(nextTheme);
  showToast(nextTheme === 'dark' ? '🌙 เปิดใช้งานโหมดมืด (Dark Mode)' : '☀️ เปิดใช้งานโหมดสว่าง (Light Mode)', 'info');
};

function applyTheme(theme) {
  const isDark = (theme === 'dark');
  if (isDark) {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  } else {
    document.documentElement.classList.remove('dark');
    document.documentElement.classList.add('light');
  }
  localStorage.setItem('feedtech_theme', theme);

  // Sync icon in top navbar
  const icon = document.getElementById('quickThemeIcon');
  if (icon) {
    icon.textContent = isDark ? 'light_mode' : 'dark_mode';
  }

  // Sync select in Profile Preferences
  const prefThemeSelect = document.getElementById('prefThemeSelect');
  if (prefThemeSelect) {
    prefThemeSelect.value = theme;
  }
}



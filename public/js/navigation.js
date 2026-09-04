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
    el.className = 'sidebar-link flex items-center gap-3 px-4 py-2.5 rounded-r-full text-sm font-medium text-gray-600 hover:bg-slate-100/80 transition-all border-l-4 border-transparent';
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
    activeNav.className = 'sidebar-link flex items-center gap-3 px-4 py-2.5 rounded-r-full text-sm font-bold text-primary bg-primary/10 border-l-4 border-primary shadow-xs transition-all';
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
  if (viewName === 'admin-depts') renderAdminDeptTable();
  if (viewName === 'admin-videos') renderVideoManagementTable();
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



// ==========================================
// MODULE: APPLICATION ENTRY POINT (main.js)
// DOMContentLoaded bootstrap and initial data fetching
// ==========================================

async function init() {
  const savedLang = state.currentLanguage || 'en';
  const navSel = document.getElementById('navbarLangSelect');
  if (navSel) navSel.value = savedLang;
  const prefSel = document.getElementById('prefLanguageSelect');
  if (prefSel) prefSel.value = savedLang;

  // Initialize Language in UI
  setPortalLanguage(savedLang);

  // Check Login Status
  const isAuthed = await checkAuthSession();

  // Load baseline core data
  await loadDepartments();
  await loadUsers();
  await loadCurrentUser();
  await loadAccessibleVideos();
  await loadAllVideos();
  await loadCategories();
  await loadTags();
  await loadEvents();

  if (isAuthed) {
    const isAdmin = state.currentUser && (state.currentUser.is_admin === 1 || state.currentUser.role === 'System Administrator');
    navigateView(isAdmin ? 'admin-dashboard' : 'home');
  } else {
    navigateView('home');
  }

  // Wire up Global Escape key for modals & drawer
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeVideoPlayer();
      closeUserModal();
      closeEditDrawer();
      closeTagModal();
      closeCategoryModal();
      closeDeptModal();
      closeProfileModal();
      closeEventModal();
      closePermissionMatrixModal();
      closeCategoryDrilldown();
    }
  });
}

document.addEventListener('DOMContentLoaded', init);

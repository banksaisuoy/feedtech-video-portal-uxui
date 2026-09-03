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

  // Load baseline core data
  await loadDepartments();
  await loadUsers();
  await loadCurrentUser();
  await loadAccessibleVideos();
  await loadAllVideos();
  await loadCategories();
  await loadTags();
  await loadEvents();

  // Set active default view
  navigateView('home');

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

// ==========================================
// MODULE: USER & PBAC GOVERNANCE (tags.js)
// Corporate User accounts, PBAC permission roles, CSV export
// ==========================================

// ---------------- USER ACCOUNT MODAL & MANAGEMENT (PBAC) ----------------

function openAddUserModal() {
  const modalUserId = document.getElementById('modalUserId');
  const userModalTitle = document.getElementById('userModalTitle');
  const modalEmpId = document.getElementById('modalEmpId');
  const modalName = document.getElementById('modalName');
  const modalEmail = document.getElementById('modalEmail');
  const modalRole = document.getElementById('modalRole');

  if (modalUserId) modalUserId.value = '';
  if (userModalTitle) userModalTitle.textContent = 'Add New Corporate User';
  if (modalEmpId) modalEmpId.value = '';
  if (modalName) modalName.value = '';
  if (modalEmail) modalEmail.value = '';
  if (modalRole) modalRole.value = 'User';

  // Populate department options
  const modalDept = document.getElementById('modalDept');
  const depts = state.departments && state.departments.length > 0 ? state.departments : [
    { name: 'Biotech' }, { name: 'Swine' }, { name: 'Aquatic' }, { name: 'Conference' },
    { name: 'Dairy' }, { name: 'Dairy Process' }, { name: 'Extension Research' }, { name: 'Nutrition' },
    { name: 'Oversea' }, { name: 'Premix' }, { name: 'Poultry' }, { name: 'Raw Material' },
    { name: 'Ruminant' }, { name: 'Ruminant Pakthongchai' }, { name: 'Supplier' }, { name: 'QC-Lab' }, { name: 'China' }
  ];
  if (modalDept) {
    modalDept.innerHTML = depts.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
    modalDept.value = depts[0]?.name || 'Biotech';
  }

  const execBoardCheck = document.getElementById('modalUserIsExecBoard');
  if (execBoardCheck) execBoardCheck.checked = false;

  const roleSelect = document.getElementById('modalRoleSelect');
  if (roleSelect) roleSelect.value = 'User';

  const levelEl = document.getElementById('modalLevel');
  if (levelEl) levelEl.value = 'Standard';

  const modal = document.getElementById('userModal');
  if (modal) modal.classList.remove('hidden');
}

function editUserPrompt(userId) {
  const u = (state.users || []).find(x => x.id === userId);
  if (!u) return;
  const isAdmin = (u.is_admin === 1 || u.role === 'Admin');

  const modalUserId = document.getElementById('modalUserId');
  const userModalTitle = document.getElementById('userModalTitle');
  const modalEmpId = document.getElementById('modalEmpId');
  const modalName = document.getElementById('modalName');
  const modalEmail = document.getElementById('modalEmail');
  const modalRole = document.getElementById('modalRole');

  if (modalUserId) modalUserId.value = u.id;
  if (userModalTitle) userModalTitle.textContent = `Edit User: ${u.name}`;
  if (modalEmpId) modalEmpId.value = u.emp_id || '';
  if (modalName) modalName.value = u.name;
  if (modalEmail) modalEmail.value = u.email;
  if (modalRole) modalRole.value = isAdmin ? 'Admin' : 'User';

  // Populate department options
  const modalDept = document.getElementById('modalDept');
  const depts = state.departments && state.departments.length > 0 ? state.departments : [
    { name: 'Biotech' }, { name: 'Swine' }, { name: 'Aquatic' }, { name: 'Conference' },
    { name: 'Dairy' }, { name: 'Dairy Process' }, { name: 'Extension Research' }, { name: 'Nutrition' },
    { name: 'Oversea' }, { name: 'Premix' }, { name: 'Poultry' }, { name: 'Raw Material' },
    { name: 'Ruminant' }, { name: 'Ruminant Pakthongchai' }, { name: 'Supplier' }, { name: 'QC-Lab' }, { name: 'China' }
  ];
  if (modalDept) {
    modalDept.innerHTML = depts.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
    modalDept.value = u.department || depts[0]?.name;
  }

  const execBoardCheck = document.getElementById('modalUserIsExecBoard');
  if (execBoardCheck) {
    execBoardCheck.checked = (u.is_executive_board === 1 || u.department === 'Executive Board');
  }

  const roleSelect = document.getElementById('modalRoleSelect');
  if (roleSelect) {
    roleSelect.value = isAdmin ? 'Admin' : 'User';
  }

  const levelEl = document.getElementById('modalLevel');
  if (levelEl) levelEl.value = u.permission_level || (isAdmin ? 'Highly Confidential' : 'Standard');

  const modal = document.getElementById('userModal');
  if (modal) modal.classList.remove('hidden');
}

function closeUserModal() {
  const modal = document.getElementById('userModal');
  if (modal) modal.classList.add('hidden');
}

async function saveUserModalSubmit() {
  const id = document.getElementById('modalUserId')?.value;
  const name = document.getElementById('modalName')?.value.trim();
  const email = document.getElementById('modalEmail')?.value.trim();
  const department = document.getElementById('modalDept')?.value || 'General';
  const is_executive_board = document.getElementById('modalUserIsExecBoard')?.checked ? 1 : 0;
  const roleSelect = document.getElementById('modalRoleSelect')?.value || 'User';
  const isAdmin = (roleSelect === 'Admin' || roleSelect === 'admin');
  const role = isAdmin ? 'Admin' : 'User';
  const allowed_tags = '*';
  const permission_level = isAdmin ? 'Highly Confidential' : 'Standard';
  const emp_id = document.getElementById('modalEmpId')?.value.trim() || '';

  if (!name || !email) {
    showToast('Please specify Name and Email', 'error');
    return;
  }

  try {
    let res;
    if (id) {
      res = await fetch(`/api/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, department, role, allowed_tags, permission_level, is_admin: isAdmin ? 1 : 0, is_executive_board })
      });
    } else {
      res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emp_id, name, email, department, role, allowed_tags, permission_level, is_admin: isAdmin ? 1 : 0, is_executive_board })
      });
    }

    const json = await res.json();
    if (json.success) {
      closeUserModal();
      await loadUsers();
      await loadAccessibleVideos();
      showToast(id ? 'User updated successfully' : 'User created successfully', 'success');
    } else {
      showToast('Error: ' + json.message, 'error');
    }
  } catch (err) {
    showToast('Failed to save user', 'error');
  }
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
  let csv = 'User ID,Full Name,Email,Department,Role,Permission Level,Status\n';
  (state.users || []).forEach(u => {
    csv += `"${formatUserId(u.emp_id, u.id)}","${u.name || ''}","${u.email || ''}","${u.department || ''}","${u.role || ''}","${u.permission_level || ''}","${u.status || ''}"\n`;
  });
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `Feedtech_Users_Export_${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  showToast('Exported users to CSV file', 'success');
}

function openImportExcelModal() {
  showToast('Excel Bulk Import: Ready for Feedtech XLSX template', 'info');
}

// ---------------- BACKWARD COMPATIBILITY STUBS (PBAC Transition) ----------------

async function loadTags() {
  state.tags = [];
}

function closeTagModal() {}
function renderTagPicker() {}
function toggleTagInPicker() {}
function selectAllTagsInPicker() {}
function clearTagsInPicker() {}
function addCustomTagToPicker() {}
function renderTagTable() {}
function filterTagTable() {}
function openAddTagModal() {}
function editTagPrompt() {}
async function saveTagModalSubmit() {}
async function deleteTagPrompt() {}
function renderCategorySubcategoryPills() {}
function openAddTagForCategory() {}
async function handleQuickAddTag() {}

function handleTagSearch(term) {
  const clean = (term || '').replace(/^#/, '');
  const searchInput = document.getElementById('globalSearchInput');
  if (searchInput) searchInput.value = clean;
  if (typeof handleGlobalSearch === 'function') handleGlobalSearch(clean);
}

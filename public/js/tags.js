// ==========================================
// MODULE: TAGS & SUBCATEGORIES MANAGEMENT (tags.js)
// Taxonomy management, quick add/delete tags, subcategory groupings, tag picker
// ==========================================

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
          <span>* (All Access - Full Company Permissions)</span>
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
  const headers = ['Employee ID', 'Name', 'Email', 'Department', 'Allowed Tags', 'Access Role', 'Status'];
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
      renderCategorySubcategoryPills();
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


function renderCategorySubcategoryPills() {
  const container = document.getElementById('categorySubcategoryPillsContainer');
  if (!container || !state.tags) return;

  // Group tags by department/category
  const groups = {};
  state.tags.forEach(t => {
    const dept = t.department || 'General';
    if (!groups[dept]) groups[dept] = [];
    groups[dept].push(t);
  });

  const deptIcons = {
    'Biotech': 'biotech',
    'Swine': 'pets',
    'QC-Lab': 'science',
    'Operations': 'precision_manufacturing',
    'Poultry': 'egg',
    'Aquatic': 'water_drop',
    'Executive': 'corporate_fare',
    'General': 'label'
  };

  const html = Object.entries(groups).map(([dept, tags]) => {
    const icon = deptIcons[dept] || 'folder';
    return `
      <div class="p-3.5 bg-slate-50 border border-outline-variant rounded-xl flex flex-col justify-between hover:border-primary/40 transition-all shadow-xs">
        <div>
          <div class="flex items-center justify-between pb-2 border-b border-slate-200/60 mb-2">
            <span class="font-bold text-gray-800 text-xs flex items-center gap-1.5">
              <span class="material-symbols-outlined text-primary text-sm">${icon}</span>
              <span>${dept}</span>
            </span>
            <span class="text-[10px] bg-slate-200 text-gray-700 px-1.5 py-0.5 rounded font-bold">${tags.length} subcategories</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            ${tags.map(t => `
              <button onclick="handleTagSearch('${t.name}')" class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-mono font-semibold bg-white text-gray-700 border border-outline-variant hover:bg-emerald-50 hover:text-primary hover:border-primary/30 transition-all shadow-2xs" title="Click to search videos tagged ${t.name}">
                <span>${t.name}</span>
                <span class="text-[9px] text-gray-400">(${t.video_count || 0})</span>
              </button>
            `).join('')}
          </div>
        </div>
        <div class="pt-2.5 mt-2 border-t border-slate-100 flex justify-end">
          <button onclick="openAddTagForCategory('${dept}')" class="text-[10px] font-bold text-primary hover:underline flex items-center gap-0.5">
            <span class="material-symbols-outlined text-xs">add</span> Add to ${dept}
          </button>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = html;
}

function openAddTagForCategory(deptName) {
  openAddTagModal();
  const deptSelect = document.getElementById('modalTagDept');
  if (deptSelect) deptSelect.value = deptName;
}

async function handleQuickAddTag() {
  const input = document.getElementById('quickTagName');
  const deptSelect = document.getElementById('quickTagDept');
  const clearSelect = document.getElementById('quickTagClearance');
  if (!input) return;

  let name = input.value.trim();
  if (!name) {
    showToast('Please specify tag name (e.g. #vaccine)', 'error');
    input.focus();
    return;
  }
  if (!name.startsWith('#')) {
    name = '#' + name;
  }

  const department = deptSelect ? deptSelect.value : 'General';
  const clearance_level = clearSelect ? clearSelect.value : 'Standard';

  try {
    const res = await fetch('/api/tags', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        department,
        clearance_level,
        description: `Subcategory under ${department} for video categorization and search.`
      })
    });
    const json = await res.json();
    if (json.success) {
      input.value = '';
      await loadTags();
      await loadAccessibleVideos();
      showToast(`Tag ${name} added under ${department} successfully!`, 'success');
    } else {
      showToast('Error: ' + json.message, 'error');
    }
  } catch (err) {
    showToast('Failed to add tag', 'error');
  }
}

function renderTagTable() {
  const tbody = document.getElementById('tagTableBody');
  if (!tbody) return;

  const search = (document.getElementById('tagSearchInput')?.value || '').toLowerCase().trim();
  const clearanceFilter = document.getElementById('tagClearanceFilter')?.value || '';
  const categoryFilter = document.getElementById('tagCategoryFilter')?.value || '';

  const filtered = state.tags.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search) || (t.description && t.description.toLowerCase().includes(search)) || (t.department && t.department.toLowerCase().includes(search));
    const matchClearance = !clearanceFilter || t.clearance_level === clearanceFilter;
    const matchCategory = !categoryFilter || t.department === categoryFilter;
    return matchSearch && matchClearance && matchCategory;
  });

  if (filtered.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" class="py-8 text-center text-gray-400 italic">No tags match the search or category filter.</td></tr>`;
    return;
  }

  tbody.innerHTML = filtered.map(t => {
    const isConf = t.clearance_level === 'Highly Confidential';
    const isRest = t.clearance_level === 'Restricted';
    const tagBadgeColor = isConf ? 'bg-rose-50 text-rose-800 border-rose-200' : (isRest ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-emerald-50 text-emerald-800 border-emerald-200');

    return `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="py-3 px-5 font-mono font-bold">
          <button onclick="handleTagSearch('${t.name}')" class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs border ${tagBadgeColor} hover:scale-105 transition-transform" title="Click to search videos tagged ${t.name}">
            <span class="material-symbols-outlined text-[13px]">sell</span>
            <span>${t.name}</span>
          </button>
        </td>
        <td class="py-3 px-5">
          <span class="inline-flex items-center gap-1.5 font-bold text-gray-800 text-xs">
            <span class="material-symbols-outlined text-sm text-primary">folder</span>
            <span>${t.department}</span>
          </span>
        </td>
        <td class="py-3 px-5">${getPermissionBadgeMarkup(t.clearance_level)}</td>
        <td class="py-3 px-5 text-center">
          <button onclick="handleTagSearch('${t.name}')" class="inline-flex items-center gap-1 font-bold text-primary hover:underline" title="Search all videos with this tag">
            <span class="material-symbols-outlined text-xs">search</span>
            <span>${t.video_count || 0} videos</span>
          </button>
        </td>
        <td class="py-3 px-5 text-center font-bold text-gray-700">${t.user_count || 0} users</td>
        <td class="py-3 px-5 text-gray-500 max-w-xs truncate" title="${t.description || ''}">${t.description || '-'}</td>
        <td class="py-3 px-5 text-right space-x-1">
          <button onclick="editTagPrompt(${t.id})" class="p-1.5 text-gray-400 hover:text-primary rounded-md hover:bg-slate-100 transition-colors" title="Edit Tag">
            <span class="material-symbols-outlined text-sm">edit</span>
          </button>
          <button onclick="deleteTagPrompt(${t.id})" class="p-1.5 text-gray-400 hover:text-rose-600 rounded-md hover:bg-rose-50 transition-colors" title="Delete Tag (${t.name})">
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
  document.getElementById('tagModalTitle').textContent = 'Add New Tag / Subcategory';
  document.getElementById('modalTagId').value = '';
  document.getElementById('modalTagName').value = '';
  document.getElementById('modalTagClearance').value = 'Standard';
  document.getElementById('modalTagDesc').value = '';

  const deptSel = document.getElementById('modalTagDept');
  if (deptSel) {
    const cats = ['Biotech', 'Swine', 'QC-Lab', 'Operations', 'Poultry', 'Aquatic', 'Executive', 'General'];
    deptSel.innerHTML = cats.map(c => `<option value="${c}">${c}</option>`).join('');
  }

  document.getElementById('tagModal').classList.remove('hidden');
}

function editTagPrompt(tagId) {
  const tag = state.tags.find(t => t.id === tagId);
  if (!tag) return;

  document.getElementById('tagModalTitle').textContent = 'Edit Security Tag Access Scope';
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



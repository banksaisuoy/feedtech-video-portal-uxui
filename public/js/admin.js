// ==========================================
// MODULE: ADMIN CONSOLE & GOVERNANCE (admin.js)
// User management, video edit drawer, upload hub, access matrix, audit logs, event management
// ==========================================

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
    if (level === 'Admin') {
      list = list.filter(u => u.is_admin === 1 || u.role === 'System Administrator');
    } else if (level === 'User') {
      list = list.filter(u => !u.is_admin && u.role !== 'System Administrator');
    }
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
        <td class="py-3.5 px-5"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${u.is_admin ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}">${u.is_admin ? '🛡️ Administrator' : '👤 Regular Staff'}</span></td>
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
    list = list.filter(v => (v.access_mode || 'public').toLowerCase() === level.toLowerCase());
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
      <td class="py-3 px-4">${getPermissionBadgeMarkup(v)}</td>
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

// PBAC Person Picker Selection State
state.selectedUploadPersons = new Set();
state.selectedDrawerPersons = new Set();

function toggleUploadAccessModeUI(mode) {
  const box = document.getElementById('uploadPersonSelectorBox');
  if (!box) return;
  if (mode === 'public') {
    box.classList.add('hidden');
  } else {
    box.classList.remove('hidden');
    const title = document.getElementById('uploadPersonBoxTitle');
    if (title) {
      title.textContent = mode === 'include' 
        ? '👥 Select Authorized Members (Include Whitelist):' 
        : '🚫 Select Excluded Members (Exclude Blacklist):';
    }
    renderUploadPersonList();
  }
}

function renderUploadPersonList(filter = '') {
  const container = document.getElementById('uploadPersonListContainer');
  if (!container) return;

  const q = filter.toLowerCase();
  let users = state.users;
  if (q) {
    users = users.filter(u => u.name.toLowerCase().includes(q) || u.department.toLowerCase().includes(q) || u.role.toLowerCase().includes(q));
  }

  container.innerHTML = users.map(u => {
    const isChecked = state.selectedUploadPersons.has(u.id);
    const isExec = u.department === 'Executive' || u.role.includes('Director') || u.role.includes('Lead');
    return `
      <label class="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs">
        <div class="flex items-center gap-2.5">
          <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleUploadPerson(${u.id})" class="rounded text-primary focus:ring-primary w-4 h-4">
          <div class="w-6 h-6 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style="background-color: ${u.avatar_color || '#10b981'}">
            ${u.name.substring(0, 1)}
          </div>
          <div>
            <div class="font-bold text-gray-900 flex items-center gap-1.5">
              <span>${u.name}</span>
              ${isExec ? '<span class="px-1.5 py-0.2 bg-purple-100 text-purple-700 font-extrabold rounded text-[9px]">EXEC</span>' : ''}
            </div>
            <div class="text-[10px] text-gray-400">${u.role} • ${u.department}</div>
          </div>
        </div>
        <span class="text-[10px] font-mono text-gray-400">${u.emp_id || 'ID-' + u.id}</span>
      </label>
    `;
  }).join('');

  const countText = document.getElementById('uploadSelectedPersonsCountText');
  if (countText) countText.textContent = `Selected: ${state.selectedUploadPersons.size} persons`;
}

function filterUploadPersonList(q) {
  renderUploadPersonList(q);
}

function toggleUploadPerson(id) {
  if (state.selectedUploadPersons.has(id)) {
    state.selectedUploadPersons.delete(id);
  } else {
    state.selectedUploadPersons.add(id);
  }
  const countText = document.getElementById('uploadSelectedPersonsCountText');
  if (countText) countText.textContent = `Selected: ${state.selectedUploadPersons.size} persons`;
}

function selectVipPresetForUpload() {
  state.selectedUploadPersons.clear();
  state.users.forEach(u => {
    if (u.department === 'Executive' || u.role.includes('Director') || u.role.includes('Lead') || u.is_admin === 1) {
      state.selectedUploadPersons.add(u.id);
    }
  });
  renderUploadPersonList();
  showToast('Executive Board & R&D Lead members selected', 'info');
}

function clearUploadPersons() {
  state.selectedUploadPersons.clear();
  renderUploadPersonList();
}

function toggleDrawerAccessModeUI(mode) {
  const box = document.getElementById('drawerPersonSelectorBox');
  if (!box) return;
  if (mode === 'public') {
    box.classList.add('hidden');
  } else {
    box.classList.remove('hidden');
    const title = document.getElementById('drawerPersonBoxTitle');
    if (title) {
      title.textContent = mode === 'include'
        ? '👥 Manage Whitelisted Members (Include):'
        : '🚫 Manage Excluded Members (Exclude):';
    }
    renderDrawerPersonList();
  }
}

function renderDrawerPersonList(filter = '') {
  const container = document.getElementById('drawerPersonListContainer');
  if (!container) return;

  const q = filter.toLowerCase();
  let users = state.users;
  if (q) {
    users = users.filter(u => u.name.toLowerCase().includes(q) || u.department.toLowerCase().includes(q) || u.role.toLowerCase().includes(q));
  }

  container.innerHTML = users.map(u => {
    const isChecked = state.selectedDrawerPersons.has(u.id);
    const isExec = u.department === 'Executive' || u.role.includes('Director') || u.role.includes('Lead');
    return `
      <label class="flex items-center justify-between p-1.5 rounded hover:bg-slate-50 cursor-pointer text-xs">
        <div class="flex items-center gap-2">
          <input type="checkbox" ${isChecked ? 'checked' : ''} onchange="toggleDrawerPerson(${u.id})" class="rounded text-primary focus:ring-primary w-3.5 h-3.5">
          <div class="w-5 h-5 rounded-full flex items-center justify-center text-white text-[9px] font-bold" style="background-color: ${u.avatar_color || '#10b981'}">
            ${u.name.substring(0, 1)}
          </div>
          <div>
            <div class="font-bold text-gray-900 flex items-center gap-1">
              <span>${u.name}</span>
              ${isExec ? '<span class="px-1 py-0.1 bg-purple-100 text-purple-700 font-extrabold rounded text-[8px]">EXEC</span>' : ''}
            </div>
            <div class="text-[9px] text-gray-400">${u.role}</div>
          </div>
        </div>
      </label>
    `;
  }).join('');

  const countText = document.getElementById('drawerSelectedPersonsCountText');
  if (countText) countText.textContent = `Selected: ${state.selectedDrawerPersons.size} persons`;
}

function filterDrawerPersonList(q) {
  renderDrawerPersonList(q);
}

function toggleDrawerPerson(id) {
  if (state.selectedDrawerPersons.has(id)) {
    state.selectedDrawerPersons.delete(id);
  } else {
    state.selectedDrawerPersons.add(id);
  }
  const countText = document.getElementById('drawerSelectedPersonsCountText');
  if (countText) countText.textContent = `Selected: ${state.selectedDrawerPersons.size} persons`;
}

function selectVipPresetForDrawer() {
  state.selectedDrawerPersons.clear();
  state.users.forEach(u => {
    if (u.department === 'Executive' || u.role.includes('Director') || u.role.includes('Lead') || u.is_admin === 1) {
      state.selectedDrawerPersons.add(u.id);
    }
  });
  renderDrawerPersonList();
  showToast('Executive Board & R&D Lead members selected in drawer', 'info');
}

function clearDrawerPersons() {
  state.selectedDrawerPersons.clear();
  renderDrawerPersonList();
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
  if (document.getElementById('editDrawerCategory')) {
    document.getElementById('editDrawerCategory').value = v.category || 'Research & Whitepaper';
  }
  document.getElementById('editDrawerTags').value = v.tags || '';
  document.getElementById('editDrawerIsHidden').checked = (v.is_hidden === 1);
  renderTagPicker('editDrawerTagsContainer', 'editDrawerTags', false);

  // Set Access Mode and populate Person Picker in Drawer
  const accessMode = (v.access_mode || 'public').toLowerCase();
  const radios = document.getElementsByName('drawerAccessMode');
  for (const r of radios) {
    r.checked = (r.value === accessMode);
  }

  state.selectedDrawerPersons.clear();
  let ids = [];
  try {
    if (accessMode === 'include') ids = JSON.parse(v.allowed_user_ids || '[]');
    else if (accessMode === 'exclude') ids = JSON.parse(v.excluded_user_ids || '[]');
  } catch (e) {}
  ids.forEach(id => state.selectedDrawerPersons.add(Number(id)));

  toggleDrawerAccessModeUI(accessMode);

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
  const category = document.getElementById('editDrawerCategory')?.value || department;
  const tags = document.getElementById('editDrawerTags').value.trim();
  const is_hidden = document.getElementById('editDrawerIsHidden').checked ? 1 : 0;

  let access_mode = 'public';
  const radios = document.getElementsByName('drawerAccessMode');
  for (const r of radios) {
    if (r.checked) {
      access_mode = r.value;
      break;
    }
  }

  const selectedArray = Array.from(state.selectedDrawerPersons);
  const allowed_user_ids = access_mode === 'include' ? selectedArray : [];
  const excluded_user_ids = access_mode === 'exclude' ? selectedArray : [];

  try {
    const res = await fetch(`/api/videos/${videoId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        title, 
        description, 
        department, 
        category,
        tags, 
        is_hidden,
        access_mode,
        allowed_user_ids,
        excluded_user_ids
      })
    });
    const json = await res.json();
    if (json.success) {
      closeEditDrawer();
      await loadAllVideos();
      await loadAccessibleVideos();
      showToast(`Video access permissions saved (${access_mode.toUpperCase()})`, 'success');
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
  const category = document.getElementById('uploadVideoCategory')?.value || 'Research & Whitepaper';
  const duration = document.getElementById('uploadVideoDuration')?.value?.trim() || '10:00';
  const tags = document.getElementById('uploadVideoTags').value.trim();

  let access_mode = 'public';
  const radios = document.getElementsByName('uploadAccessMode');
  for (const r of radios) {
    if (r.checked) {
      access_mode = r.value;
      break;
    }
  }

  const selectedArray = Array.from(state.selectedUploadPersons);
  const allowed_user_ids = access_mode === 'include' ? selectedArray : [];
  const excluded_user_ids = access_mode === 'exclude' ? selectedArray : [];

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
        category,
        duration,
        tags,
        video_url,
        access_mode,
        allowed_user_ids,
        excluded_user_ids
      })
    });
    const json = await res.json();
    if (json.success) {
      // Clear form
      document.getElementById('uploadVideoUrl').value = '';
      document.getElementById('uploadVideoTitle').value = '';
      document.getElementById('uploadVideoDesc').value = '';
      clearUploadPersons();

      await loadAllVideos();
      await loadAccessibleVideos();
      navigateView('admin-videos');
      showToast(`Video uploaded with ${access_mode.toUpperCase()} permissions!`, 'success');
    } else {
      showToast(json.message || 'Upload failed', 'error');
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
          <th class="py-3 px-4">Department & Access Role</th>
          <th class="py-3 px-4">Role / Permissions</th>
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
                    <span class="material-symbols-outlined text-xs">admin_panel_settings</span> Administrator (Full Access)
                  </span>
                ` : `
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                    <span class="material-symbols-outlined text-xs">visibility</span> Staff (View Only)
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


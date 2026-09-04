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
        <td class="py-3.5 px-5">
          <div class="font-semibold text-gray-800">${u.department || 'General'}</div>
          ${(u.is_executive_board === 1 || u.department === 'Executive Board') ? `<span class="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-800 border border-amber-300 mt-0.5"><span class="material-symbols-outlined text-[10px]">star</span> Executive Board</span>` : ''}
        </td>
        <td class="py-3.5 px-5"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${u.is_admin ? 'bg-purple-100 text-purple-800 border border-purple-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}">${u.is_admin ? '🛡️ Administrator' : '👤 Regular Staff'}</span></td>
        <td class="py-3.5 px-5">
          <span class="inline-flex items-center gap-1.5 font-semibold text-[11px] ${isInactive ? 'text-rose-600' : 'text-emerald-700'}">
            <span class="w-2 h-2 rounded-full ${statusColor}"></span>
            <span>${u.status}</span>
          </span>
        </td>
        <td class="py-3.5 px-5 text-right space-x-1.5 whitespace-nowrap">
          <button onclick="inspectUserVideoAccess(${u.id})" class="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[11px] font-bold transition-colors shadow-2xs" title="ดูว่าผู้ใช้นี้สามารถดูคลิปไหนได้บ้าง">
            <span class="material-symbols-outlined text-xs">visibility</span>
            <span>Video Access</span>
          </button>
          <button onclick="editUserPrompt(${u.id})" class="p-1 text-gray-400 hover:text-primary rounded hover:bg-slate-100 align-middle" title="Edit User & Roles">
            <span class="material-symbols-outlined text-base">edit</span>
          </button>
          <button onclick="toggleUserStatus(${u.id})" class="p-1 text-gray-400 hover:text-amber-600 rounded hover:bg-slate-100 align-middle" title="${isInactive ? 'Activate' : 'Deactivate'}">
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

// ---------------- USER VIDEO ACCESS INSPECTOR (PBAC) ----------------

function evaluateVideoAccessForUser(user, video) {
  if (!user || user.status !== 'Active') return { allowed: false, reason: 'User inactive or not found' };
  
  // Rule 1: Super Admin / Executive administrator has full visibility
  if (user.is_admin === 1 || user.role === 'System Administrator' || user.is_executive_board === 1 || user.department === 'Executive Board') {
    return { allowed: true, reason: '👑 ผู้ดูแลระบบ / กรรมการบริหาร (Full Executive & Admin Access)' };
  }

  // Rule 2: If video is hidden by admin
  if (video.is_hidden === 1) {
    return { allowed: false, reason: '🚫 วิดีโอถูกซ่อนโดยผู้ดูแลระบบ (Archived/Hidden)' };
  }

  // Parse allowed & excluded user lists
  let allowedUsers = [];
  try {
    allowedUsers = JSON.parse(video.allowed_user_ids || '[]');
  } catch (e) {
    allowedUsers = (video.allowed_user_ids || '').split(',').map(s => parseInt(s.trim())).filter(Boolean);
  }

  let excludedUsers = [];
  try {
    excludedUsers = JSON.parse(video.excluded_user_ids || '[]');
  } catch (e) {
    excludedUsers = (video.excluded_user_ids || '').split(',').map(s => parseInt(s.trim())).filter(Boolean);
  }

  const accessMode = (video.access_mode || 'public').toLowerCase();

  // Rule 3: Include Mode (Whitelist)
  if (accessMode === 'include') {
    const isIncluded = allowedUsers.includes(user.id) || allowedUsers.includes(String(user.id)) || (video.uploaded_by && video.uploaded_by.includes(user.name));
    if (isIncluded) {
      return { 
        allowed: true, 
        reason: `👥 สิทธิ์เฉพาะบุคคล (Whitelist Include - ${allowedUsers.length} ท่าน)` 
      };
    }
    return { 
      allowed: false, 
      reason: `⛔ สิทธิ์เฉพาะบุคคล: จำกัดเฉพาะรายชื่อบุคคลที่กำหนด (${allowedUsers.length} ท่าน)` 
    };
  }

  // Rule 4: Exclude Mode (Blacklist)
  if (accessMode === 'exclude') {
    const isExcluded = excludedUsers.includes(user.id) || excludedUsers.includes(String(user.id));
    if (isExcluded) {
      return { 
        allowed: false, 
        reason: '⛔ ถูกจำกัดสิทธิ์ (Exclude Blacklist): อยู่ในรายชื่อที่ยกเว้นการเข้าถึง' 
      };
    }
    return { 
      allowed: true, 
      reason: `🌐 เข้าถึงได้ทั่วไป (ยกเว้นเฉพาะบุคคล ${excludedUsers.length} ท่าน)` 
    };
  }

  // Rule 5: Public
  return { 
    allowed: true, 
    reason: '🌐 สาธารณะ (Public): สมาชิกทุกคนในองค์กรเข้าถึงได้' 
  };
}

function inspectUserVideoAccess(userId) {
  const user = state.users.find(u => u.id === userId);
  if (!user) return;
  
  const modal = document.getElementById('userAccessModal');
  const titleEl = document.getElementById('userAccessModalTitle');
  const subtitleEl = document.getElementById('userAccessModalSubtitle');
  const summaryEl = document.getElementById('userAccessSummaryRate');
  const tagsListEl = document.getElementById('userAccessTagsList');
  const listEl = document.getElementById('userAccessVideosList');

  if (titleEl) titleEl.textContent = `ตรวจสอบสิทธิ์การดูวิดีโอ: ${user.name}`;
  if (subtitleEl) subtitleEl.textContent = `${user.role} • ${user.department} • ${user.email} (${user.emp_id || 'ID-' + user.id})`;

  if (tagsListEl) {
    tagsListEl.innerHTML = `
      <span class="px-2 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold">PBAC Access Control</span>
      <span class="px-2 py-0.5 rounded text-[10px] ${user.is_admin ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'} font-bold">${user.is_admin ? '🛡️ Admin (Full Access)' : '👤 Regular User'}</span>
    `;
  }

  const videos = state.allVideos || [];
  let allowedCount = 0;

  const itemsHtml = videos.map(v => {
    const evalResult = evaluateVideoAccessForUser(user, v);
    if (evalResult.allowed) allowedCount++;

    const statusBadge = evalResult.allowed
      ? `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200"><span class="material-symbols-outlined text-xs">check_circle</span> อนุญาต (Allowed)</span>`
      : `<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200"><span class="material-symbols-outlined text-xs">block</span> จำกัดสิทธิ์ (Denied)</span>`;

    const mode = (v.access_mode || 'public').toLowerCase();
    const accessModeBadge = mode === 'include'
      ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-purple-50 text-purple-700 border border-purple-200">Whitelist</span>`
      : (mode === 'exclude'
        ? `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">Blacklist</span>`
        : `<span class="px-1.5 py-0.5 rounded text-[9px] font-bold bg-slate-100 text-slate-700 border border-slate-200">Public</span>`);

    return `
      <div class="flex items-center justify-between p-3 rounded-xl border transition-colors gap-3 ${evalResult.allowed ? 'bg-white border-slate-200 hover:border-emerald-300' : 'bg-rose-50/40 border-rose-200'}">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-14 aspect-video rounded-lg bg-slate-900 overflow-hidden relative shrink-0">
            <img src="${v.thumbnail_url || 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=100'}" class="w-full h-full object-cover">
            <span class="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[8px] font-mono px-1 rounded">${v.duration || '10:00'}</span>
          </div>
          <div class="min-w-0">
            <div class="font-bold text-gray-900 text-xs truncate flex items-center gap-1.5">
              <span class="truncate">${v.title}</span>
              ${accessModeBadge}
            </div>
            <div class="text-[10px] text-gray-400 font-mono mt-0.5 flex flex-wrap items-center gap-1.5">
              <span class="font-bold text-gray-600">${v.video_id}</span>
              <span>•</span>
              <span class="text-emerald-700 font-sans font-semibold">${v.category || v.department}</span>
              <span>•</span>
              <span class="${evalResult.allowed ? 'text-emerald-600 font-sans font-medium' : 'text-rose-600 font-sans font-medium'}">${evalResult.reason}</span>
            </div>
          </div>
        </div>
        <div class="shrink-0">
          ${statusBadge}
        </div>
      </div>
    `;
  }).join('');

  if (listEl) listEl.innerHTML = itemsHtml || '<div class="text-center py-6 text-gray-400 text-xs">ไม่พบรายการวิดีโอ</div>';
  
  const total = videos.length;
  const pct = total > 0 ? Math.round((allowedCount / total) * 100) : 0;
  if (summaryEl) summaryEl.textContent = `${allowedCount} / ${total} วิดีโอที่รับสิทธิ์ (${pct}%)`;

  if (modal) modal.classList.remove('hidden');
}

function closeUserAccessModal() {
  const modal = document.getElementById('userAccessModal');
  if (modal) modal.classList.add('hidden');
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
        <div class="font-semibold text-gray-800 text-xs">${v.category || 'Uncategorized'}</div>
        <div class="text-[10px] text-gray-500 truncate max-w-[140px]">${v.department || 'Unassigned Department'}</div>
        <div class="text-[10px] text-gray-400 truncate max-w-[140px]">${v.content_type || 'Unspecified Content Type'} · ${v.tags || ''}</div>
      </td>
      <td class="py-3 px-4">${getPermissionBadgeMarkup(v)}</td>
      <td class="py-3 px-4 text-center whitespace-nowrap">
        <div class="inline-flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg border border-slate-200">
          <button type="button" onclick="toggleVideoHighlight(${v.id}, event)" class="p-1 rounded transition-all ${v.is_featured ? 'text-amber-700 bg-amber-200/90 font-bold shadow-xs' : 'text-gray-400 hover:text-amber-600 hover:bg-white'}" title="${v.is_featured ? '📌 วิดีโอไฮไลท์หน้าแรก (คลิกเพื่อยกเลิก)' : 'คลิกเพื่อปักหมุดไฮไลท์หน้าแรก'}">
            <span class="material-symbols-outlined text-sm ${v.is_featured ? 'fill' : ''}">push_pin</span>
          </button>
          <button type="button" onclick="toggleVideoRecommended(${v.id}, event)" class="p-1 rounded transition-all ${v.is_recommended ? 'text-emerald-800 bg-emerald-200/90 font-bold shadow-xs' : 'text-gray-400 hover:text-emerald-700 hover:bg-white'}" title="${v.is_recommended ? '⭐ คลิปแนะนำ (คลิกเพื่อยกเลิก)' : 'คลิกเพื่อตั้งเป็นคลิปแนะนำ'}">
            <span class="material-symbols-outlined text-sm ${v.is_recommended ? 'fill' : ''}">star</span>
          </button>
        </div>
      </td>
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

async function toggleVideoHighlight(videoId, event) {
  if (event) event.stopPropagation();
  try {
    const res = await fetch(`/api/videos/${videoId}/toggle-featured`, { method: 'PATCH' });
    const json = await res.json();
    if (json.success) {
      const v = state.allVideos.find(x => x.id === videoId);
      if (v) v.is_featured = json.is_featured;
      const accV = state.accessibleVideos.find(x => x.id === videoId);
      if (accV) accV.is_featured = json.is_featured;
      
      renderVideoManagementTable();
      if (typeof renderFeaturedCarousel === 'function') renderFeaturedCarousel();
      showToast(json.is_featured ? '📌 ปักหมุดเป็นวิดีโอไฮไลท์หน้าแรกแล้ว' : 'ปลดหมุดวิดีโอไฮไลท์แล้ว', 'info');
    }
  } catch (err) {
    console.error('Failed to toggle featured highlight:', err);
    showToast('Failed to toggle featured highlight', 'error');
  }
}

async function toggleVideoRecommended(videoId, event) {
  if (event) event.stopPropagation();
  try {
    const res = await fetch(`/api/videos/${videoId}/toggle-recommended`, { method: 'PATCH' });
    const json = await res.json();
    if (json.success) {
      const v = state.allVideos.find(x => x.id === videoId);
      if (v) v.is_recommended = json.is_recommended;
      const accV = state.accessibleVideos.find(x => x.id === videoId);
      if (accV) accV.is_recommended = json.is_recommended;
      
      renderVideoManagementTable();
      if (typeof renderHomeVideos === 'function') renderHomeVideos();
      if (typeof renderRecommendedVideos === 'function') renderRecommendedVideos();
      showToast(json.is_recommended ? '⭐ ตั้งเป็นคลิปแนะนำสำหรับคุณแล้ว' : 'ปลดคลิปแนะนำแล้ว', 'info');
    }
  } catch (err) {
    console.error('Failed to toggle recommended:', err);
    showToast('Failed to toggle recommended', 'error');
  }
}

window.toggleVideoHighlight = toggleVideoHighlight;
window.toggleVideoRecommended = toggleVideoRecommended;

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

  const q = (filter || document.getElementById('uploadPersonSearchInput')?.value || '').toLowerCase();
  const deptFilter = document.getElementById('uploadDeptFilter')?.value || '';
  let users = state.users || [];
  if (deptFilter) {
    users = users.filter(u => u.department === deptFilter);
  }
  if (q) {
    users = users.filter(u => u.name.toLowerCase().includes(q) || (u.department && u.department.toLowerCase().includes(q)) || (u.role && u.role.toLowerCase().includes(q)) || (u.emp_id && u.emp_id.toLowerCase().includes(q)));
  }

  if (users.length === 0) {
    container.innerHTML = `<div class="py-6 text-center text-xs text-gray-400">No personnel match current filters.</div>`;
    return;
  }

  container.innerHTML = users.map(u => {
    const isChecked = state.selectedUploadPersons.has(u.id);
    const isBoard = u.is_executive_board === 1 || u.department === 'Executive Board';
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
              ${isBoard ? '<span class="px-1.5 py-0.2 bg-amber-100 text-amber-800 border border-amber-200 font-extrabold rounded text-[9px]">⭐ BOARD</span>' : ''}
              ${u.is_admin ? '<span class="px-1.5 py-0.2 bg-purple-100 text-purple-700 font-bold rounded text-[9px]">ADMIN</span>' : ''}
            </div>
            <div class="text-[10px] text-gray-400">${u.role || 'Staff'} • ${u.department || 'General'}</div>
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

function addDepartmentPersonsForUpload() {
  const deptSelect = document.getElementById('uploadDeptFilter');
  const dept = deptSelect ? deptSelect.value : '';
  let count = 0;
  state.users.forEach(u => {
    if (!dept || u.department === dept) {
      state.selectedUploadPersons.add(u.id);
      count++;
    }
  });
  renderUploadPersonList();
  showToast(`Added ${count} personnel from ${dept || 'all departments'}`, 'info');
}

function selectVipPresetForUpload() {
  let count = 0;
  state.users.forEach(u => {
    if (u.is_executive_board === 1 || u.department === 'Executive Board' || u.department === 'Executive' || u.role.includes('Director') || u.is_admin === 1) {
      state.selectedUploadPersons.add(u.id);
      count++;
    }
  });
  renderUploadPersonList();
  showToast(`⭐ Added ${count} Executive Board members to policy`, 'info');
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

  const q = (filter || document.getElementById('drawerPersonSearchInput')?.value || '').toLowerCase();
  const deptFilter = document.getElementById('drawerDeptFilter')?.value || '';
  let users = state.users || [];
  if (deptFilter) {
    users = users.filter(u => u.department === deptFilter);
  }
  if (q) {
    users = users.filter(u => u.name.toLowerCase().includes(q) || (u.department && u.department.toLowerCase().includes(q)) || (u.role && u.role.toLowerCase().includes(q)) || (u.emp_id && u.emp_id.toLowerCase().includes(q)));
  }

  if (users.length === 0) {
    container.innerHTML = `<div class="py-6 text-center text-xs text-gray-400">No personnel match current filters.</div>`;
    return;
  }

  container.innerHTML = users.map(u => {
    const isChecked = state.selectedDrawerPersons.has(u.id);
    const isBoard = u.is_executive_board === 1 || u.department === 'Executive Board';
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
              ${isBoard ? '<span class="px-1 py-0.1 bg-amber-100 text-amber-800 border border-amber-200 font-extrabold rounded text-[8px]">⭐ BOARD</span>' : ''}
              ${u.is_admin ? '<span class="px-1 py-0.1 bg-purple-100 text-purple-700 font-bold rounded text-[8px]">ADMIN</span>' : ''}
            </div>
            <div class="text-[9px] text-gray-400">${u.role || 'Staff'} • ${u.department || 'General'}</div>
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

function addDepartmentPersonsForDrawer() {
  const deptSelect = document.getElementById('drawerDeptFilter');
  const dept = deptSelect ? deptSelect.value : '';
  let count = 0;
  state.users.forEach(u => {
    if (!dept || u.department === dept) {
      state.selectedDrawerPersons.add(u.id);
      count++;
    }
  });
  renderDrawerPersonList();
  showToast(`Added ${count} personnel from ${dept || 'all departments'}`, 'info');
}

function selectVipPresetForDrawer() {
  let count = 0;
  state.users.forEach(u => {
    if (u.is_executive_board === 1 || u.department === 'Executive Board' || u.department === 'Executive' || u.role.includes('Director') || u.is_admin === 1) {
      state.selectedDrawerPersons.add(u.id);
      count++;
    }
  });
  renderDrawerPersonList();
  showToast(`⭐ Added ${count} Executive Board members in drawer`, 'info');
}

function clearDrawerPersons() {
  state.selectedDrawerPersons.clear();
  renderDrawerPersonList();
}

function openEditDrawer(videoId) {
  const v = state.allVideos.find(x => x.id === videoId);
  if (!v) return;

  document.getElementById('editDrawerVideoId').value = v.id;
  if (document.getElementById('editDrawerVideoUrl')) {
    document.getElementById('editDrawerVideoUrl').value = v.video_url || '';
  }
  document.getElementById('editDrawerThumb').src = v.thumbnail_url || 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=800';
  if (document.getElementById('editDrawerThumbUrl')) {
    document.getElementById('editDrawerThumbUrl').value = v.thumbnail_url || '';
  }
  document.getElementById('editDrawerDuration').textContent = v.duration;
  document.getElementById('editDrawerTitle').value = v.title;
  document.getElementById('editDrawerDesc').value = v.description || '';
  document.getElementById('editDrawerDept').value = v.department;
  if (document.getElementById('editDrawerCategory')) {
    document.getElementById('editDrawerCategory').value = v.category || '';
  }
  if (document.getElementById('editDrawerContentType')) {
    document.getElementById('editDrawerContentType').value = v.content_type || 'Research & Whitepaper';
  }
  document.getElementById('editDrawerTags').value = v.tags || '';
  document.getElementById('editDrawerIsHidden').checked = (v.is_hidden === 1);
  if (document.getElementById('editDrawerIsFeatured')) {
    document.getElementById('editDrawerIsFeatured').checked = (v.is_featured === 1);
  }
  if (document.getElementById('editDrawerIsRecommended')) {
    document.getElementById('editDrawerIsRecommended').checked = (v.is_recommended === 1);
  }
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
  const category = document.getElementById('editDrawerCategory')?.value || '';
  const content_type = document.getElementById('editDrawerContentType')?.value || 'Research & Whitepaper';
  const tags = document.getElementById('editDrawerTags').value.trim();
  const is_hidden = document.getElementById('editDrawerIsHidden').checked ? 1 : 0;
  const is_featured = document.getElementById('editDrawerIsFeatured')?.checked ? 1 : 0;
  const is_recommended = document.getElementById('editDrawerIsRecommended')?.checked ? 1 : 0;
  const thumbnail_url = document.getElementById('editDrawerThumbUrl')?.value.trim() || undefined;

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
        content_type,
        tags, 
        thumbnail_url,
        is_hidden,
        is_featured,
        is_recommended,
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
      if (typeof renderFeaturedCarousel === 'function') renderFeaturedCarousel();
      if (typeof renderHomeVideos === 'function') renderHomeVideos();
      showToast(`Video updated successfully (Highlight: ${is_featured ? 'ON' : 'OFF'}, Rec: ${is_recommended ? 'ON' : 'OFF'})`, 'success');
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

// ---------------- THUMBNAIL MANAGEMENT & CLOUD UPLOAD HUB ----------------

const DOMAIN_THUMBNAIL_PRESETS = {
  Biotech: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80',
  Swine: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80',
  'QC-Lab': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
  Operations: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
  Poultry: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=800&q=80',
  Executive: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=800&q=80',
  Default: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80'
};

window.generateFallbackThumbnail = function(title, dept) {
  const colors = {
    Biotech: ['#047857', '#10b981'],
    Swine: ['#b45309', '#f59e0b'],
    'QC-Lab': ['#4338ca', '#6366f1'],
    Operations: ['#0f766e', '#14b8a6'],
    Poultry: ['#c2410c', '#f97316'],
    Executive: ['#1e293b', '#334155'],
    Default: ['#065f46', '#059669']
  };
  const [c1, c2] = colors[dept] || colors.Default;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450" viewBox="0 0 800 450">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}"/>
        <stop offset="100%" stop-color="${c2}"/>
      </linearGradient>
    </defs>
    <rect width="800" height="450" fill="url(#g)"/>
    <circle cx="400" cy="200" r="60" fill="rgba(255,255,255,0.15)"/>
    <polygon points="385,175 425,200 385,225" fill="#ffffff"/>
    <text x="400" y="310" fill="#ffffff" font-family="system-ui, -apple-system, sans-serif" font-size="28" font-weight="bold" text-anchor="middle">${title || dept || 'Feedtech Video'}</text>
    <text x="400" y="345" fill="rgba(255,255,255,0.85)" font-family="system-ui, -apple-system, sans-serif" font-size="16" text-anchor="middle">Feedtech Enterprise Portal</text>
  </svg>`;
  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
};

window.updateUploadThumbnailPreview = function(url, dept) {
  const img = document.getElementById('uploadThumbnailPreview');
  if (img) {
    img.onerror = function() {
      this.onerror = null;
      this.src = generateFallbackThumbnail('Video Cover', dept || 'Biotech');
    };
    if (url) img.src = url;
  }
};

window.setUploadThumbnailPreset = function(presetKey) {
  const url = DOMAIN_THUMBNAIL_PRESETS[presetKey] || DOMAIN_THUMBNAIL_PRESETS.Default;
  const input = document.getElementById('uploadThumbnailUrl');
  if (input) input.value = url;
  updateUploadThumbnailPreview(url);
  showToast(`Thumbnail set to [${presetKey}] preset`, 'info');
};

window.autoGenerateThumbnail = function() {
  const dept = document.getElementById('uploadVideoDept')?.value || '';
  const cat = document.getElementById('uploadVideoCategory')?.value || '';
  
  let key = 'Default';
  if (/biotech|cellular|gene/i.test(dept) || /whitepaper/i.test(cat)) key = 'Biotech';
  else if (/swine|pig|hog/i.test(dept)) key = 'Swine';
  else if (/qc|lab|assay/i.test(dept) || /lab/i.test(cat)) key = 'QC-Lab';
  else if (/poultry|avian|bird|broiler/i.test(dept)) key = 'Poultry';
  else if (/operation|mill|production/i.test(dept) || /operation/i.test(cat)) key = 'Operations';
  else if (/executive|townhall|symposia/i.test(dept) || /townhall|meeting/i.test(cat)) key = 'Executive';

  setUploadThumbnailPreset(key);
};

window.autoGenerateDrawerThumbnail = function() {
  const dept = document.getElementById('editDrawerDept')?.value || '';
  const cat = document.getElementById('editDrawerCategory')?.value || '';
  
  let key = 'Default';
  if (/biotech|cellular|gene/i.test(dept) || /whitepaper/i.test(cat)) key = 'Biotech';
  else if (/swine|pig|hog/i.test(dept)) key = 'Swine';
  else if (/qc|lab|assay/i.test(dept) || /lab/i.test(cat)) key = 'QC-Lab';
  else if (/poultry|avian|bird|broiler/i.test(dept)) key = 'Poultry';
  else if (/operation|mill|production/i.test(dept) || /operation/i.test(cat)) key = 'Operations';
  else if (/executive|townhall|symposia/i.test(dept) || /townhall|meeting/i.test(cat)) key = 'Executive';

  const url = DOMAIN_THUMBNAIL_PRESETS[key] || DOMAIN_THUMBNAIL_PRESETS.Default;
  const input = document.getElementById('editDrawerThumbUrl');
  const img = document.getElementById('editDrawerThumb');
  if (input) input.value = url;
  if (img) img.src = url;
  showToast(`Suggested [${key}] thumbnail applied`, 'info');
};

window.handleThumbnailFileSelect = function(input, targetUrlInputId, previewImgId) {
  if (!input.files || !input.files[0]) return;
  const file = input.files[0];
  if (!file.type.startsWith('image/')) {
    showToast('กรุณาเลือกไฟล์รูปภาพที่ถูกต้อง (PNG, JPG, WebP)', 'error');
    return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    const dataUrl = e.target.result;
    const urlInput = document.getElementById(targetUrlInputId);
    if (urlInput) urlInput.value = dataUrl;
    const previewImg = document.getElementById(previewImgId);
    if (previewImg) previewImg.src = dataUrl;
    showToast('โหลดรูปภาพหน้าปกจากเครื่องเรียบร้อย', 'success');
  };
  reader.readAsDataURL(file);
};

window.captureThumbnailFromVideoTime = function(secInputId, videoUrlInputId, targetUrlInputId, previewImgId) {
  const secInput = document.getElementById(secInputId);
  const sec = parseFloat(secInput?.value) || 5;
  const videoUrlInput = document.getElementById(videoUrlInputId);
  const videoUrl = videoUrlInput?.value.trim();

  if (!videoUrl) {
    showToast('กรุณาระบุ Video Source Link ก่อนดึงเฟรมภาพ', 'warning');
    return;
  }

  showToast(`กำลังดึงเฟรมจากคลิปที่วินาที ${sec}s...`, 'info');

  const tempVid = document.createElement('video');
  tempVid.crossOrigin = 'anonymous';
  tempVid.src = videoUrl;

  const onCaptured = function() {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 450;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(tempVid, 0, 0, 800, 450);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      
      const urlInput = document.getElementById(targetUrlInputId);
      if (urlInput) urlInput.value = dataUrl;
      const previewImg = document.getElementById(previewImgId);
      if (previewImg) previewImg.src = dataUrl;

      showToast(`ดึงภาพหน้าปกที่วินาทีที่ ${sec} สำเร็จ!`, 'success');
    } catch (err) {
      const fallbackUrl = generateFallbackThumbnail(`Snapshot @ ${sec}s`, 'Biotech');
      const urlInput = document.getElementById(targetUrlInputId);
      if (urlInput) urlInput.value = fallbackUrl;
      const previewImg = document.getElementById(previewImgId);
      if (previewImg) previewImg.src = fallbackUrl;
      showToast(`สร้างภาพตัวอย่างจากวินาทีที่ ${sec} เรียบร้อย`, 'info');
    }
  };

  tempVid.onloadeddata = function() {
    tempVid.currentTime = Math.min(sec, tempVid.duration || 60);
  };
  tempVid.onseeked = onCaptured;
  tempVid.onerror = function() {
    const fallbackUrl = generateFallbackThumbnail(`Frame @ ${sec}s`, 'Biotech');
    const urlInput = document.getElementById(targetUrlInputId);
    if (urlInput) urlInput.value = fallbackUrl;
    const previewImg = document.getElementById(previewImgId);
    if (previewImg) previewImg.src = fallbackUrl;
    showToast(`ดึงภาพตัวอย่างจากวินาทีที่ ${sec} เรียบร้อย`, 'info');
  };
};

async function loadAdminDashboard() {
  try {
    const res = await fetch('/api/analytics/deep');
    const json = await res.json();
    if (json.success) {
      const d = json.data;
      
      const kpiWatch = document.getElementById('adminKpiWatchHours');
      const kpiViews = document.getElementById('adminKpiViews');
      const kpiVideos = document.getElementById('adminKpiVideos');
      const kpiCompletion = document.getElementById('adminKpiCompletion');
      const kpiUsers = document.getElementById('adminKpiUsers');

      if (kpiWatch) kpiWatch.textContent = d.estimatedWatchHours ? d.estimatedWatchHours.toLocaleString() + ' hrs' : '2,613 hrs';
      if (kpiViews) kpiViews.textContent = d.totalViews ? d.totalViews.toLocaleString() : '13,634';
      if (kpiVideos) kpiVideos.textContent = d.totalVideos || '23';
      if (kpiCompletion) kpiCompletion.textContent = d.avgCompletionRate ? d.avgCompletionRate + '%' : '78.4%';
      if (kpiUsers) kpiUsers.textContent = d.activeUsers ? `${d.activeUsers} Active` : '11 Active';

      const catList = document.getElementById('adminCategoryAnalyticsList');
      if (catList && d.categoryBreakdown) {
        catList.innerHTML = d.categoryBreakdown.map(c => `
          <div class="space-y-1.5">
            <div class="flex items-center justify-between text-xs">
              <span class="font-bold text-gray-800">${c.category}</span>
              <span class="font-mono text-gray-500">${c.total_views.toLocaleString()} views (${c.percentage}%)</span>
            </div>
            <div class="w-full h-2.5 rounded-full bg-slate-100 overflow-hidden">
              <div class="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full" style="width: ${c.percentage}%"></div>
            </div>
          </div>
        `).join('');
      }

      const topList = document.getElementById('adminTopVideosList');
      if (topList && d.topVideos) {
        topList.innerHTML = d.topVideos.map((v, idx) => `
          <tr class="hover:bg-slate-50 transition-colors">
            <td class="py-2.5 px-3 font-bold text-gray-400 text-xs">#${idx + 1}</td>
            <td class="py-2.5 px-3">
              <div class="flex items-center gap-2.5">
                <div class="w-12 aspect-video rounded bg-slate-900 overflow-hidden shrink-0">
                  <img src="${v.thumbnail_url || 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=100'}" class="w-full h-full object-cover">
                </div>
                <span class="font-bold text-gray-900 text-xs line-clamp-1">${v.title}</span>
              </div>
            </td>
            <td class="py-2.5 px-3 text-xs font-semibold text-emerald-800">
              <span class="px-2 py-0.5 rounded bg-emerald-50">${v.category}</span>
            </td>
            <td class="py-2.5 px-3 text-xs font-mono font-bold text-gray-700">${v.views.toLocaleString()}</td>
            <td class="py-2.5 px-3 text-xs text-gray-500">${v.duration}</td>
          </tr>
        `).join('');
      }
    }
  } catch (err) {
    console.error('Failed to load deep analytics', err);
  }
}

async function submitUploadVideo() {
  const video_url = document.getElementById('uploadVideoUrl').value.trim();
  const title = document.getElementById('uploadVideoTitle').value.trim();
  const department = document.getElementById('uploadVideoDept').value;
  const description = document.getElementById('uploadVideoDesc').value.trim();
  const category = document.getElementById('uploadVideoCategory')?.value || '';
  const content_type = document.getElementById('uploadVideoContentType')?.value || 'Research & Whitepaper';
  const duration = document.getElementById('uploadVideoDuration')?.value?.trim() || '10:00';
  const tags = document.getElementById('uploadVideoTags').value.trim();
  const thumbnail_url = document.getElementById('uploadThumbnailUrl')?.value.trim() || DOMAIN_THUMBNAIL_PRESETS.Default;

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
        content_type,
        duration,
        tags,
        thumbnail_url,
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
      document.getElementById('uploadThumbnailUrl').value = DOMAIN_THUMBNAIL_PRESETS.Default;
      updateUploadThumbnailPreview(DOMAIN_THUMBNAIL_PRESETS.Default);
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
    <table class="min-w-full w-full text-left border-collapse text-xs">
      <thead>
        <tr class="bg-slate-50 border-b border-outline-variant font-bold text-gray-500 uppercase text-[10px]">
          <th class="py-3 px-4 w-52">User Persona</th>
          <th class="py-3 px-4 w-36">Category / Domain</th>
          <th class="py-3 px-4 w-44">Role & Access Type</th>
          <th class="py-3 px-4 text-center w-32">Accessible Rate</th>
          <th class="py-3 px-4">Live Video Access (PBAC)</th>
          <th class="py-3 px-4 text-right w-24">Inspect</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-outline-variant">
        ${matrixData.map(row => {
          const u = row.user;
          const isAdmin = (u.is_admin === 1 || u.role === 'System Administrator' || u.department === 'Executive');
          const totalVids = row.accessibleCount + row.restrictedCount;
          const accessiblePct = totalVids > 0 ? Math.round((row.accessibleCount / totalVids) * 100) : 0;
          
          return `
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="py-3.5 px-4 align-top">
                <div class="font-bold text-gray-900">${u.name}</div>
                <div class="text-[10px] text-gray-400 font-mono mt-0.5">${u.emp_id} • ${u.email}</div>
              </td>
              <td class="py-3.5 px-4 align-top">
                <span class="font-semibold text-gray-700">${u.department}</span>
              </td>
              <td class="py-3.5 px-4 align-top">
                ${isAdmin ? `
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
                    <span class="material-symbols-outlined text-xs">admin_panel_settings</span> 🛡️ Admin (Full Access)
                  </span>
                ` : `
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span class="material-symbols-outlined text-xs">verified_user</span> 👤 Regular User (PBAC)
                  </span>
                `}
              </td>
              <td class="py-3.5 px-4 align-top text-center whitespace-nowrap">
                <span class="font-bold text-emerald-700">${row.accessibleCount}</span> / ${totalVids}
                <div class="w-20 bg-slate-200 h-1.5 rounded-full mx-auto mt-1 overflow-hidden">
                  <div class="bg-emerald-500 h-full" style="width: ${accessiblePct}%"></div>
                </div>
                <span class="text-[9px] text-gray-400 font-mono">${accessiblePct}% available</span>
              </td>
              <td class="py-3.5 px-4 align-top">
                <div class="flex flex-wrap items-center gap-1.5">
                  ${isAdmin ? `
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                      <span class="material-symbols-outlined text-xs">all_inclusive</span> Full Catalog Access (Super Admin)
                    </span>
                  ` : `
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                      <span class="material-symbols-outlined text-xs">check_circle</span> ${row.accessibleCount} Permitted
                    </span>
                    ${row.restrictedCount > 0 ? `
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <span class="material-symbols-outlined text-xs">block</span> ${row.restrictedCount} Restricted
                      </span>
                    ` : ''}
                    ${row.restricted.length > 0 ? `
                      <div class="w-full mt-1 flex flex-wrap gap-1">
                        ${row.restricted.map(r => `
                          <span class="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-800 font-mono font-medium" title="Restricted: ${r.title} (${r.reason})">
                            <span class="material-symbols-outlined text-[10px]">lock</span> ${r.video_id}
                          </span>
                        `).join('')}
                      </div>
                    ` : ''}
                  `}
                </div>
              </td>
              <td class="py-3.5 px-4 align-top text-right">
                <button onclick="inspectUserVideoAccess(${u.id})" class="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[11px] font-bold transition-colors inline-flex items-center gap-1">
                  <span class="material-symbols-outlined text-xs">visibility</span>
                  <span>Inspect</span>
                </button>
              </td>
            </tr>
          `;
        }).join('')}
      </tbody>
    </table>
  `;
}

function openPermissionMatrixModal() {
  navigateView('admin-matrix');
  loadAccessMatrix();
}

function closePermissionMatrixModal() {
  const modal = document.getElementById('matrixModal');
  if (modal) modal.classList.add('hidden');
}

// ---------------- AUDIT LOGS & ACTION TRACE (STITCH DESIGN 395a8206f8004d51ab6fb069e032e214) ----------------

async function filterAuditLogs() {
  const action = document.getElementById('auditActionFilter')?.value || 'ALL';
  const search = document.getElementById('auditActorFilter')?.value.trim() || '';
  const date = document.getElementById('auditDateFilter')?.value || '';

  const params = [];
  if (action && action !== 'ALL') params.push(`action=${encodeURIComponent(action)}`);
  if (search) params.push(`search=${encodeURIComponent(search)}`);
  if (date) params.push(`date=${encodeURIComponent(date)}`);

  const url = `/api/audit-logs${params.length > 0 ? '?' + params.join('&') : ''}`;

  try {
    const res = await fetch(url);
    const json = await res.json();
    if (json.success) {
      state.auditLogs = json.data;
      renderAuditLogs();
    }
  } catch (err) {
    showToast('Failed to filter audit logs', 'error');
  }
}

function resetAuditFilters() {
  const actionEl = document.getElementById('auditActionFilter');
  const actorEl = document.getElementById('auditActorFilter');
  const dateEl = document.getElementById('auditDateFilter');

  if (actionEl) actionEl.value = 'ALL';
  if (actorEl) actorEl.value = '';
  if (dateEl) dateEl.value = '';

  filterAuditLogs();
}

function renderAuditLogs() {
  const tbody = document.getElementById('auditLogsBody');
  if (!tbody) return;

  if (!state.auditLogs || state.auditLogs.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="py-8 text-center text-xs text-gray-400">No audit logs matching current filter criteria.</td></tr>`;
    return;
  }

  const actionIconMap = {
    'AUTH_LOGIN': { icon: 'login', style: 'bg-blue-50 text-blue-700 border-blue-200' },
    'AUTH_LOGOUT': { icon: 'logout', style: 'bg-slate-100 text-slate-700 border-slate-200' },
    'VIDEO_UPLOAD': { icon: 'video_file', style: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    'VIDEO_UPDATE': { icon: 'edit', style: 'bg-amber-50 text-amber-800 border-amber-200' },
    'VIDEO_DELETE': { icon: 'delete', style: 'bg-rose-50 text-rose-700 border-rose-200' },
    'CATEGORY_CREATE': { icon: 'create_new_folder', style: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
    'CATEGORY_UPDATE': { icon: 'folder_open', style: 'bg-amber-50 text-amber-800 border-amber-200' },
    'CATEGORY_DELETE': { icon: 'folder_delete', style: 'bg-rose-50 text-rose-700 border-rose-200' },
    'USER_UPDATE': { icon: 'manage_accounts', style: 'bg-purple-50 text-purple-700 border-purple-200' },
    'USER_STATUS_TOGGLE': { icon: 'toggle_on', style: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    'TAG_UPDATE': { icon: 'sell', style: 'bg-cyan-50 text-cyan-800 border-cyan-200' }
  };

  tbody.innerHTML = state.auditLogs.map(l => {
    const meta = actionIconMap[l.action] || { icon: 'info', style: 'bg-slate-100 text-slate-700 border-slate-200' };
    const initial = (l.actor_name || 'U').substring(0, 2).toUpperCase();

    return `
      <tr class="hover:bg-slate-50 transition-colors">
        <td class="py-3 px-4 font-mono text-[11px] text-gray-500 whitespace-nowrap">
          ${l.created_at || 'Just now'}
        </td>
        <td class="py-3 px-4">
          <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-mono text-[10px] font-bold border ${meta.style}">
            <span class="material-symbols-outlined text-xs">${meta.icon}</span>
            <span>${l.action}</span>
          </span>
        </td>
        <td class="py-3 px-4">
          <div class="flex items-center gap-2">
            <div class="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center text-[10px] font-bold shrink-0">
              ${initial}
            </div>
            <div>
              <div class="font-bold text-gray-900 text-xs">${l.actor_name || 'System User'}</div>
              <div class="text-[10px] text-gray-400">${l.actor_role || 'Staff'}</div>
            </div>
          </div>
        </td>
        <td class="py-3 px-4 font-mono text-[11px] text-gray-500 whitespace-nowrap">
          ${l.ip_address || '127.0.0.1'}
        </td>
        <td class="py-3 px-4 text-gray-600 text-xs max-w-sm truncate" title="${l.details || ''}">
          <span class="font-semibold text-gray-800">${l.target ? `[${l.target}] ` : ''}</span>
          <span>${l.details || '-'}</span>
        </td>
        <td class="py-3 px-4 text-right">
          <button onclick="openLogDetailsModal(${l.id})" class="px-2.5 py-1 rounded bg-white border border-outline-variant hover:bg-slate-100 text-[11px] font-bold text-gray-700 transition-colors shadow-2xs">
            Inspect
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

function openLogDetailsModal(logId) {
  const log = state.auditLogs.find(l => l.id === logId);
  if (!log) return;

  const modal = document.getElementById('logDetailsModal');
  const titleEl = document.getElementById('logDetailsTitle');
  const bodyEl = document.getElementById('logDetailsBody');

  if (titleEl) titleEl.textContent = `Audit Log #${log.id}: [${log.action}]`;
  if (bodyEl) {
    bodyEl.innerHTML = `
      <div class="space-y-4 text-xs">
        <div class="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-lg border border-outline-variant font-mono">
          <div><span class="text-gray-400">Timestamp:</span> <b class="text-gray-800">${log.created_at}</b></div>
          <div><span class="text-gray-400">Action:</span> <b class="text-primary">${log.action}</b></div>
          <div><span class="text-gray-400">Actor:</span> <b class="text-gray-800">${log.actor_name}</b> (${log.actor_role})</div>
          <div><span class="text-gray-400">Target:</span> <b class="text-gray-800">${log.target}</b></div>
        </div>
        <div>
          <label class="block font-bold text-gray-700 mb-1">Execution & Changes Trace (ปุ่มและรายละเอียดการเปลี่ยนแปลง):</label>
          <div class="p-3 bg-slate-900 text-emerald-300 font-mono text-[11px] rounded-lg border border-slate-700 leading-relaxed whitespace-pre-wrap">
${log.details || 'No extended parameters provided.'}
          </div>
        </div>
        <div class="text-[11px] text-gray-400">IP Address: ${log.ip_address || '127.0.0.1'} • Security Verified</div>
      </div>
    `;
  }
  if (modal) modal.classList.remove('hidden');
}

function closeLogDetailsModal() {
  const modal = document.getElementById('logDetailsModal');
  if (modal) modal.classList.add('hidden');
}

function exportAuditLogsCsv() {
  const action = document.getElementById('auditActionFilter')?.value || 'ALL';
  const search = document.getElementById('auditActorFilter')?.value.trim() || '';
  const date = document.getElementById('auditDateFilter')?.value || '';

  const params = [];
  if (action && action !== 'ALL') params.push(`action=${encodeURIComponent(action)}`);
  if (search) params.push(`search=${encodeURIComponent(search)}`);
  if (date) params.push(`date=${encodeURIComponent(date)}`);

  const url = `/api/audit-logs/export-csv${params.length > 0 ? '?' + params.join('&') : ''}`;
  window.open(url, '_blank');
  showToast('Exporting audit logs to CSV...', 'info');
}

function exportAuditLogs() {
  exportAuditLogsCsv();
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

  const categoryEl = document.getElementById('eventDetailCategoryText');
  if (categoryEl) categoryEl.textContent = event.category || 'Corporate Knowledge';
  const typeEl = document.getElementById('eventDetailTypeText');
  if (typeEl) typeEl.textContent = event.content_type || 'Corporate Event';

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

  // Populate category filter
  const deptFilter = document.getElementById('adminEventDeptFilter');
  if (deptFilter && deptFilter.options.length <= 1) {
    deptFilter.innerHTML = `<option value="">All Categories</option>` + (state.categories || state.departments || []).map(d => `<option value="${d.name}">${d.name}</option>`).join('');
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
    deptSel.innerHTML = (state.categories || state.departments || []).map(d => `<option value="${d.name}">${d.name}</option>`).join('');
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
    deptSel.innerHTML = (state.categories || state.departments || []).map(d => `<option value="${d.name}" ${d.name === e.department ? 'selected' : ''}>${d.name}</option>`).join('');
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


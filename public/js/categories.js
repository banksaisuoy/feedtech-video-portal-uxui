// ==========================================
// MODULE: KNOWLEDGE CATEGORIES & DEPARTMENTS (categories.js)
// Categories Hub, Department tables, Video drill-downs, Townhall meetings
// ==========================================

// ---------------- SIDEBAR & DEPARTMENTS ----------------

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
            Videos in this department are restricted to ${deptName} employees or require specific access authorization.
          </p>
        </div>
      `;
    } else {
      grid.innerHTML = deptVideos.map(v => createVideoCardHtml(v)).join('');
    }
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

// ---------------- MANAGE CATEGORIES & PERSONNEL DIRECTORY ----------------

function renderAdminDeptTable() {
  const grid = document.getElementById('adminDeptGrid');
  if (!grid) return;

  // Render categories with personnel list
  grid.innerHTML = state.categories.map(c => {
    // Determine personnel associated with this category based on department / tags
    const associatedUsers = state.users.filter(u => {
      const uTags = (u.allowed_tags || '').toLowerCase();
      const catName = (c.name || '').toLowerCase();
      return u.department.toLowerCase().includes(catName) || 
             catName.includes(u.department.toLowerCase()) || 
             uTags.includes(catName) ||
             (u.is_admin === 1) ||
             (u.department === 'Executive');
    });

    const userAvatars = associatedUsers.slice(0, 4).map(u => `
      <div title="${u.name} (${u.role})" class="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center text-white text-[9px] font-bold shadow-xs shrink-0 -ml-1.5 first:ml-0" style="background-color: ${u.avatar_color || '#10b981'}">
        ${u.name.substring(0, 1)}
      </div>
    `).join('');

    const moreCount = associatedUsers.length > 4 ? `<span class="text-[10px] text-gray-400 font-bold ml-1">+${associatedUsers.length - 4}</span>` : '';

    return `
      <div class="bg-white p-5 rounded-2xl border border-outline-variant shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4">
        <div>
          <div class="flex items-center justify-between mb-3">
            <div class="w-11 h-11 rounded-xl bg-emerald-50 text-primary flex items-center justify-center font-bold">
              <span class="material-symbols-outlined text-2xl">${c.icon || 'category'}</span>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              ${c.video_count || 0} Videos
            </span>
          </div>
          <h3 class="font-bold text-sm text-gray-900">${c.name}</h3>
          <p class="text-xs text-gray-500 mt-1 leading-relaxed">Enterprise taxonomy domain governing curated content and authorized viewer groups.</p>
        </div>

        <!-- Associated Personnel / Members List -->
        <div class="pt-3 border-t border-slate-100 space-y-2">
          <div class="flex items-center justify-between text-[11px]">
            <span class="font-bold text-gray-700 flex items-center gap-1">
              <span class="material-symbols-outlined text-sm text-primary">groups</span>
              <span>Authorized Personnel (${associatedUsers.length}):</span>
            </span>
          </div>
          <div class="flex items-center">
            ${userAvatars}
            ${moreCount}
          </div>
          <div class="text-[10px] text-gray-400 truncate">
            ${associatedUsers.map(u => u.name).slice(0, 3).join(', ')}${associatedUsers.length > 3 ? '...' : ''}
          </div>
        </div>

        <div class="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <button onclick="openCategoryDrilldown('${c.name}')" class="font-bold text-primary hover:underline flex items-center gap-1">
            <span class="material-symbols-outlined text-sm">analytics</span>
            <span>Drill-down Videos</span>
          </button>
          <button onclick="openCategoryDetail('${c.name}')" class="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-gray-700 font-semibold rounded-lg text-[11px]">
            View Hub
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ---------------- CATEGORY VIDEO BREAKDOWN DRILL-DOWN (ADMIN DASHBOARD) ----------------

async function openCategoryDrilldown(catName = 'All') {
  const modal = document.getElementById('categoryDrilldownModal');
  if (!modal) return;

  const titleEl = document.getElementById('drilldownCategoryTitle');
  const badgeEl = document.getElementById('drilldownCategoryBadge');
  const totalVidEl = document.getElementById('drilldownTotalVideos');
  const totalViewsEl = document.getElementById('drilldownTotalViews');
  const tbody = document.getElementById('drilldownTableBody');
  const summaryEl = document.getElementById('drilldownTableSummary');

  if (titleEl) titleEl.textContent = `${catName} Category Video Breakdown`;
  if (badgeEl) badgeEl.textContent = `${catName} Domain`;

  try {
    const res = await fetch(`/api/analytics/category-drilldown/${encodeURIComponent(catName === 'All' ? '' : catName)}`);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    const { total_videos, total_views, videos } = json;
    if (totalVidEl) totalVidEl.textContent = `${total_videos} Videos`;
    if (totalViewsEl) totalViewsEl.textContent = `${(total_views || 0).toLocaleString()} Views`;
    if (summaryEl) summaryEl.textContent = `Showing all ${videos.length} videos in this category`;

    if (tbody) {
      if (videos.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-gray-400">No videos found in this category.</td></tr>`;
      } else {
        tbody.innerHTML = videos.map(v => {
          let modeBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">🌐 Public (All)</span>';
          if (v.access_mode === 'include') {
            const names = (v.allowed_names || []).join(', ') || 'Listed users';
            modeBadge = `<div>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800">👥 Include (${v.allowed_names?.length || 0} persons)</span>
              <div class="text-[10px] text-gray-500 mt-0.5 truncate max-w-xs" title="${names}">Allowed: ${names}</div>
            </div>`;
          } else if (v.access_mode === 'exclude') {
            const names = (v.excluded_names || []).join(', ') || 'Listed users';
            modeBadge = `<div>
              <span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">🚫 Exclude (${v.excluded_names?.length || 0} persons)</span>
              <div class="text-[10px] text-gray-500 mt-0.5 truncate max-w-xs" title="${names}">Excluded: ${names}</div>
            </div>`;
          }

          const viewersCount = (v.viewers || []).length;
          const viewerNames = (v.viewers || []).map(vw => `${vw.name} (${vw.department})`).join(', ') || 'No recorded viewers yet';

          return `
            <tr class="hover:bg-slate-50 transition-colors">
              <td class="py-3 px-4">
                <div class="flex items-center gap-3">
                  <div class="w-14 h-9 rounded bg-slate-900 overflow-hidden relative shrink-0">
                    <img src="${v.thumbnail_url}" class="w-full h-full object-cover">
                  </div>
                  <div>
                    <div class="font-bold text-gray-900 text-xs hover:text-primary cursor-pointer" onclick="closeCategoryDrilldownModal(); openVideoPlayerModal(${v.id})">${v.title}</div>
                    <div class="text-[10px] text-gray-400 font-mono">${v.video_id} • ${v.department}</div>
                  </div>
                </div>
              </td>
              <td class="py-3 px-4 font-mono text-gray-500 text-[11px]">
                <div>${v.duration}</div>
                <div class="text-[10px] text-gray-400">${(v.uploaded_at || '').substring(0, 10)}</div>
              </td>
              <td class="py-3 px-4 text-center">
                <span class="font-bold text-gray-900 text-xs">${v.views || 0}</span>
                <div class="text-[9px] text-emerald-600 font-semibold" title="${viewerNames}">${viewersCount} active viewers</div>
              </td>
              <td class="py-3 px-4">
                ${modeBadge}
              </td>
              <td class="py-3 px-4 text-right space-x-1">
                <button onclick="closeCategoryDrilldownModal(); openVideoPlayerModal(${v.id})" class="p-1 text-gray-400 hover:text-primary rounded hover:bg-slate-100" title="Watch Video">
                  <span class="material-symbols-outlined text-base">preview</span>
                </button>
                <button onclick="closeCategoryDrilldownModal(); openEditDrawer(${v.id})" class="p-1 text-gray-400 hover:text-primary rounded hover:bg-slate-100" title="Edit Permissions">
                  <span class="material-symbols-outlined text-base">edit</span>
                </button>
              </td>
            </tr>
          `;
        }).join('');
      }
    }

    modal.classList.remove('hidden');
  } catch (err) {
    showToast('Failed to load category drilldown: ' + err.message, 'error');
  }
}

function closeCategoryDrilldownModal() {
  const modal = document.getElementById('categoryDrilldownModal');
  if (modal) modal.classList.add('hidden');
}

function closeCategoryDrilldown() {
  closeCategoryDrilldownModal();
}

function openAddCategoryModal() {
  openAddDeptModal();
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
    if (catName === 'Recommended') return true;
    if (v.category === catName) return true;
    const lowCat = catName.toLowerCase();
    const lowTags = (v.tags || '').toLowerCase();
    const lowDept = (v.department || '').toLowerCase();

    if (lowCat.includes('research') || lowCat.includes('biotech')) {
      return lowDept.includes('biotech') || lowTags.includes('biotech') || (v.category && v.category.toLowerCase().includes('research'));
    }
    if (lowCat.includes('trial') || lowCat.includes('crop')) {
      return lowTags.includes('drones') || lowTags.includes('yield') || lowTags.includes('swine') || lowTags.includes('nutrition') || lowDept.includes('swine') || lowDept.includes('poultry');
    }
    if (lowCat.includes('safety') || lowCat.includes('training')) {
      return lowTags.includes('safety') || lowTags.includes('biosecurity') || lowTags.includes('qclab') || lowDept.includes('qc');
    }
    if (lowCat.includes('townhall') || lowCat.includes('brief') || lowCat.includes('executive')) {
      return (v.category && v.category.toLowerCase().includes('townhall')) || lowDept.includes('executive') || lowTags.includes('meeting') || lowTags.includes('confidential');
    }
    if (lowCat.includes('mill') || lowCat.includes('operation') || lowCat.includes('scada')) {
      return lowDept.includes('operations') || lowTags.includes('scada') || lowTags.includes('rawmaterial');
    }
    if (lowCat.includes('vendor') || lowCat.includes('standard')) {
      return lowDept.includes('raw material') || lowTags.includes('standard');
    }
    return false;
  });

  const list = filtered.length > 0 ? filtered : state.accessibleVideos;

  if (grid) {
    if (list.length === 0) {
      grid.innerHTML = `<div class="col-span-full py-12 text-center text-gray-400">No videos available under this category with your current access permissions.</div>`;
    } else {
      grid.innerHTML = list.map(v => createVideoCardHtml(v)).join('');
    }
  }
}



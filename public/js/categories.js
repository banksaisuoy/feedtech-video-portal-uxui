// ==========================================
// MODULE: KNOWLEDGE CATEGORIES & DEPARTMENTS (categories.js)
// Categories Hub, Category tables, Video drill-downs, Townhall meetings
// ==========================================

// ---------------- SIDEBAR CATEGORIES DROPDOWN ----------------

function toggleSidebarCategoriesDropdown(event) {
  if (event) event.stopPropagation();
  const submenu = document.getElementById('sidebarCategoriesSubmenu');
  const chevron = document.getElementById('sidebarCatChevron');
  if (!submenu) return;

  const isHidden = submenu.classList.contains('hidden');
  if (isHidden) {
    submenu.classList.remove('hidden');
    if (chevron) chevron.classList.add('rotate-180');
  } else {
    submenu.classList.add('hidden');
    if (chevron) chevron.classList.remove('rotate-180');
  }
}

function renderSidebarCategories() {
  const container = document.getElementById('sidebarCategoriesSubmenu');
  if (!container) return;

  const cats = state.categories || [];
  if (cats.length === 0) {
    container.innerHTML = '<div class="px-3 py-1 text-[11px] text-gray-400">Loading categories...</div>';
    return;
  }

  const exploreAllHtml = `
    <a href="#" onclick="navigateView('categories'); return false;" class="flex items-center gap-2 px-2.5 py-1.5 rounded-md text-[11px] font-bold text-primary hover:bg-emerald-50 transition-colors mb-1 border-b border-outline-variant/40 pb-1">
      <span class="material-symbols-outlined text-sm">grid_view</span>
      <span>Browse All Categories</span>
    </a>
  `;

  const itemsHtml = cats.map(c => `
    <a href="#" onclick="openCategoryDetail('${c.name}'); return false;" class="flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-gray-600 hover:text-primary hover:bg-slate-100 transition-colors group">
      <div class="flex items-center gap-2 truncate">
        <span class="material-symbols-outlined text-sm text-gray-400 group-hover:text-primary transition-colors">${c.icon || 'folder'}</span>
        <span class="truncate font-medium">${c.name}</span>
      </div>
      <span class="text-[10px] text-gray-400 font-bold bg-slate-100 group-hover:bg-emerald-100 group-hover:text-emerald-800 px-1.5 py-0.5 rounded-full shrink-0 transition-colors">${c.video_count || 0}</span>
    </a>
  `).join('');

  container.innerHTML = exploreAllHtml + itemsHtml;
}

// ---------------- CATEGORY & DEPARTMENT DATA LOADERS ----------------

async function loadCategories() {
  try {
    const res = await fetch('/api/categories');
    const json = await res.json();
    if (json.success) {
      state.categories = json.data;
      renderSidebarCategories();
      renderCategoryManagementTable();
      populateCategorySelects();
      if (typeof renderCategorySubcategoryPills === 'function') renderCategorySubcategoryPills();
      if (typeof renderCategoriesDirectory === 'function') renderCategoriesDirectory();
    }
  } catch (err) {
    console.error('Failed to load categories', err);
  }
}

async function loadDepartments() {
  try {
    const res = await fetch('/api/departments');
    const json = await res.json();
    if (json.success) {
      state.departments = json.data;
      populateDepartmentSelects();
    }
  } catch (err) {
    console.error('Failed to load departments', err);
  }
}

function populateCategorySelects() {
  const selects = ['tagCategoryFilter', 'quickTagDept', 'modalTagDept', 'uploadVideoDept', 'editDrawerDept', 'videoDeptFilter'];
  if (!state.categories) return;

  selects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const isFilter = id.includes('Filter');
    let opts = isFilter ? '<option value="">All Categories</option>' : '';
    opts += state.categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    el.innerHTML = opts;
  });
}

function populateDepartmentSelects() {
  populateCategorySelects();
}

// Backward compatibility alias for sidebar
function renderDepartmentsSidebar() {
  renderSidebarCategories();
}

function toggleDeptMenu() {
  toggleSidebarCategoriesDropdown();
}

// ---------------- DEDICATED CATEGORY MANAGEMENT (ADMIN TABLE) ----------------

function renderCategoryManagementTable() {
  const tbody = document.getElementById('adminCategoryTableBody');
  if (!tbody) return;

  const cats = state.categories || [];
  const q = (document.getElementById('adminCategorySearchInput')?.value || '').toLowerCase();

  let list = cats;
  if (q) {
    list = list.filter(c => 
      (c.name || '').toLowerCase().includes(q) || 
      (c.description || '').toLowerCase().includes(q)
    );
  }

  // Update Bento Metrics
  const totalCatEl = document.getElementById('adminCatKpiTotal');
  const totalVidEl = document.getElementById('adminCatKpiVideos');
  const catStatCountEl = document.getElementById('catStatCount');

  if (totalCatEl) totalCatEl.textContent = cats.length;
  if (catStatCountEl) catStatCountEl.textContent = `${cats.length} Categories`;
  if (totalVidEl) {
    const totalVids = cats.reduce((acc, c) => acc + (c.video_count || 0), 0);
    totalVidEl.textContent = totalVids;
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-xs text-gray-400">No categories found matching current criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(c => `
    <tr class="hover:bg-slate-50 transition-colors group">
      <td class="py-3.5 px-5">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-emerald-50 text-primary flex items-center justify-center font-bold shrink-0">
            <span class="material-symbols-outlined text-lg">${c.icon || 'domain'}</span>
          </div>
          <div>
            <div class="font-bold text-gray-900 text-xs">${c.name}</div>
            <div class="text-[10px] text-gray-400 font-mono mt-0.5">CAT-${String(c.id).padStart(3, '0')}</div>
          </div>
        </div>
      </td>
      <td class="py-3.5 px-5 text-gray-600 text-xs max-w-md">
        <div class="line-clamp-2" title="${c.description || ''}">
          ${c.description || 'Enterprise knowledge category for organizing videos, SOPs, and research documentation.'}
        </div>
      </td>
      <td class="py-3.5 px-5 text-center">
        <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          ${c.video_count || 0} videos
        </span>
      </td>
      <td class="py-3.5 px-5">
        <span class="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          Public / Departmental
        </span>
      </td>
      <td class="py-3.5 px-5 text-right whitespace-nowrap space-x-1">
        <button onclick="openCategoryDrilldown('${c.name}')" class="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-slate-100 transition-colors" title="Drill-down Videos">
          <span class="material-symbols-outlined text-base">analytics</span>
        </button>
        <button onclick="editCategoryPrompt(${c.id})" class="p-1.5 text-gray-400 hover:text-primary rounded-lg hover:bg-slate-100 transition-colors" title="Edit Category">
          <span class="material-symbols-outlined text-base">edit</span>
        </button>
        <button onclick="deleteCategoryPrompt(${c.id})" class="p-1.5 text-gray-400 hover:text-rose-600 rounded-lg hover:bg-slate-100 transition-colors" title="Delete Category">
          <span class="material-symbols-outlined text-base">delete</span>
        </button>
      </td>
    </tr>
  `).join('');
}

function filterCategoryManagementTable() {
  renderCategoryManagementTable();
}

function openAddCategoryModal() {
  document.getElementById('categoryModalTitle').textContent = 'Add Category (เพิ่มหมวดหมู่ความรู้)';
  document.getElementById('modalCatId').value = '';
  document.getElementById('modalCatName').value = '';
  document.getElementById('modalCatIcon').value = 'domain';
  const descEl = document.getElementById('modalCatDesc');
  if (descEl) descEl.value = '';
  document.getElementById('categoryModal').classList.remove('hidden');
}

function editCategoryPrompt(catId) {
  const cat = state.categories.find(c => c.id === catId);
  if (!cat) return;
  document.getElementById('categoryModalTitle').textContent = 'Edit Category (แก้ไขหมวดหมู่ความรู้)';
  document.getElementById('modalCatId').value = cat.id;
  document.getElementById('modalCatName').value = cat.name;
  document.getElementById('modalCatIcon').value = cat.icon || 'domain';
  const descEl = document.getElementById('modalCatDesc');
  if (descEl) descEl.value = cat.description || '';
  document.getElementById('categoryModal').classList.remove('hidden');
}

function closeCategoryModal() {
  document.getElementById('categoryModal').classList.add('hidden');
}

async function saveCategoryModalSubmit() {
  const id = document.getElementById('modalCatId').value;
  const name = document.getElementById('modalCatName').value.trim();
  const icon = document.getElementById('modalCatIcon').value.trim() || 'domain';
  const description = document.getElementById('modalCatDesc')?.value.trim() || '';

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
        body: JSON.stringify({ name, icon, description })
      });
    } else {
      res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, icon, description })
      });
    }

    const json = await res.json();
    if (json.success) {
      closeCategoryModal();
      await loadCategories();
      showToast(id ? 'Category updated successfully' : 'Category created successfully', 'success');
    } else {
      showToast(json.message || 'Failed to save category', 'error');
    }
  } catch (err) {
    showToast('Failed to save category', 'error');
  }
}

async function deleteCategoryPrompt(catId) {
  const cat = state.categories.find(c => c.id === catId);
  const catName = cat ? cat.name : `ID #${catId}`;
  if (!confirm(`Are you sure you want to delete category "${catName}"?`)) return;

  try {
    const res = await fetch(`/api/categories/${catId}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      await loadCategories();
      showToast('Category deleted successfully', 'success');
    } else {
      showToast(json.message || 'Failed to delete category', 'error');
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



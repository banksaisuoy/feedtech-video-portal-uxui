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

  const itemsHtml = cats.map(c => {
    const isImg = c.icon && (c.icon.startsWith('data:') || c.icon.startsWith('http') || c.icon.startsWith('/'));
    const iconHtml = isImg 
      ? `<img src="${c.icon}" class="w-4 h-4 object-contain rounded shrink-0" alt="${c.name}">` 
      : `<span class="material-symbols-outlined text-sm text-gray-400 group-hover:text-primary transition-colors">${c.icon || 'folder'}</span>`;

    return `
      <a href="#" onclick="openCategoryDetail('${c.name}'); return false;" class="flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs text-gray-600 hover:text-primary hover:bg-slate-100 transition-colors group">
        <div class="flex items-center gap-2 truncate">
          ${iconHtml}
          <span class="truncate font-medium">${c.name}</span>
        </div>
        <span class="text-[10px] text-gray-400 font-bold bg-slate-100 group-hover:bg-emerald-100 group-hover:text-emerald-800 px-1.5 py-0.5 rounded-full shrink-0 transition-colors">${c.video_count || 0}</span>
      </a>
    `;
  }).join('');

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
  const selects = ['tagCategoryFilter', 'quickTagDept', 'modalTagDept', 'uploadVideoDept', 'uploadVideoCategory', 'editDrawerCategory'];
  if (!state.categories) return;

  selects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const isFilter = id.includes('Filter');
    let opts = isFilter ? '<option value="">All Categories</option>' : '';
    opts += state.categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    el.innerHTML = opts;
  });

  const eventCategory = document.getElementById('modalEventCategory');
  if (eventCategory) {
    const current = eventCategory.value;
    eventCategory.innerHTML = state.categories.map(c => `<option value="${c.name}">${c.name}</option>`).join('');
    if (current) eventCategory.value = current;
  }
}

// ---------------- CONTENT TYPE / FORMAT MANAGEMENT ----------------

async function loadContentTypes() {
  try {
    const res = await fetch('/api/content-types');
    const json = await res.json();
    if (json.success) {
      state.contentTypes = json.data;
      populateContentTypeSelects();
      renderContentTypeManagementList();
    }
  } catch (err) {
    console.error('Failed to load content types', err);
  }
}

function populateContentTypeSelects() {
  const selects = ['uploadVideoContentType', 'editDrawerContentType', 'videoContentTypeFilter', 'homeContentTypeFilter'];
  if (!state.contentTypes) return;

  selects.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const isFilter = id.includes('Filter');
    const currentVal = el.value;
    let opts = isFilter ? '<option value="">All Content Types</option>' : '';
    opts += state.contentTypes.map(ct => `<option value="${ct.name}">${ct.name}</option>`).join('');
    el.innerHTML = opts;
    if (currentVal && state.contentTypes.some(ct => ct.name === currentVal)) {
      el.value = currentVal;
    }
  });
}

function renderContentTypeManagementList() {
  const container = document.getElementById('contentTypeManageList');
  if (!container) return;

  const types = state.contentTypes || [];
  if (types.length === 0) {
    container.innerHTML = '<div class="text-xs text-gray-400 py-2">No content types configured.</div>';
    return;
  }

  container.innerHTML = types.map(ct => `
    <div class="flex items-center justify-between p-2.5 bg-slate-50 border border-outline-variant rounded-lg text-xs hover:bg-white transition-all">
      <div class="flex items-center gap-2">
        <span class="material-symbols-outlined text-primary text-base">${ct.icon || 'description'}</span>
        <div>
          <span class="font-bold text-gray-900">${ct.name}</span>
          <span class="text-[10px] text-gray-400 ml-1.5 font-mono">(${ct.video_count || 0} videos)</span>
        </div>
      </div>
      <button type="button" onclick="deleteContentTypeSubmit(${ct.id})" class="text-gray-400 hover:text-rose-600 p-1 rounded hover:bg-rose-50 transition-colors" title="Delete content type">
        <span class="material-symbols-outlined text-sm">delete</span>
      </button>
    </div>
  `).join('');
}

function openAddContentTypeModal() {
  const modal = document.getElementById('contentTypeModal');
  if (modal) {
    document.getElementById('modalContentTypeName').value = '';
    document.getElementById('modalContentTypeDesc').value = '';
    renderContentTypeManagementList();
    modal.classList.remove('hidden');
  }
}

function closeContentTypeModal() {
  const modal = document.getElementById('contentTypeModal');
  if (modal) modal.classList.add('hidden');
}

async function saveContentTypeSubmit() {
  const nameInput = document.getElementById('modalContentTypeName');
  const descInput = document.getElementById('modalContentTypeDesc');
  const name = nameInput ? nameInput.value.trim() : '';
  const description = descInput ? descInput.value.trim() : '';

  if (!name) {
    showToast('Please enter a content type name', 'warning');
    return;
  }

  try {
    const res = await fetch('/api/content-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, icon: 'description', description })
    });
    const json = await res.json();
    if (json.success) {
      showToast(`Content Type "${name}" created`, 'success');
      nameInput.value = '';
      if (descInput) descInput.value = '';
      await loadContentTypes();
    } else {
      showToast(json.message || 'Failed to create content type', 'error');
    }
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
}

async function deleteContentTypeSubmit(id) {
  if (!confirm('Are you sure you want to delete this Content Type?')) return;
  try {
    const res = await fetch(`/api/content-types/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      showToast('Content Type deleted', 'info');
      await loadContentTypes();
    } else {
      showToast(json.message || 'Failed to delete content type', 'error');
    }
  } catch (err) {
    showToast('Error: ' + err.message, 'error');
  }
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
  const contentTypeKpiEl = document.getElementById('adminCatKpiContentTypes');
  if (contentTypeKpiEl) {
    contentTypeKpiEl.textContent = `${(state.contentTypes || []).length} Types`;
  }

  if (list.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" class="py-8 text-center text-xs text-gray-400">No categories found matching current criteria.</td></tr>`;
    return;
  }

  tbody.innerHTML = list.map(c => {
    const isImg = c.icon && (c.icon.startsWith('data:') || c.icon.startsWith('http') || c.icon.startsWith('/'));
    const iconHtml = isImg 
      ? `<img src="${c.icon}" class="w-6 h-6 object-contain rounded" alt="${c.name}">` 
      : `<span class="material-symbols-outlined text-lg">${c.icon || 'domain'}</span>`;

    return `
    <tr class="hover:bg-slate-50 transition-colors group">
      <td class="py-3.5 px-5">
        <div class="flex items-center gap-3">
          <div class="w-9 h-9 rounded-xl bg-emerald-50 text-primary flex items-center justify-center font-bold shrink-0 overflow-hidden">
            ${iconHtml}
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
  `}).join('');
}

function filterCategoryManagementTable() {
  renderCategoryManagementTable();
}

function selectPresetCatIcon(iconName) {
  const hiddenInput = document.getElementById('modalCatIcon');
  if (hiddenInput) hiddenInput.value = iconName;

  updateCatIconPreview(iconName);

  document.querySelectorAll('.preset-icon-btn').forEach(btn => {
    const span = btn.querySelector('.material-symbols-outlined')?.textContent?.trim();
    if (span === iconName) {
      btn.classList.add('border-primary', 'bg-emerald-50', 'text-primary', 'ring-2', 'ring-primary/20');
      btn.classList.remove('border-outline-variant', 'bg-white', 'text-gray-700');
    } else {
      btn.classList.remove('border-primary', 'bg-emerald-50', 'text-primary', 'ring-2', 'ring-primary/20');
      btn.classList.add('border-outline-variant', 'bg-white', 'text-gray-700');
    }
  });

  const fileInput = document.getElementById('modalCatIconFile');
  if (fileInput) fileInput.value = '';
  const urlInput = document.getElementById('modalCatIconUrl');
  if (urlInput) urlInput.value = '';
}

function handleCustomCatIconUpload(event) {
  const file = event.target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const dataUrl = e.target.result;
    const hiddenInput = document.getElementById('modalCatIcon');
    if (hiddenInput) hiddenInput.value = dataUrl;
    updateCatIconPreview(dataUrl);

    document.querySelectorAll('.preset-icon-btn').forEach(btn => {
      btn.classList.remove('border-primary', 'bg-emerald-50', 'text-primary', 'ring-2', 'ring-primary/20');
      btn.classList.add('border-outline-variant', 'bg-white', 'text-gray-700');
    });
    const urlInput = document.getElementById('modalCatIconUrl');
    if (urlInput) urlInput.value = '';
  };
  reader.readAsDataURL(file);
}

function handleCatIconUrlInput(url) {
  const clean = (url || '').trim();
  if (!clean) return;
  const hiddenInput = document.getElementById('modalCatIcon');
  if (hiddenInput) hiddenInput.value = clean;
  updateCatIconPreview(clean);

  document.querySelectorAll('.preset-icon-btn').forEach(btn => {
    btn.classList.remove('border-primary', 'bg-emerald-50', 'text-primary', 'ring-2', 'ring-primary/20');
    btn.classList.add('border-outline-variant', 'bg-white', 'text-gray-700');
  });
  const fileInput = document.getElementById('modalCatIconFile');
  if (fileInput) fileInput.value = '';
}

function updateCatIconPreview(iconValue) {
  const symbolEl = document.getElementById('catIconPreviewSymbol');
  const imgEl = document.getElementById('catIconPreviewImg');
  if (!symbolEl || !imgEl) return;

  const isImg = iconValue && (iconValue.startsWith('data:') || iconValue.startsWith('http') || iconValue.startsWith('/'));
  if (isImg) {
    imgEl.src = iconValue;
    imgEl.classList.remove('hidden');
    symbolEl.classList.add('hidden');
  } else {
    symbolEl.textContent = iconValue || 'domain';
    symbolEl.classList.remove('hidden');
    imgEl.classList.add('hidden');
  }
}

function openAddCategoryModal() {
  document.getElementById('categoryModalTitle').textContent = 'Add Category (เพิ่มหมวดหมู่ความรู้)';
  document.getElementById('modalCatId').value = '';
  document.getElementById('modalCatName').value = '';
  document.getElementById('modalCatIcon').value = 'domain';
  const descEl = document.getElementById('modalCatDesc');
  if (descEl) descEl.value = '';

  selectPresetCatIcon('domain');
  const fileInput = document.getElementById('modalCatIconFile');
  if (fileInput) fileInput.value = '';
  const urlInput = document.getElementById('modalCatIconUrl');
  if (urlInput) urlInput.value = '';

  document.getElementById('categoryModal').classList.remove('hidden');
}

function editCategoryPrompt(catId) {
  const cat = state.categories.find(c => c.id === catId);
  if (!cat) return;
  document.getElementById('categoryModalTitle').textContent = `Edit Category: ${cat.name}`;
  document.getElementById('modalCatId').value = cat.id;
  document.getElementById('modalCatName').value = cat.name;
  document.getElementById('modalCatIcon').value = cat.icon || 'domain';
  const descEl = document.getElementById('modalCatDesc');
  if (descEl) descEl.value = cat.description || '';

  const iconVal = cat.icon || 'domain';
  const isImg = iconVal.startsWith('data:') || iconVal.startsWith('http') || iconVal.startsWith('/');
  if (isImg) {
    updateCatIconPreview(iconVal);
    const urlInput = document.getElementById('modalCatIconUrl');
    if (urlInput && iconVal.startsWith('http')) urlInput.value = iconVal;
    document.querySelectorAll('.preset-icon-btn').forEach(btn => {
      btn.classList.remove('border-primary', 'bg-emerald-50', 'text-primary', 'ring-2', 'ring-primary/20');
      btn.classList.add('border-outline-variant', 'bg-white', 'text-gray-700');
    });
  } else {
    selectPresetCatIcon(iconVal);
  }

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
          <p class="text-xs text-gray-500 mt-1 leading-relaxed">Enterprise category taxonomy governing curated video content and knowledge assets.</p>
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

  const displayCat = (!catName || catName === 'All') ? 'All Categories' : catName;
  if (titleEl) titleEl.textContent = `${displayCat} Video Breakdown`;
  if (badgeEl) badgeEl.textContent = `${displayCat}`;

  try {
    const url = (!catName || catName === 'All') 
      ? '/api/analytics/category-drilldown' 
      : `/api/analytics/category-drilldown/${encodeURIComponent(catName)}`;
    const res = await fetch(url);
    const json = await res.json();
    if (!json.success) throw new Error(json.message);

    const { total_videos, total_views, videos } = json;
    if (totalVidEl) totalVidEl.textContent = `${total_videos} Videos`;
    if (totalViewsEl) totalViewsEl.textContent = `${(total_views || 0).toLocaleString()} Views`;
    if (summaryEl) summaryEl.textContent = `Showing ${videos.length} videos in ${displayCat}`;

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
  openAddCategoryModal();
}

function closeDeptModal() {
  closeCategoryModal();
  if (typeof closeDepartmentModal === 'function') closeDepartmentModal();
}

async function saveDeptModalSubmit() {
  await saveCategoryModalSubmit();
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

  const pool = state.accessibleVideos || [];
  const lowCat = (catName || '').trim().toLowerCase();

  const filtered = pool.filter(v => {
    if (!catName || lowCat === 'all' || lowCat === 'all categories') return true;
    if (v.category && v.category.trim().toLowerCase() === lowCat) return true;
    return Boolean(v.category && v.category.trim().toLowerCase() === lowCat);
  });

  if (grid) {
    if (filtered.length === 0) {
      grid.innerHTML = `
        <div class="col-span-full py-16 text-center">
          <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <span class="material-symbols-outlined text-2xl">folder_off</span>
          </div>
          <h4 class="text-sm font-bold text-gray-700">No videos in this category</h4>
          <p class="text-xs text-gray-400 mt-1 max-w-sm mx-auto">There are currently no videos found under "${catName}" accessible to your profile.</p>
        </div>
      `;
    } else {
      grid.innerHTML = filtered.map(v => createVideoCardHtml(v)).join('');
    }
  }
}

// ---------------- CORPORATE DEPARTMENT MANAGEMENT ----------------

async function loadDepartments() {
  try {
    const res = await fetch('/api/departments');
    const json = await res.json();
    if (json.success) {
      state.departments = json.data;
      renderDepartmentList();
      populateDepartmentSelects();
    }
  } catch (err) {
    console.error('Failed to load departments', err);
  }
}

function renderDepartmentList() {
  const container = document.getElementById('departmentListContainer');
  if (!container) return;

  const depts = state.departments || [];
  if (depts.length === 0) {
    container.innerHTML = `<div class="py-8 text-center text-xs text-gray-400">No departments configured yet.</div>`;
    return;
  }

  container.innerHTML = depts.map(d => `
    <div class="p-3 bg-white border border-outline-variant rounded-xl flex items-center justify-between gap-3 hover:border-primary/40 transition-all shadow-2xs">
      <div class="flex items-center gap-2.5 min-w-0">
        <div class="w-8 h-8 rounded-lg bg-emerald-50 text-primary flex items-center justify-center font-bold shrink-0">
          <span class="material-symbols-outlined text-base">corporate_fare</span>
        </div>
        <div class="min-w-0">
          <div class="font-bold text-gray-900 text-xs truncate">${d.name}</div>
          <div class="text-[11px] text-gray-400 line-clamp-1">${d.description || 'Corporate organizational unit'}</div>
        </div>
      </div>
      <div class="flex items-center gap-3 shrink-0">
        <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${d.user_count > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-gray-500'}">
          ${d.user_count || 0} Members
        </span>
        <button onclick="deleteDepartmentSubmit(${d.id}, '${d.name.replace(/'/g, "\\'")}')" class="p-1 text-gray-400 hover:text-rose-600 rounded hover:bg-rose-50 transition-colors" title="Delete Department">
          <span class="material-symbols-outlined text-base">delete</span>
        </button>
      </div>
    </div>
  `).join('');
}

function populateDepartmentSelects() {
  const depts = state.departments || [];
  
  // User Filter in User Management
  const filterSelect = document.getElementById('userDeptFilter');
  if (filterSelect) {
    const curr = filterSelect.value;
    filterSelect.innerHTML = `<option value="">All Departments</option>` + depts.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
    filterSelect.value = curr;
  }

  // User Add/Edit Modal
  const modalDept = document.getElementById('modalDept');
  if (modalDept) {
    const curr = modalDept.value;
    modalDept.innerHTML = depts.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
    if (curr) modalDept.value = curr;
  }

  ['editDrawerDept', 'videoDeptFilter', 'modalEventDept'].forEach(id => {
    const select = document.getElementById(id);
    if (!select) return;
    const current = select.value;
    select.innerHTML = depts.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
    if (current) select.value = current;
  });

  // PBAC Department Filters (Upload & Drawer)
  const uploadDeptFilter = document.getElementById('uploadDeptFilter');
  if (uploadDeptFilter) {
    uploadDeptFilter.innerHTML = `<option value="">All Departments</option>` + depts.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
  }
  const drawerDeptFilter = document.getElementById('drawerDeptFilter');
  if (drawerDeptFilter) {
    drawerDeptFilter.innerHTML = `<option value="">All Departments</option>` + depts.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
  }
  const eventDeptFilter = document.getElementById('adminEventDeptFilter');
  if (eventDeptFilter) {
    const curr = eventDeptFilter.value;
    eventDeptFilter.innerHTML = `<option value="">All Departments</option>` + depts.map(d => `<option value="${d.name}">${d.name}</option>`).join('');
    eventDeptFilter.value = curr;
  }
}

function openDepartmentModal() {
  const modal = document.getElementById('departmentModal');
  if (modal) {
    modal.classList.remove('hidden');
    loadDepartments();
  }
}

function closeDepartmentModal() {
  const modal = document.getElementById('departmentModal');
  if (modal) modal.classList.add('hidden');
}

async function saveDepartmentSubmit() {
  const nameInput = document.getElementById('newDeptName');
  const descInput = document.getElementById('newDeptDesc');
  const name = nameInput ? nameInput.value.trim() : '';
  const description = descInput ? descInput.value.trim() : '';

  if (!name) {
    showToast('Please specify department name', 'error');
    if (nameInput) nameInput.focus();
    return;
  }

  try {
    const res = await fetch('/api/departments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description })
    });
    const json = await res.json();
    if (json.success) {
      if (nameInput) nameInput.value = '';
      if (descInput) descInput.value = '';
      showToast('Department added successfully', 'success');
      await loadDepartments();
      if (typeof renderUserTable === 'function') renderUserTable();
    } else {
      showToast(json.message || 'Failed to add department', 'error');
    }
  } catch (err) {
    showToast('Error saving department', 'error');
  }
}

async function deleteDepartmentSubmit(id, name) {
  if (!confirm(`Are you sure you want to delete department "${name}"?`)) return;

  try {
    const res = await fetch(`/api/departments/${id}`, { method: 'DELETE' });
    const json = await res.json();
    if (json.success) {
      showToast('Department deleted successfully', 'success');
      await loadDepartments();
      if (typeof renderUserTable === 'function') renderUserTable();
    } else {
      showToast(json.message || 'Cannot delete department', 'error');
    }
  } catch (err) {
    showToast('Error deleting department', 'error');
  }
}




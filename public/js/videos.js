// ==========================================
// MODULE: VIDEO CATALOG & STREAMING (videos.js)
// Video feeds (Home, Recommended, History, Favorites), playback modal
// ==========================================

// ---------------- VIDEO RENDERING & INTERACTIONS ----------------

function getPermissionBadgeMarkup(videoOrLevel) {
  if (typeof videoOrLevel === 'object' && videoOrLevel !== null) {
    const mode = (videoOrLevel.access_mode || 'public').toLowerCase();
    if (mode === 'include') {
      let count = 0;
      try {
        count = JSON.parse(videoOrLevel.allowed_user_ids || '[]').length;
      } catch (e) {}
      return `<span title="${videoOrLevel.access_grant_reason || 'Specific authorized personnel'}" class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
        <span class="material-symbols-outlined text-[12px]">group</span> 👥 Include (${count || 'Custom'})
      </span>`;
    } else if (mode === 'exclude') {
      let count = 0;
      try {
        count = JSON.parse(videoOrLevel.excluded_user_ids || '[]').length;
      } catch (e) {}
      return `<span title="${videoOrLevel.access_grant_reason || 'Accessible to all company except excluded members'}" class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
        <span class="material-symbols-outlined text-[12px]">person_off</span> 🚫 Exclude (${count})
      </span>`;
    } else {
      return `<span title="${videoOrLevel.access_grant_reason || 'Accessible to all employees'}" class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <span class="material-symbols-outlined text-[12px]">public</span> 🌐 Public
      </span>`;
    }
  }

  const level = String(videoOrLevel || '');
  if (level === 'Highly Confidential') {
    return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200">
      <span class="material-symbols-outlined text-[12px]">group</span> 👥 Include (VIP)
    </span>`;
  } else if (level === 'Restricted') {
    return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
      <span class="material-symbols-outlined text-[12px]">person_off</span> 🚫 Exclude
    </span>`;
  } else {
    return `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
      <span class="material-symbols-outlined text-[12px]">public</span> 🌐 Public
    </span>`;
  }
}

// Carousel state variables
state.featuredSlides = [];
state.featuredCurrentIndex = 0;
state.featuredTimer = null;
state.isFeaturedPaused = false;

function renderFeaturedCarousel() {
  const container = document.getElementById('featuredSlidesContainer');
  const dotsContainer = document.getElementById('featuredDotsContainer');
  const prevBtn = document.getElementById('featuredPrevBtn');
  const nextBtn = document.getElementById('featuredNextBtn');
  const countBadge = document.getElementById('featuredCountBadge');
  const carouselEl = document.getElementById('homeFeaturedCarousel');
  if (!container) return;

  // 1. Filter featured videos from accessible videos
  let featured = (state.accessibleVideos || []).filter(v => v.is_featured === 1);
  // Fallback: If no video is marked as featured, pick top 3 videos by views
  if (featured.length === 0) {
    featured = [...(state.accessibleVideos || [])].sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, 3);
  }

  state.featuredSlides = featured;
  if (state.featuredSlides.length === 0) {
    if (carouselEl) carouselEl.classList.add('hidden');
    return;
  }
  if (carouselEl) carouselEl.classList.remove('hidden');

  // Keep index within bounds
  if (state.featuredCurrentIndex >= featured.length) {
    state.featuredCurrentIndex = 0;
  }

  // 2. Render Slides
  container.innerHTML = featured.map((v, idx) => {
    const isActive = idx === state.featuredCurrentIndex;
    return `
      <div id="featuredSlide-${idx}" class="featured-slide absolute inset-0 transition-opacity duration-700 ease-in-out ${isActive ? 'opacity-100 z-10' : 'opacity-0 pointer-events-none z-0'}">
        <!-- Background Image with Ambient Cover -->
        <img src="${v.thumbnail_url || 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=1200'}" alt="${v.title}" class="w-full h-full object-cover select-none">
        
        <!-- Dark Multi-Stop Gradient Overlay -->
        <div class="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/70 to-slate-950/20"></div>
        <div class="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/50 to-transparent"></div>

        <!-- Slide Overlay Content (Bottom Left) -->
        <div class="absolute bottom-0 left-0 right-0 p-6 md:p-10 z-10 max-w-3xl space-y-3">
          <!-- Badges Bar -->
          <div class="flex flex-wrap items-center gap-2">
            <span class="px-2.5 py-1 rounded-md bg-amber-500/20 border border-amber-500/40 text-amber-300 font-bold text-xs flex items-center gap-1 shadow-sm">
              <span class="material-symbols-outlined text-xs fill">push_pin</span>
              <span>Pinned Highlight</span>
            </span>
            <span class="px-2.5 py-1 rounded-md bg-primary text-white font-bold text-xs uppercase tracking-wider shadow-sm">
              ${v.category || v.department || 'Portal Video'}
            </span>
            <span class="px-2 py-0.5 rounded bg-black/60 text-white font-mono text-xs border border-white/10">
              ${v.duration || '10:00'}
            </span>
            ${getPermissionBadgeMarkup(v)}
          </div>

          <!-- Video Title -->
          <h2 class="text-xl sm:text-2xl md:text-3xl font-black text-white line-clamp-2 leading-tight drop-shadow-md cursor-pointer hover:text-emerald-400 transition-colors" onclick="openVideoWatchPage(${v.id})">
            ${v.title}
          </h2>

          <!-- Video Description -->
          <p class="text-xs sm:text-sm text-slate-300 line-clamp-2 max-w-2xl leading-relaxed drop-shadow">
            ${v.description || 'Enterprise video resource available for authorized personnel in Feedtech Innovation Portal.'}
          </p>

          <!-- Interactive Actions -->
          <div class="flex items-center gap-3 pt-2">
            <button type="button" onclick="openVideoWatchPage(${v.id})" class="px-5 py-2.5 bg-primary hover:bg-emerald-600 text-white rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-emerald-950/40 hover:scale-102 transition-all cursor-pointer">
              <span class="material-symbols-outlined fill text-lg">play_arrow</span>
              <span>ดูวิดีโอไฮไลท์ (Watch Now)</span>
            </button>
            <button type="button" onclick="openVideoPlayerModal(${v.id})" class="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl font-semibold text-xs sm:text-sm flex items-center gap-1.5 backdrop-blur transition-all border border-white/10 cursor-pointer">
              <span class="material-symbols-outlined text-base">picture_in_picture_alt</span>
              <span>Quick Preview</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // 3. Render Dots
  if (dotsContainer) {
    if (featured.length > 1) {
      dotsContainer.innerHTML = featured.map((_, idx) => `
        <button type="button" onclick="goToFeaturedSlide(${idx})" class="transition-all duration-300 rounded-full cursor-pointer ${idx === state.featuredCurrentIndex ? 'w-8 h-2.5 bg-primary shadow-md' : 'w-2.5 h-2.5 bg-white/40 hover:bg-white/80'}" title="Highlight ${idx + 1}"></button>
      `).join('');
      dotsContainer.classList.remove('hidden');
    } else {
      dotsContainer.innerHTML = '';
      dotsContainer.classList.add('hidden');
    }
  }

  // 4. Update Prev / Next Buttons Visibility
  if (prevBtn && nextBtn) {
    if (featured.length > 1) {
      prevBtn.classList.remove('hidden');
      nextBtn.classList.remove('hidden');
    } else {
      prevBtn.classList.add('hidden');
      nextBtn.classList.add('hidden');
    }
  }

  // 5. Update Badge text
  if (countBadge) {
    if (featured.length > 1) {
      countBadge.textContent = `${state.featuredCurrentIndex + 1} / ${featured.length} Highlights`;
    } else {
      countBadge.textContent = 'Pinned Highlight';
    }
  }

  // 6. Start Autoplay if more than 1 slide
  if (featured.length > 1) {
    startFeaturedAutoplay();
  } else {
    stopFeaturedAutoplay();
  }
}

function updateFeaturedSlideView() {
  const slides = document.querySelectorAll('.featured-slide');
  slides.forEach((el, idx) => {
    if (idx === state.featuredCurrentIndex) {
      el.classList.remove('opacity-0', 'pointer-events-none', 'z-0');
      el.classList.add('opacity-100', 'z-10');
    } else {
      el.classList.remove('opacity-100', 'z-10');
      el.classList.add('opacity-0', 'pointer-events-none', 'z-0');
    }
  });

  const dotsContainer = document.getElementById('featuredDotsContainer');
  if (dotsContainer) {
    const dots = dotsContainer.querySelectorAll('button');
    dots.forEach((dot, idx) => {
      if (idx === state.featuredCurrentIndex) {
        dot.className = 'w-8 h-2.5 bg-primary shadow-md transition-all duration-300 rounded-full cursor-pointer';
      } else {
        dot.className = 'w-2.5 h-2.5 bg-white/40 hover:bg-white/80 transition-all duration-300 rounded-full cursor-pointer';
      }
    });
  }

  const countBadge = document.getElementById('featuredCountBadge');
  if (countBadge && state.featuredSlides.length > 1) {
    countBadge.textContent = `${state.featuredCurrentIndex + 1} / ${state.featuredSlides.length} Highlights`;
  }
}

function nextFeaturedSlide() {
  if (!state.featuredSlides || state.featuredSlides.length <= 1) return;
  state.featuredCurrentIndex = (state.featuredCurrentIndex + 1) % state.featuredSlides.length;
  updateFeaturedSlideView();
}

function prevFeaturedSlide() {
  if (!state.featuredSlides || state.featuredSlides.length <= 1) return;
  state.featuredCurrentIndex = (state.featuredCurrentIndex - 1 + state.featuredSlides.length) % state.featuredSlides.length;
  updateFeaturedSlideView();
}

function goToFeaturedSlide(idx) {
  if (!state.featuredSlides || idx < 0 || idx >= state.featuredSlides.length) return;
  state.featuredCurrentIndex = idx;
  updateFeaturedSlideView();
}

function startFeaturedAutoplay() {
  stopFeaturedAutoplay();
  state.featuredTimer = setInterval(() => {
    if (!state.isFeaturedPaused) {
      nextFeaturedSlide();
    }
  }, 5000);
}

function stopFeaturedAutoplay() {
  if (state.featuredTimer) {
    clearInterval(state.featuredTimer);
    state.featuredTimer = null;
  }
}

function pauseFeaturedCarousel() {
  state.isFeaturedPaused = true;
}

function resumeFeaturedCarousel() {
  state.isFeaturedPaused = false;
}

window.renderFeaturedCarousel = renderFeaturedCarousel;
window.nextFeaturedSlide = nextFeaturedSlide;
window.prevFeaturedSlide = prevFeaturedSlide;
window.goToFeaturedSlide = goToFeaturedSlide;
window.pauseFeaturedCarousel = pauseFeaturedCarousel;
window.resumeFeaturedCarousel = resumeFeaturedCarousel;

function renderHomeVideos() {
  const allAcc = state.accessibleVideos;

  // 0. Render Pinned Hero Carousel
  renderFeaturedCarousel();

  // 1. Recommended (Prioritize is_recommended = 1, then sort by views)
  const recEl = document.getElementById('homeRecommendedGrid');
  if (recEl) {
    const recVideos = [...allAcc].sort((a, b) => {
      if ((b.is_recommended || 0) !== (a.is_recommended || 0)) {
        return (b.is_recommended || 0) - (a.is_recommended || 0);
      }
      return (b.views || 0) - (a.views || 0);
    }).slice(0, 4);

    recEl.innerHTML = recVideos.length > 0 
      ? recVideos.map(v => createVideoCardHtml(v)).join('')
      : `<div class="col-span-full py-8 text-center text-xs text-gray-400">No recommended videos available under current permissions.</div>`;
  }

  // 2. Research & Whitepapers (Biotech) (Max 4)
  const biotechEl = document.getElementById('homeBiotechGrid');
  if (biotechEl) {
    const biotechVideos = allAcc.filter(v => v.department === 'Biotech' || v.category.includes('Research') || (v.tags && v.tags.includes('biotech'))).slice(0, 4);
    biotechEl.innerHTML = biotechVideos.length > 0
      ? biotechVideos.map(v => createVideoCardHtml(v)).join('')
      : `<div class="col-span-full py-8 text-center text-xs text-gray-400">No Biotech research videos available under current permissions.</div>`;
  }

  // 3. Field Trials & Reports (Max 4)
  const trialsEl = document.getElementById('homeTrialsGrid');
  if (trialsEl) {
    const trialVideos = allAcc.filter(v => v.category.includes('Trial') || v.category.includes('Crop') || (v.tags && (v.tags.includes('drones') || v.tags.includes('swine') || v.tags.includes('nutrition')))).slice(0, 4);
    const displayList = trialVideos.length > 0 ? trialVideos : allAcc.slice(2, 6);
    trialsEl.innerHTML = displayList.slice(0, 4).map(v => createVideoCardHtml(v)).join('');
  }

  // 4. Training & Safety Protocols (Max 4)
  const safetyEl = document.getElementById('homeSafetyGrid');
  if (safetyEl) {
    const safetyVideos = allAcc.filter(v => v.category.includes('Safety') || v.category.includes('Training') || (v.tags && (v.tags.includes('safety') || v.tags.includes('biosecurity') || v.tags.includes('qclab')))).slice(0, 4);
    const displayList = safetyVideos.length > 0 ? safetyVideos : allAcc.slice(1, 5);
    safetyEl.innerHTML = displayList.slice(0, 4).map(v => createVideoCardHtml(v)).join('');
  }

  // 5. Townhall & Executive Updates (Max 4)
  const townhallsEl = document.getElementById('homeTownhallsGrid');
  if (townhallsEl) {
    const townhallVideos = allAcc.filter(v => v.category.includes('Townhall') || v.department === 'Executive' || (v.tags && (v.tags.includes('meeting') || v.tags.includes('confidential')))).slice(0, 4);
    const displayList = townhallVideos.length > 0 ? townhallVideos : allAcc.slice(0, 4);
    townhallsEl.innerHTML = displayList.slice(0, 4).map(v => createVideoCardHtml(v)).join('');
  }

  // 6. Production & Mill Operations (Max 4)
  const operationsEl = document.getElementById('homeOperationsGrid');
  if (operationsEl) {
    const opVideos = allAcc.filter(v => v.department === 'Operations' || v.category.includes('Mill') || (v.tags && (v.tags.includes('scada') || v.tags.includes('rawmaterial')))).slice(0, 4);
    const displayList = opVideos.length > 0 ? opVideos : allAcc.slice(3, 7);
    operationsEl.innerHTML = displayList.slice(0, 4).map(v => createVideoCardHtml(v)).join('');
  }
}

function renderBiotechVideos() {
  renderHomeVideos();
}

function renderRecommendedVideos() {
  const container = document.getElementById('recommendedVideoGrid');
  if (!container) return;

  let list = state.accessibleVideos;
  if (state.recommendedFilter === 'biotech') list = list.filter(v => v.department === 'Biotech');
  if (state.recommendedFilter === 'safety') list = list.filter(v => v.tags.includes('safety') || v.tags.includes('protocols'));
  if (state.recommendedFilter === 'automation') list = list.filter(v => v.tags.includes('automation') || v.tags.includes('silo'));
  if (state.recommendedFilter === 'supply') list = list.filter(v => v.department === 'Raw Material');

  // Prioritize recommended
  list = [...list].sort((a, b) => {
    if ((b.is_recommended || 0) !== (a.is_recommended || 0)) {
      return (b.is_recommended || 0) - (a.is_recommended || 0);
    }
    return (b.views || 0) - (a.views || 0);
  });

  if (list.length === 0) {
    container.innerHTML = `<div class="col-span-full py-8 text-center text-xs text-gray-400">No recommended items under this filter.</div>`;
    return;
  }

  container.innerHTML = list.map(v => createVideoCardHtml(v)).join('');
}

function filterRecommendedCategory(cat) {
  state.recommendedFilter = cat;
  renderRecommendedVideos();
}

function renderContinueWatching() {
  const container = document.getElementById('continueWatchingGrid');
  if (!container) return;

  const inProgress = state.accessibleVideos.slice(0, 3);
  if (inProgress.length === 0) {
    container.innerHTML = `<div class="col-span-full py-8 text-center text-xs text-gray-400">No videos in progress.</div>`;
    return;
  }

  container.innerHTML = inProgress.map((v, idx) => {
    const mockProgress = [75, 45, 20][idx % 3];
    return `
      <div class="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col group cursor-pointer" onclick="openVideoPlayerModal(${v.id})">
        <div class="relative aspect-video bg-slate-900 overflow-hidden">
          <img src="${v.thumbnail_url}" class="w-full h-full object-cover group-hover:scale-105 transition-transform">
          <div class="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button class="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center shadow-lg">
              <span class="material-symbols-outlined fill text-2xl">play_arrow</span>
            </button>
          </div>
          <span class="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">${v.duration}</span>
          <div class="absolute bottom-0 left-0 right-0 h-1.5 bg-black/50">
            <div class="h-full bg-primary-container" style="width: ${mockProgress}%"></div>
          </div>
        </div>
        <div class="p-4 space-y-2 flex-1 flex flex-col justify-between">
          <div>
            <div class="flex items-center justify-between gap-2 mb-1">
              <span class="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded">${v.department}</span>
              <span class="text-[11px] text-gray-400 font-semibold">${mockProgress}% completed</span>
            </div>
            <h4 class="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2">${v.title}</h4>
          </div>
          <div class="flex items-center justify-between text-[11px] text-gray-400 pt-2 border-t border-slate-100">
            <span>Uploaded by ${v.uploaded_by}</span>
            <button class="text-primary font-bold hover:underline flex items-center gap-0.5">Resume <span class="material-symbols-outlined text-xs">arrow_forward</span></button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function renderFavorites() {
  const container = document.getElementById('favoritesVideoGrid');
  const countBadge = document.getElementById('favCountBadge');
  if (!container) return;

  const favList = state.accessibleVideos.filter(v => v.is_favorite);
  if (countBadge) countBadge.textContent = `${favList.length} Items`;

  if (favList.length === 0) {
    container.innerHTML = `
      <div class="col-span-full py-12 text-center bg-white rounded-2xl border border-dashed border-gray-300 p-8">
        <span class="material-symbols-outlined text-4xl text-rose-300 mb-2">favorite_border</span>
        <h4 class="text-sm font-bold text-gray-700">No Favorites Saved Yet</h4>
        <p class="text-xs text-gray-400 mt-1 max-w-md mx-auto">
          Click the heart icon on any authorized video card to save it here for quick access.
        </p>
      </div>
    `;
    return;
  }

  container.innerHTML = favList.map(v => createVideoCardHtml(v)).join('');
}

function renderWatchHistory() {
  const container = document.getElementById('watchHistoryContainer');
  if (!container) return;

  const historyList = state.accessibleVideos.slice(0, 5);
  if (historyList.length === 0) {
    container.innerHTML = `<div class="p-8 text-center text-xs text-gray-400">No watch history recorded.</div>`;
    return;
  }

  container.innerHTML = historyList.map((v, idx) => {
    const dates = ['Today at 10:45 AM', 'Yesterday at 15:20 PM', 'Aug 29, 2026', 'Aug 24, 2026', 'Aug 19, 2026'];
    return `
      <div class="p-4 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 cursor-pointer group" onclick="openVideoPlayerModal(${v.id})">
        <div class="flex items-center gap-3">
          <div class="w-20 h-12 rounded bg-slate-900 overflow-hidden relative shrink-0">
            <img src="${v.thumbnail_url}" class="w-full h-full object-cover">
            <span class="absolute bottom-0.5 right-0.5 bg-black/80 text-white text-[8px] font-bold px-1 rounded">${v.duration}</span>
          </div>
          <div>
            <div class="flex items-center gap-2 mb-0.5">
              <span class="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.2 rounded">${v.department}</span>
              ${getPermissionBadgeMarkup(v.permission_level)}
            </div>
            <h4 class="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">${v.title}</h4>
            <div class="text-[10px] text-gray-400">Watched on ${dates[idx % dates.length]}</div>
          </div>
        </div>
        <button class="px-3 py-1.5 border border-outline-variant rounded-lg text-xs font-semibold text-gray-600 group-hover:border-primary group-hover:text-primary transition-colors flex items-center gap-1">
          <span class="material-symbols-outlined text-sm">replay</span> Replay
        </button>
      </div>
    `;
  }).join('');
}

function clearWatchHistoryDemo() {
  showToast('Watch history cleared for current simulation persona', 'info');
}

function renderEvents() {
  const container = document.getElementById('eventsGrid');
  if (!container) return;

  container.innerHTML = state.events.map(e => `
    <div class="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden flex flex-col justify-between">
      <div class="aspect-video bg-slate-900 relative overflow-hidden">
        <img src="${e.thumbnail}" class="w-full h-full object-cover">
        <span class="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-bold bg-black/70 text-white backdrop-blur">${e.category}</span>
        <span class="absolute bottom-2 right-2 px-2 py-0.5 rounded text-[10px] font-bold ${e.status === 'Upcoming' ? 'bg-emerald-600 text-white' : 'bg-blue-600 text-white'}">${e.status}</span>
      </div>
      <div class="p-5 space-y-3 flex-1 flex flex-col justify-between">
        <div>
          <div class="text-[11px] font-semibold text-emerald-700 mb-1">${e.department} Special Event</div>
          <h3 class="text-sm font-bold text-gray-900 leading-snug">${e.title}</h3>
          <div class="space-y-1 mt-3 text-xs text-gray-500">
            <div class="flex items-center gap-1.5"><span class="material-symbols-outlined text-sm">calendar_today</span> ${e.date}</div>
            <div class="flex items-center gap-1.5"><span class="material-symbols-outlined text-sm">location_on</span> ${e.location}</div>
            <div class="flex items-center gap-1.5"><span class="material-symbols-outlined text-sm">person</span> ${e.speaker}</div>
          </div>
        </div>
        <div class="pt-3 border-t border-slate-100 flex items-center justify-between">
          ${e.status === 'Upcoming' ? `
            <button onclick="showToast('RSVP Confirmed for ${e.title}', 'success')" class="w-full py-2 bg-primary text-white font-bold text-xs rounded-lg hover:bg-emerald-800 transition-colors">
              RSVP for Live Stream
            </button>
          ` : `
            <button onclick="openVideoPlayerModal(${e.videoId || 1})" class="w-full py-2 bg-slate-100 hover:bg-slate-200 text-gray-800 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1">
              <span class="material-symbols-outlined text-sm">play_circle</span> Watch Recording
            </button>
          `}
        </div>
      </div>
    </div>
  `).join('');
}

function renderCategoriesDirectory(filterTab = 'all') {
  const container = document.getElementById('categoriesGrid');
  if (!container) return;

  let cats = [
    { title: 'Research & Whitepapers', icon: 'menu_book', color: 'bg-emerald-50 text-emerald-700', count: '4 Assets', desc: 'Cellular growth formulas, genetics, and peer-reviewed feed essays.', type: 'academic' },
    { title: 'Field Trials & Crop Reports', icon: 'analytics', color: 'bg-blue-50 text-blue-700', count: '3 Assets', desc: 'Drone surveys, multispectral yield metrics, and regional tests.', type: 'academic' },
    { title: 'Training & Safety Protocols', icon: 'school', color: 'bg-amber-50 text-amber-700', count: '2 Assets', desc: 'Spectrometry calibration, biohazard control, and OSHA lab safety.', type: 'operations' },
    { title: 'Townhall & Executive Briefs', icon: 'campaign', color: 'bg-purple-50 text-purple-700', count: '2 Assets', desc: 'Corporate direction, regional market expansion, and grain futures.', type: 'executive' },
    { title: 'Mill & SCADA Operations', icon: 'precision_manufacturing', color: 'bg-rose-50 text-rose-700', count: '3 Assets', desc: 'Automated silo controls, conveyor lines, and smart batching.', type: 'operations' },
    { title: 'Vendor Standards & Audits', icon: 'handshake', color: 'bg-teal-50 text-teal-700', count: '1 Asset', desc: 'Supplier quality certifications and raw ingredient assay criteria.', type: 'operations' },
    { title: 'Corporate Events & Symposia', icon: 'event', color: 'bg-indigo-50 text-indigo-700', count: '4 Conferences', desc: 'Annual summits, keynote livestreams, and panel recordings.', type: 'events' },
    { title: 'Meeting Recordings', icon: 'meeting_room', color: 'bg-fuchsia-50 text-fuchsia-700', count: '6 Townhalls', desc: 'Internal executive townhalls, technical synces, and team briefings.', type: 'meetings' }
  ];

  if (filterTab === 'academic') {
    cats = cats.filter(c => c.type === 'academic');
  }

  container.innerHTML = cats.map(c => `
    <div class="bg-white rounded-xl border border-outline-variant p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group" onclick="handleCategoryCardClick('${c.title}', '${c.type}')">
      <div class="space-y-3">
        <div class="flex items-center justify-between">
          <div class="w-10 h-10 rounded-xl ${c.color} flex items-center justify-center font-bold">
            <span class="material-symbols-outlined text-xl">${c.icon}</span>
          </div>
          <span class="text-xs font-bold text-gray-400">${c.count}</span>
        </div>
        <div>
          <h3 class="font-bold text-sm text-gray-900 group-hover:text-primary transition-colors">${c.title}</h3>
          <p class="text-xs text-gray-500 mt-1 leading-relaxed">${c.desc}</p>
        </div>
      </div>
      <div class="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-primary font-bold">
        <span>Browse Content</span>
        <span class="material-symbols-outlined text-sm">arrow_forward</span>
      </div>
    </div>
  `).join('');
}

function handleCategoryCardClick(title, type) {
  if (type === 'events') {
    filterCategoriesTab('events');
  } else if (type === 'meetings') {
    filterCategoriesTab('meetings');
  } else {
    openCategoryDetail(title);
  }
}

function filterCategoriesTab(tab) {
  document.querySelectorAll('.cat-tab-btn').forEach(b => {
    b.className = 'cat-tab-btn px-3 py-1.5 rounded-lg font-semibold text-gray-600 hover:text-gray-900';
  });
  const activeBtn = document.getElementById(`catTab-${tab}`);
  if (activeBtn) activeBtn.className = 'cat-tab-btn px-3 py-1.5 rounded-lg font-bold bg-white text-primary shadow-xs';

  const catGrid = document.getElementById('categoriesGrid');
  const eventsContainer = document.getElementById('integratedEventsContainer');
  const meetingsContainer = document.getElementById('integratedMeetingsContainer');

  if (!catGrid || !eventsContainer || !meetingsContainer) return;

  if (tab === 'all') {
    catGrid.classList.remove('hidden');
    eventsContainer.classList.add('hidden');
    meetingsContainer.classList.add('hidden');
    renderCategoriesDirectory('all');
  } else if (tab === 'academic') {
    catGrid.classList.remove('hidden');
    eventsContainer.classList.add('hidden');
    meetingsContainer.classList.add('hidden');
    renderCategoriesDirectory('academic');
  } else if (tab === 'events') {
    catGrid.classList.add('hidden');
    eventsContainer.classList.remove('hidden');
    meetingsContainer.classList.add('hidden');
    renderIntegratedEvents();
  } else if (tab === 'meetings') {
    catGrid.classList.add('hidden');
    eventsContainer.classList.add('hidden');
    meetingsContainer.classList.remove('hidden');
    renderIntegratedMeetings();
  }
}

function renderIntegratedEvents() {
  const container = document.getElementById('integratedEventsGrid');
  if (!container) return;

  container.innerHTML = state.events.map(e => `
    <div class="bg-white rounded-2xl border border-outline-variant shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow group">
      <div class="aspect-video w-full relative overflow-hidden bg-slate-900 cursor-pointer" onclick="openEventDetail(${e.id})">
        <img src="${e.banner_url || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=800'}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
        <div class="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
        <div class="absolute top-3 left-3 flex items-center gap-1.5">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${e.status === 'Live' ? 'bg-rose-600 text-white animate-pulse' : 'bg-primary text-white'}">${e.status || 'Upcoming'}</span>
          ${getPermissionBadgeMarkup(e.clearance_level || 'Standard')}
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
          <h3 class="font-bold text-gray-900 text-sm group-hover:text-primary transition-colors cursor-pointer line-clamp-2" onclick="openEventDetail(${e.id})">
            ${e.title}
          </h3>
          <p class="text-xs text-gray-500 mt-1.5 line-clamp-2 leading-relaxed">
            ${e.description || 'Pioneering agricultural advancements, symposium breakouts, and technical keynotes.'}
          </p>
        </div>
        <div class="pt-3 border-t border-outline-variant/60 flex items-center justify-between">
          <div class="text-[11px] font-semibold text-gray-800">${e.speaker || 'Keynote Speaker'}</div>
          <button onclick="openEventDetail(${e.id})" class="px-3 py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-lg text-xs font-bold transition-colors flex items-center gap-1">
            <span>View Details</span>
            <span class="material-symbols-outlined text-xs">arrow_forward</span>
          </button>
        </div>
      </div>
    </div>
  `).join('');
}

function renderIntegratedMeetings() {
  const container = document.getElementById('integratedMeetingsGrid');
  if (!container) return;

  const meetingVideos = state.accessibleVideos.filter(v => {
    return v.category.includes('Townhall') || v.category.includes('Meeting') || (v.tags && v.tags.includes('meeting')) || (v.title && v.title.toLowerCase().includes('townhall'));
  });

  const list = meetingVideos.length > 0 ? meetingVideos : state.accessibleVideos.slice(0, 6);
  container.innerHTML = list.map(v => createVideoCardHtml(v)).join('');
}

function submitClearanceRequest() {
  const level = document.getElementById('reqTargetLevel')?.value;
  const dept = document.getElementById('reqTargetDept')?.value;
  const reason = document.getElementById('reqReason')?.value.trim();

  if (!reason) {
    showToast('กรุณาระบุเหตุผลและความจำเป็นทางธุรกิจ', 'error');
    return;
  }

  showToast(`ส่งคำร้องขอสิทธิ์ [${level} - แผนก ${dept}] ไปยัง IT Admin เรียบร้อยแล้ว`, 'success');
  document.getElementById('reqReason').value = '';
}

function createVideoCardHtml(v) {
  const favIcon = v.is_favorite ? 'favorite' : 'favorite_border';
  const favClass = v.is_favorite ? 'text-rose-500 fill' : 'text-white hover:text-rose-400';
  const progressPercent = v.watch_progress || 0;
  const tagList = (v.tags || '').split(',').map(t => t.trim()).filter(Boolean).slice(0, 2);

  return `
    <div class="group bg-white rounded-xl border border-outline-variant shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col cursor-pointer" onclick="openVideoWatchPage(${v.id})">
      <!-- Thumbnail with Overlay -->
      <div class="relative aspect-video w-full bg-slate-900 overflow-hidden">
        <img src="${v.thumbnail_url || 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=600'}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
        
        <!-- Badges on Thumbnail -->
        <div class="absolute top-2 left-2 flex flex-col gap-1 items-start">
          ${v.is_featured ? `<span class="px-1.5 py-0.5 rounded bg-amber-500/90 text-slate-900 font-black text-[9px] flex items-center gap-0.5 shadow-sm"><span class="material-symbols-outlined text-[11px] fill">push_pin</span> PINNED</span>` : ''}
          ${v.is_recommended ? `<span class="px-1.5 py-0.5 rounded bg-emerald-600/90 text-white font-bold text-[9px] flex items-center gap-0.5 shadow-sm"><span class="material-symbols-outlined text-[11px] fill">star</span> REC</span>` : ''}
        </div>

        <!-- Duration Badge -->
        <span class="absolute bottom-2 right-2 bg-black/80 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
          ${v.duration}
        </span>

        <!-- Favorite Button -->
        <button onclick="event.stopPropagation(); toggleFavorite(${v.id})" class="absolute top-2 right-2 p-1.5 bg-black/40 hover:bg-black/70 rounded-full transition-colors ${favClass}">
          <span class="material-symbols-outlined text-base">${favIcon}</span>
        </button>

        <!-- Watch Progress Bar -->
        ${progressPercent > 0 ? `
          <div class="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
            <div class="h-full bg-primary-container" style="width: ${progressPercent}%"></div>
          </div>
        ` : ''}
      </div>

      <!-- Card Body -->
      <div class="p-4 flex-1 flex flex-col justify-between space-y-2.5">
        <div>
          <div class="flex items-center justify-between gap-2 mb-1.5">
            <span class="text-[10px] font-bold text-emerald-900 bg-emerald-100/90 px-2 py-0.5 rounded truncate max-w-[150px]">${v.category || 'General'}</span>
            ${getPermissionBadgeMarkup(v)}
          </div>
          <h4 class="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
            ${v.title}
          </h4>
          <div class="flex flex-wrap gap-1 mt-1.5">
            ${tagList.map(t => `<span class="text-[9px] font-mono text-gray-500 bg-slate-100 px-1.5 py-0.2 rounded">${t}</span>`).join('')}
          </div>
        </div>

        <div class="flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-gray-400">
          <span class="flex items-center gap-1">
            <span class="material-symbols-outlined text-xs">visibility</span> ${v.views.toLocaleString()} views
          </span>
          <span class="truncate max-w-[120px]">${v.uploaded_by || 'Staff'}</span>
        </div>
      </div>
    </div>
  `;
}

// ---------------- DEDICATED FULL-PAGE WATCH VIEW (YOUTUBE-STYLE) ----------------

async function openVideoWatchPage(videoId) {
  try {
    const res = await fetch(`/api/videos/${videoId}`);
    const json = await res.json();
    if (!json.success) {
      showToast('Cannot load video: ' + json.message, 'error');
      return;
    }
    const v = json.data;
    state.selectedVideo = v;
    state.activeWatchVideo = v;

    // Navigate to watch view
    navigateView('watch');

    // Auto-collapse sidebar to maximize video viewing space
    if (typeof setSidebarCollapsed === 'function') {
      setSidebarCollapsed(true);
    }

    // Populate Breadcrumbs
    const bcCat = document.getElementById('watchBreadcrumbCategory');
    const bcTitle = document.getElementById('watchBreadcrumbTitle');
    if (bcCat) bcCat.textContent = v.category || 'Category';
    if (bcTitle) bcTitle.textContent = v.title;

    // Populate Video Player
    const player = document.getElementById('watchVideoPlayer');
    const source = document.getElementById('watchVideoSource');
    if (player && source) {
      player.pause();
      source.src = v.video_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
      player.poster = v.thumbnail_url || '';
      player.load();
      player.play().catch(() => {});
    }

    // Populate Title & Metadata
    const titleEl = document.getElementById('watchVideoTitle');
    const authorEl = document.getElementById('watchAuthorName');
    const authorAvatar = document.getElementById('watchAuthorAvatar');
    const statsEl = document.getElementById('watchVideoStats');
    const catBadge = document.getElementById('watchCategoryBadge');
    const tagsContainer = document.getElementById('watchTagsContainer');
    const descEl = document.getElementById('watchVideoDesc');
    const favIcon = document.getElementById('watchFavIcon');
    const favText = document.getElementById('watchFavText');

    if (titleEl) titleEl.textContent = v.title;
    if (authorEl) authorEl.textContent = v.uploaded_by || 'Feedtech Knowledge Base';
    if (authorAvatar) {
      const initials = (v.uploaded_by || 'FT').split(' ').map(s => s[0]).join('').substring(0, 2).toUpperCase();
      authorAvatar.textContent = initials;
    }
    if (statsEl) statsEl.textContent = `${v.views.toLocaleString()} views • Uploaded on ${v.uploaded_at || 'Recent'}`;
    if (catBadge) catBadge.textContent = v.category || 'General';
    if (descEl) descEl.textContent = v.description || 'No detailed whitepaper abstract provided.';

    // Tags
    if (tagsContainer) {
      const tagsList = (v.tags || '').split(',').map(t => t.trim()).filter(Boolean);
      tagsContainer.innerHTML = tagsList.map(t => `
        <span onclick="handleTagSearch('${t}')" class="px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer border border-slate-200 transition-colors">
          ${t}
        </span>
      `).join('');
    }

    // Favorite state
    if (favIcon && favText) {
      favIcon.textContent = v.is_favorite ? 'favorite' : 'favorite_border';
      favIcon.className = v.is_favorite ? 'material-symbols-outlined text-base text-rose-500 fill' : 'material-symbols-outlined text-base text-gray-500';
      favText.textContent = v.is_favorite ? 'Favorited' : 'Favorite';
    }

    // Comments & Related
    renderWatchComments(v.comments || []);
    renderWatchRelatedVideos(v);

    // Record watch history
    await saveWatchProgress(v.id, 15, 100);

  } catch (err) {
    showToast('Failed to open video watch page', 'error');
  }
}

function renderWatchComments(comments) {
  const listEl = document.getElementById('watchCommentsList');
  const countEl = document.getElementById('watchCommentCount');
  if (countEl) countEl.textContent = `${comments.length} notes`;

  if (!listEl) return;
  if (comments.length === 0) {
    listEl.innerHTML = `<div class="py-6 text-center text-xs text-gray-400">No notes or discussion comments yet. Be the first to add one!</div>`;
    return;
  }

  listEl.innerHTML = comments.map(c => `
    <div class="pt-3 flex gap-3 items-start">
      <div class="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
        ${(c.user_name || 'U').substring(0, 2).toUpperCase()}
      </div>
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <span class="text-xs font-bold text-gray-900">${c.user_name}</span>
          <span class="text-[10px] text-gray-400 font-mono">${c.user_role || ''}</span>
          <span class="text-[10px] text-gray-400">• ${c.created_at || 'Just now'}</span>
        </div>
        <p class="text-xs text-gray-700 mt-1 leading-relaxed">${c.comment}</p>
      </div>
    </div>
  `).join('');
}

function renderWatchRelatedVideos(currentVideo) {
  const container = document.getElementById('watchRelatedList');
  if (!container) return;

  const pool = (state.accessibleVideos && state.accessibleVideos.length > 0) ? state.accessibleVideos : (state.allVideos || []);
  const otherVideos = pool.filter(v => v.id !== currentVideo.id);
  
  const related = otherVideos.sort((a, b) => {
    const aMatch = (a.category === currentVideo.category ? 2 : 0);
    const bMatch = (b.category === currentVideo.category ? 2 : 0);
    return bMatch - aMatch;
  }).slice(0, 8);

  if (related.length === 0) {
    container.innerHTML = `<div class="py-8 text-center text-xs text-gray-400">No additional related videos found.</div>`;
    return;
  }

  container.innerHTML = related.map(v => `
    <div class="flex gap-3 group cursor-pointer p-2 hover:bg-slate-100 rounded-xl transition-colors border border-transparent hover:border-outline-variant/60" onclick="openVideoWatchPage(${v.id})">
      <div class="relative w-36 aspect-video rounded-lg overflow-hidden shrink-0 bg-slate-900 shadow-2xs">
        <img src="${v.thumbnail_url || 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?w=400'}" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300">
        <span class="absolute bottom-1 right-1 bg-black/80 text-white text-[9px] font-bold px-1 py-0.5 rounded">${v.duration}</span>
      </div>
      <div class="flex flex-col justify-between py-0.5 flex-1 min-w-0">
        <div>
          <span class="text-[9px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded truncate inline-block max-w-[110px]">${v.category || 'General'}</span>
          <h4 class="text-xs font-bold text-gray-900 group-hover:text-primary transition-colors line-clamp-2 leading-snug mt-1">${v.title}</h4>
        </div>
        <div class="text-[10px] text-gray-400 flex items-center justify-between pt-1">
          <span>${v.views.toLocaleString()} views</span>
          <span class="truncate max-w-[70px]">${v.uploaded_by || ''}</span>
        </div>
      </div>
    </div>
  `).join('');
}

async function submitWatchComment() {
  const input = document.getElementById('watchCommentInput');
  const comment = input ? input.value.trim() : '';
  if (!comment || !state.activeWatchVideo) return;

  try {
    const res = await fetch(`/api/videos/${state.activeWatchVideo.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment })
    });
    const json = await res.json();
    if (json.success) {
      input.value = '';
      if (!state.activeWatchVideo.comments) state.activeWatchVideo.comments = [];
      state.activeWatchVideo.comments.unshift(json.data);
      renderWatchComments(state.activeWatchVideo.comments);
      showToast('Research note added successfully', 'success');
    }
  } catch (err) {
    showToast('Failed to post comment', 'error');
  }
}

function toggleWatchFavorite() {
  if (state.activeWatchVideo) {
    toggleFavorite(state.activeWatchVideo.id);
    const favIcon = document.getElementById('watchFavIcon');
    const favText = document.getElementById('watchFavText');
    state.activeWatchVideo.is_favorite = !state.activeWatchVideo.is_favorite;
    if (favIcon && favText) {
      favIcon.textContent = state.activeWatchVideo.is_favorite ? 'favorite' : 'favorite_border';
      favIcon.className = state.activeWatchVideo.is_favorite ? 'material-symbols-outlined text-base text-rose-500 fill' : 'material-symbols-outlined text-base text-gray-500';
      favText.textContent = state.activeWatchVideo.is_favorite ? 'Favorited' : 'Favorite';
    }
  }
}

function shareWatchVideo() {
  if (state.activeWatchVideo) {
    navigator.clipboard.writeText(window.location.origin + '?video=' + state.activeWatchVideo.video_id);
    showToast('Video shareable link copied to clipboard!', 'success');
  }
}

// ---------------- VIDEO PLAYER MODAL ----------------

async function openVideoPlayerModal(videoId) {
  try {
    const res = await fetch(`/api/videos/${videoId}`);
    const json = await res.json();
    if (!json.success) {
      showToast('Cannot load video: ' + json.message, 'error');
      return;
    }

    const v = json.data;
    state.activeVideo = v;

    // Track view in backend
    fetch(`/api/videos/${v.id}/watch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ progress: 65 })
    });

    document.getElementById('playerTitle').textContent = v.title;
    document.getElementById('playerDesc').textContent = v.description || 'No detailed description available.';
    document.getElementById('playerVidCode').textContent = v.video_id;
    document.getElementById('playerDeptBadge').textContent = v.department;
    document.getElementById('playerLevelBadge').outerHTML = getPermissionBadgeMarkup(v.permission_level);

    // Tags
    const tagsContainer = document.getElementById('playerTagsContainer');
    if (tagsContainer && v.tags) {
      const tagList = v.tags.split(',').map(t => t.trim());
      tagsContainer.innerHTML = tagList.map(t => `<span class="text-[10px] font-medium bg-slate-100 text-gray-600 px-2 py-0.5 rounded">${t}</span>`).join('');
    }

    // Video Source
    const player = document.getElementById('activeVideoPlayer');
    player.src = v.video_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
    player.load();
    player.play().catch(() => {});

    // Favorite button state
    const favBtn = document.getElementById('playerFavBtn');
    if (favBtn) {
      favBtn.innerHTML = v.is_favorite 
        ? `<span class="material-symbols-outlined text-sm text-rose-500 fill">favorite</span><span class="text-rose-600 font-bold">Favorited</span>`
        : `<span class="material-symbols-outlined text-sm">favorite_border</span><span>Favorite</span>`;
    }

    // Comments
    renderComments(json.comments || []);

    document.getElementById('videoPlayerModal').classList.remove('hidden');
  } catch (err) {
    showToast('Failed to open video player', 'error');
  }
}

function closeVideoPlayerModal() {
  const modal = document.getElementById('videoPlayerModal');
  const player = document.getElementById('activeVideoPlayer');
  if (player) {
    player.pause();
    player.src = '';
  }
  if (modal) modal.classList.add('hidden');
}

async function togglePlayerFavorite() {
  if (!state.activeVideo) return;
  await toggleFavorite(state.activeVideo.id);
  state.activeVideo.is_favorite = !state.activeVideo.is_favorite;
  const favBtn = document.getElementById('playerFavBtn');
  if (favBtn) {
    favBtn.innerHTML = state.activeVideo.is_favorite 
      ? `<span class="material-symbols-outlined text-sm text-rose-500 fill">favorite</span><span class="text-rose-600 font-bold">Favorited</span>`
      : `<span class="material-symbols-outlined text-sm">favorite_border</span><span>Favorite</span>`;
  }
}

function renderComments(comments) {
  const container = document.getElementById('commentsList');
  if (!container) return;
  if (comments.length === 0) {
    container.innerHTML = `<p class="text-[11px] text-gray-400 italic">No comments posted yet. Start the discussion!</p>`;
    return;
  }
  container.innerHTML = comments.map(c => `
    <div class="bg-slate-50 p-2.5 rounded-lg border border-slate-100 text-xs">
      <div class="flex items-center justify-between mb-1">
        <span class="font-bold text-gray-800">${c.user_name} <span class="text-[10px] font-normal text-gray-400">(${c.user_role})</span></span>
        <span class="text-[10px] text-gray-400">${c.created_at || 'Recently'}</span>
      </div>
      <p class="text-gray-600 leading-snug">${c.comment}</p>
    </div>
  `).join('');
}

async function submitComment() {
  const input = document.getElementById('newCommentInput');
  const comment = input.value.trim();
  if (!comment || !state.activeVideo) return;

  try {
    const res = await fetch(`/api/videos/${state.activeVideo.id}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ comment })
    });
    const json = await res.json();
    if (json.success) {
      input.value = '';
      showToast('Comment posted', 'success');
      // Re-fetch video details to refresh comment thread
      openVideoPlayerModal(state.activeVideo.id);
    }
  } catch (err) {
    showToast('Failed to post comment', 'error');
  }
}

async function toggleFavorite(videoId) {
  try {
    const res = await fetch(`/api/videos/${videoId}/favorite`, { method: 'POST' });
    const json = await res.json();
    if (json.success) {
      await loadAccessibleVideos();
      showToast(json.is_favorite ? 'Added to favorites' : 'Removed from favorites', 'info');
    }
  } catch (err) {
    showToast('Failed to update favorite', 'error');
  }
}



// ========================================================
// Feedtech Portal - Application Logic (Modular Architecture)
// ========================================================
// The codebase has been cleanly refactored from a single 3,400+ line monolithic file
// into distinct, single-responsibility modules in /public/js/:
//
// 1. public/js/state.js       (~180 lines) : Reactive state, i18n dictionary, toasts & helpers
// 2. public/js/auth.js        (~380 lines) : Persona switching, user accounts, security badges
// 3. public/js/navigation.js  (~125 lines) : View routing, search bar, sidebar highlighting
// 4. public/js/videos.js      (~617 lines) : Video feeds, player modal, watch history, favorites
// 5. public/js/categories.js  (~491 lines) : Categories Hub, Department tables, Townhalls
// 6. public/js/tags.js        (~614 lines) : Tags & subcategories, quick add/delete, tag picker
// 7. public/js/admin.js       (~1043 lines): Admin console, User & Video management, Upload, Matrix
// 8. public/js/main.js        (~47 lines)  : App bootstrap, DOM initialization & global shortcuts
//
// The complete legacy monolithic file is safely backed up at: public/app.js.bak
// ========================================================

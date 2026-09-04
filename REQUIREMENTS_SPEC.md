# 📋 Feedtech Video Portal — Technical & Requirements Specification
> **Document Version**: 2.0 (Updated 2026-09-04)
> **Status**: Approved & Implemented
> **Target Platform**: Enterprise Video Knowledge & Streaming Platform (CP Foods / Feedtech Research)

---

## 1. Executive Summary & Prototype Nature
Feedtech Video Portal is designed as a **high-fidelity interactive UI/UX prototype & mockup system** for corporate stakeholders to review, test, and validate user experience, taxonomy structures, access governance, and video streaming behaviors before production cloud rollout.

* **UI Framework**: Tailwind CSS (with responsive grid, flexbox, Material Symbols, and modern Bento-grid cards)
* **Architecture**: Vanilla ES6 reactive component patterns with local SQLite database (feedtech_dev.db) and Express REST API backend
* **Core Philosophy**: Zero mock data friction — all interactions (saving users, creating categories, uploading icons, pinning videos, toggling access) persist locally in real-time.

---

## 2. Global Terminology & Taxonomy Governance

### 2.1 Complete Eradication of Department
* **Rule**: The concept and word **Department** has been completely eliminated across the entire user interface and data models.
* **Replacement**: **Category (หมวดหมู่ความรู้ / เสาหลักอนุกรมวิธาน)**
* **Rationale**: Video content in the research portal represents academic, operational, and scientific domains (e.g. Biotechnology, Swine Nutrition, Precision Livestock Analytics, QC-Lab), rather than corporate departmental silos.
* **Separation from Tags**:
  * **Category**: Broad organizational pillars (18 primary domains) displayed with Material Symbols or custom uploaded icons.
  * **Tags (TBAC)**: Granular topic badges (e.g. #metabolism, #scada, #confidential, #patents) used for Tag-Based Access Control and multi-tag filtering.

---

## 3. Role & Permission Architecture (Admin vs Regular User)

The old ambiguous Video Access Authorization Level has been restructured into explicit role definitions:

| Role Type | Identifier | System Rights | Default Video Access |
| :--- | :--- | :--- | :--- |
| **🛡️ Administrator** | is_admin = 1 | • Full access to Admin Console & Deep Analytics<br>• Video Asset Management (Upload, Edit, Delete, Pin)<br>• Category Management (Add, Edit, Icon selection)<br>• Tag Management & Clearance Assignment<br>• User Management & Role Configuration<br>• System Audit Logs & CSV Export | Access to **ALL** videos (* wildcard access) |
| **👤 Regular User / Staff** | is_admin = 0 | • Access to User Portal (Home, Categories Hub, History, Favorites)<br>• Dedicated Watch Page & Fullscreen Player<br>• Meeting Recordings & Symposia viewing | Filtered by assigned **Category** and **Allowed Tags** (PBAC/TBAC gate) |

### 3.1 RBAC Simulation Mode & Persona Switcher
* Located on the top bar (#simulationControlBar).
* Allows testing the portal as different employees (e.g., Dr. Alice Smith, Swine Specialist, Plant Operator) or 👑 **Switch to Admin** with one click.
* Includes **Access Matrix** modal and **User Video Access Inspector** modal to verify what videos a specific user can view.

---

## 4. Navigation & Interface Ergonomics

### 4.1 Header & Top Navbar
* **Brand Identity**: Feedtech Portal with enterprise logo.
* **Sidebar Toggle Button (☰)**: Collapses the sidebar to an icon-only mini mode (64px) to maximize screen area for video watching and data tables without requiring full-screen mode.
* **Center Global Search**: Live search across video titles, descriptions, categories, and tags.
* **Quick Theme Toggle (🌙 / ☀️)**: Dark / Light mode switch located in top navigation.
* **Preferences Icon (tune)**: Web settings and preferences modal accessible directly next to the user avatar.
* **Authentication**: Dedicated Login Page (admin/admin and user/user) with session persistence and Logout button.

### 4.2 Sidebar Menu Structure
1. **User Portal**:
   * 🏠 **Home**: Hero carousel with auto-rotating pinned videos, Continue Watching strip, and Recommended video catalog.
   * 📂 **Categories (Expandable Accordion)**: Dropdown showing all 18 categories with dynamic video count badges, plus a link to the central **Categories Hub**.
   * 🕒 **History & Continue**: Tracks completed watch hours and resume points.
   * ❤️ **Favorites**: Quick access to bookmarked reference protocols.
2. **Admin Management** *(visible only to Admins)*:
   * 📊 **Dashboard Overview**: Bento-grid deep analytics, KPI cards, monthly consumption charts, and drill-downs. (*All redundant Import Video Link, Import Users, and Manage Access buttons removed per user request*).
   * 🎬 **Video Management**: Comprehensive asset table with Category, Tags, Access Mode, Pin/Rec controls, and Stats.
   * ➕ **+ เพิ่มวิดีโอ (Add Video)**: Dedicated, direct menu item leading straight to the Link Architecture Cloud Upload Hub.
   * 🏷️ **Category Management**: Dedicated Bento-grid view matching Stitch screen d6e1c51306154919b88d6a9433b52c7c.
   * 🔖 **Tag Management**: Unbundled from categories for fine-grained TBAC security.
   * 👥 **User Management**: Employee accounts table with Category, Allowed Tags, Role (🛡️ Admin / 👤 User), and Video Access Inspector.
   * 📋 **System Audit Logs**: Dedicated filterable audit history matching Stitch screen 395a8206f8004d51ab6fb069e032e214 with actor, event, and CSV export.

---

## 5. Category Management & Icon System

### 5.1 Add / Edit Category Modal (#categoryModal)
* **Elimination of BU Code**: Code (BU Code) removed since business unit codes are not currently utilized.
* **Category Name**: Descriptive academic or scientific category title.
* **Visual Icon Selection**:
  1. **Preset Icon Grid**: 18 curated Material Symbols icons ready for single-click selection (domain, biotech, science, pets, egg, water_drop, precision_manufacturing, feed, school, analytics, inventory_2, menu_book, eco, smart_toy, health_and_safety, coronavirus, psychology, campaign).
  2. **Custom Icon Upload**: Local file selector supporting PNG, SVG, and JPG image formats (converted into Base64 Data URL) or external image URL input.
  3. **Live Preview Badge**: Real-time display showing the active Material Symbol or uploaded custom image.
* **Category Description**: Free-text scope and objectives.

---

## 6. Video Upload Hub & Thumbnail Generation

### 6.1 Multi-Source Thumbnail System
* Per user directive, the thumbnail system offers two clean, reliable options:
  1. **Upload Custom Thumbnail from Computer**: Select an image file (16:9 aspect ratio recommended).
  2. **Extract Video Frame at Specific Second**: Play/scrub through the video or specify timestamp in seconds to capture high-definition frame directly from HTML5 video canvas.
  *(Automated department presets have been removed for simplicity and accuracy)*.

### 6.2 Video Link Architecture
* Supports direct MP4 video URLs, SharePoint embed streams, YouTube embed links, and local video demo assets.

---

## 7. Video Watch Page Experience
* **Full-Page YouTube-Style Layout**: Replaces basic modal popups with a dedicated 2-column layout (#view-watch).
* **Main Player Column (8 Cols)**: High-resolution video player, responsive 16:9 ratio, title, author credentials, description, related tags, and comments.
* **Sidebar Column (4 Cols)**: Up-Next video recommendations, related categories, and quick bookmarking.
* **No PDF download requirement**: Focused entirely on frictionless video streaming and learning.

---

## 8. Summary of Completed Directives
| Directive | Status | Notes |
| :--- | :---: | :--- |
| Remove Admin Dashboard buttons (Import Link, Import Users, Manage Access) | ✅ Completed | Cleaned up header; focused on deep analytics |
| Dedicated + เพิ่มวิดีโอ (Add Video) menu item | ✅ Completed | Placed in Admin Sidebar and as primary action in Video Management |
| Eradicate Department across the app | ✅ Completed | 100% converted to Category in all views, modals, filters, and headers |
| Replace Authorization Level with Admin vs User role | ✅ Completed | Configured in #userModal, table badges, and backend is_admin |
| Category Modal: Remove BU Code + Add Preset Icons + Custom Image Upload | ✅ Completed | 18 presets + file upload + URL + live preview badge |
| Dedicated Filterable Audit Logs | ✅ Completed | Matches Stitch design with event filter and CSV export |
| Home Auto-Rotating Hero Carousel | ✅ Completed | Seamless loop for pinned highlight videos with pause-on-hover |
| Mini Collapsible Sidebar (☰) | ✅ Completed | Expands workspace for video playback |
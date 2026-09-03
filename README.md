# Feedtech Video Portal — UX/UI Demo & RBAC Sandbox

Centralized, secure, and professional enterprise video management portal designed for internal corporate use with granular Role-Based Access Control (RBAC) and dynamic content visibility.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+ or v22+)

### Run Server
```bash
# 1. Install dependencies (if not already installed)
npm install

# 2. Start the local server
node server.js
# Or
npm start
```

### Access Demo Portal
Open your web browser and navigate to:
**[http://localhost:3000](http://localhost:3000)**

---

## 🎯 Key Features Implemented in Demo

### 1. 🧠 Interactive Persona Simulation Bar (Top Header)
- Instantly switch between different employee personas to test video visibility in real-time:
  - **Dr. Alice Smith**: Lead Scientist (Biotech) — *Highly Confidential*
  - **John Doe**: Facility Manager (Operations) — *Restricted*
  - **Maria Wong**: Senior Chemist (QC-Lab) — *Restricted*
  - **Somchai Prasert**: Swine Specialist (Swine) — *Restricted*
  - **Ananya Srisuk**: Poultry Nutritionist (Poultry) — *Standard*
  - **David Miller**: Procurement Officer (Raw Material) — *Standard*
  - **Kittisak Tech**: Super Admin (Executive) — *Full Portal Clearance*
  - Or switch to any **newly created user** directly!

### 2. 🛡️ Strict Content Visibility Engine
- **Secure Hiding Rule**: Videos that the active user is not authorized to view are **completely hidden from the UI** (no locked cards, no "access denied" placeholders).
- **Access Control Matrix**: Click the **"Access Matrix"** button to view an interactive full-matrix audit of every user vs every video with exact permission evaluation reasons.

### 3. 👥 User Management & Role Administration
- Add new corporate users with custom roles, department assignments, and clearance levels.
- Edit existing employee credentials and clearance.
- Toggle active/inactive account status.
- Export employee roster to **CSV**.
- Excel bulk-import template simulator.

### 4. 📹 Video Asset Catalog & Metadata Drawer
- Slide-out **Edit Drawer** to modify video metadata, tags, and security levels.
- Mark videos as hidden or archived.
- Search and multi-filter by department and clearance tier.

### 5. ☁️ Cloud Upload Hub (Link Architecture)
- Register SharePoint, OneDrive, or internal CDN video links.
- Assign departmental taxonomy, tags, and classification levels.

### 6. 💾 Local SQLite Database
- Fully persistent SQLite database (`feedtech_portal.sqlite`) storing users, 17 departments, video catalog, watch history, favorites, comments, and audit logs.

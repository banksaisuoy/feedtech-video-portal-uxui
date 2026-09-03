const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { DatabaseSync } = require('node:sqlite');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Initialize SQLite database
const dbPath = path.join(__dirname, 'feedtech_portal.sqlite');
const db = new DatabaseSync(dbPath);

// Initialize Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    emp_id TEXT UNIQUE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    department TEXT NOT NULL,
    role TEXT NOT NULL,
    permission_level TEXT NOT NULL, -- 'Standard', 'Restricted', 'Highly Confidential'
    is_admin INTEGER DEFAULT 0,
    status TEXT DEFAULT 'Active', -- 'Active', 'Inactive'
    avatar_url TEXT,
    avatar_color TEXT DEFAULT '#10b981',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS departments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    code TEXT NOT NULL,
    icon TEXT NOT NULL,
    description TEXT
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    icon TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tags (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    department TEXT DEFAULT 'General',
    clearance_level TEXT DEFAULT 'Standard', -- 'Standard', 'Restricted', 'Highly Confidential'
    description TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS videos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id TEXT UNIQUE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    department TEXT NOT NULL,
    category TEXT NOT NULL,
    permission_level TEXT NOT NULL, -- 'Standard', 'Restricted', 'Highly Confidential'
    duration TEXT NOT NULL,
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    thumbnail_url TEXT,
    video_url TEXT,
    tags TEXT,
    uploaded_by TEXT,
    uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
    is_hidden INTEGER DEFAULT 0,
    allow_downloads INTEGER DEFAULT 1,
    enable_comments INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS watch_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    video_id INTEGER NOT NULL,
    progress_percent INTEGER DEFAULT 0,
    watched_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, video_id)
  );

  CREATE TABLE IF NOT EXISTS favorites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    video_id INTEGER NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, video_id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    video_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    user_name TEXT NOT NULL,
    user_role TEXT NOT NULL,
    comment TEXT NOT NULL,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_name TEXT NOT NULL,
    actor_role TEXT NOT NULL,
    action TEXT NOT NULL,
    target TEXT NOT NULL,
    details TEXT,
    ip_address TEXT DEFAULT '127.0.0.1',
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    location TEXT NOT NULL,
    speaker TEXT NOT NULL,
    speaker_role TEXT,
    department TEXT DEFAULT 'General',
    clearance_level TEXT DEFAULT 'Standard',
    banner_url TEXT,
    video_url TEXT,
    status TEXT DEFAULT 'Upcoming',
    attendees_count INTEGER DEFAULT 0,
    materials_url TEXT,
    created_at TEXT DEFAULT CURRENT_TIMESTAMP
  );
`);

// Seed Initial Events if empty
const countEvents = db.prepare("SELECT COUNT(*) as count FROM events").get();
if (countEvents.count === 0) {
  const insertEvent = db.prepare(`
    INSERT INTO events (title, description, date, time, location, speaker, speaker_role, department, clearance_level, banner_url, video_url, status, attendees_count, materials_url)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertEvent.run(
    'Feedtech Annual Conference 2023',
    'Pioneering the future of agricultural technology. Access all keynote sessions, technical breakouts, and executive panels from our biggest event of the year.',
    '2026-10-12',
    '09:00 - 17:00 EST',
    'Chicago, IL (Hybrid Broadcast)',
    'Dr. Jonathan Vane',
    'VP of Agricultural Biotechnology',
    'Biotech',
    'Standard',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCUOT-RGlBy4dc_4zqFbk74uA0TgJW_sMGnZrmBsNzo-Vg1QFsgQXhnbK7bcpK089bm9hkI-cC_1FQkOS0kF7lXE-DCZZxXJLiN0LbHeEmh6RckPH1MNHJIT6F7QgZ_es-R5FzJxg3Rmks4Yl4BlnVU8RhVDhz7zcVCzdJqtEcqW9i5z6IBePFYVRYFxRI4OR3dt17WLmHv5cwwTobpF_YhHjir-cixxe86wC1lETeDemWy_UOsHUbXWLvmdpdDBJZ4xxI3FOg9e6YE',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    'Past',
    1240,
    'https://feedtech-my.sharepoint.com/events/2023-annual-materials.pdf'
  );
  insertEvent.run(
    'Swine Health & Precision Nutrition Symposium 2026',
    'Deep-dive into microbial gut health, immune enhancement through specialized peptides, and automated sow lactation monitoring systems.',
    '2026-03-24',
    '13:00 - 16:30 ICT',
    'Bangkok Headquarter & Live Stream',
    'Dr. Somchai Rattana',
    'Head of Swine Veterinary R&D',
    'Swine',
    'Restricted',
    'https://images.unsplash.com/photo-1516467508483-a7212febe31a?w=1200',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    'Upcoming',
    340,
    'https://feedtech-my.sharepoint.com/events/swine-2026-symposium.pdf'
  );
  insertEvent.run(
    'Biotech & Cellular Agriculture Innovation Summit',
    'Exclusive symposium covering microbial fermentation for alternative protein synthesis, CRISPR gene-edited enzymes, and confidential patent roadmaps.',
    '2026-04-18',
    '10:00 - 15:00 SGT',
    'Singapore Innovation Complex',
    'Dr. Alice Smith',
    'Lead Biotech Scientist',
    'Biotech',
    'Highly Confidential',
    'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?w=1200',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    'Upcoming',
    85,
    'https://feedtech-my.sharepoint.com/events/biotech-summit-confidential.pdf'
  );
  insertEvent.run(
    'QC-Lab NIR Spectroscopy & Grain Assay Training',
    'Standard operating protocol training for rapid chemical assay, NIR calibration curves, and mycotoxin detection across raw material processing plants.',
    '2026-05-05',
    '09:30 - 12:00 ICT',
    'QC-Lab Central & Teams Live',
    'Karn Bunsan',
    'QC Lead Chemist',
    'QC-Lab',
    'Standard',
    'https://images.unsplash.com/photo-1582719471384-894fbb16e074?w=1200',
    'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
    'Upcoming',
    215,
    'https://feedtech-my.sharepoint.com/events/qc-nir-standard.pdf'
  );
}

// Seed Initial Departments if empty
const countDepts = db.prepare("SELECT COUNT(*) as count FROM departments").get();
if (countDepts.count === 0) {
  const depts = [
    { name: 'Biotech', code: 'BIO', icon: 'science', description: 'Biotechnology & Genetic Research' },
    { name: 'Swine', code: 'SWN', icon: 'pets', description: 'Swine Nutrition & Genetics' },
    { name: 'Aquatic', code: 'AQU', icon: 'water', description: 'Aquaculture & Shrimp Feed Formulation' },
    { name: 'Poultry', code: 'PLT', icon: 'egg', description: 'Broiler & Layer Feed Innovation' },
    { name: 'QC-Lab', code: 'QCL', icon: 'biotech', description: 'Quality Control & Chemical Assay' },
    { name: 'Dairy', code: 'DRY', icon: 'local_cafe', description: 'Dairy Cattle Feed & Milk Yield' },
    { name: 'Dairy Process', code: 'DPR', icon: 'factory', description: 'Dairy Processing & Preservation' },
    { name: 'Extension Research', code: 'EXR', icon: 'travel_explore', description: 'Field Trial & Farm Extensions' },
    { name: 'Nutrition', code: 'NUT', icon: 'restaurant', description: 'Advanced Feed Nutrient Synthesis' },
    { name: 'Oversea', code: 'OVR', icon: 'public', description: 'Global Business & Oversea Mills' },
    { name: 'Premix', code: 'PMX', icon: 'grain', description: 'Micro-ingredient & Vitamin Premix' },
    { name: 'Raw Material', code: 'RMT', icon: 'inventory_2', description: 'Grain, Soy & Protein Procurement' },
    { name: 'Ruminant', code: 'RUM', icon: 'grass', description: 'Beef & Ruminant Feed Management' },
    { name: 'Ruminant Pathongchai', code: 'RPT', icon: 'location_on', description: 'Pathongchai Ruminant Complex' },
    { name: 'Supplier', code: 'SUP', icon: 'handshake', description: 'Vendor Standards & Raw Material Audit' },
    { name: 'Conference', code: 'CNF', icon: 'groups', description: 'Internal Technical Seminars & Keynotes' },
    { name: 'China', code: 'CHN', icon: 'language', description: 'China Regional Operations & Agri-Tech' }
  ];

  const insertDept = db.prepare("INSERT INTO departments (name, code, icon, description) VALUES (?, ?, ?, ?)");
  for (const d of depts) {
    insertDept.run(d.name, d.code, d.icon, d.description);
  }
}

// Seed Categories if empty
const countCats = db.prepare("SELECT COUNT(*) as count FROM categories").get();
if (countCats.count === 0) {
  const cats = [
    { name: 'Research & Whitepaper', icon: 'menu_book' },
    { name: 'Field Trials & Reports', icon: 'analytics' },
    { name: 'Training & Safety Protocols', icon: 'school' },
    { name: 'Townhall & Executive Updates', icon: 'campaign' },
    { name: 'Lab Demos & Assay Procedures', icon: 'biotech' },
    { name: 'Production & Mill Operations', icon: 'precision_manufacturing' }
  ];
  const insertCat = db.prepare("INSERT INTO categories (name, icon) VALUES (?, ?)");
  for (const c of cats) {
    insertCat.run(c.name, c.icon);
  }
}

// Seed Users if empty
const countUsers = db.prepare("SELECT COUNT(*) as count FROM users").get();
if (countUsers.count === 0) {
  const users = [
    {
      emp_id: 'EMP-1001',
      name: 'Dr. Alice Smith',
      email: 'a.smith@feedtech.com',
      department: 'Biotech',
      role: 'Lead Scientist',
      permission_level: 'Highly Confidential',
      is_admin: 0,
      status: 'Active',
      avatar_color: '#006c49'
    },
    {
      emp_id: 'EMP-1042',
      name: 'John Doe',
      email: 'j.doe@feedtech.com',
      department: 'Operations',
      role: 'Facility Manager',
      permission_level: 'Restricted',
      is_admin: 0,
      status: 'Active',
      avatar_color: '#2563eb'
    },
    {
      emp_id: 'EMP-0882',
      name: 'Maria Wong',
      email: 'm.wong@feedtech.com',
      department: 'QC-Lab',
      role: 'Senior Chemist',
      permission_level: 'Restricted',
      is_admin: 0,
      status: 'Active',
      avatar_color: '#d97706'
    },
    {
      emp_id: 'EMP-3011',
      name: 'Somchai Prasert',
      email: 's.prasert@feedtech.com',
      department: 'Swine',
      role: 'Swine Specialist',
      permission_level: 'Restricted',
      is_admin: 0,
      status: 'Active',
      avatar_color: '#db2777'
    },
    {
      emp_id: 'EMP-4099',
      name: 'Ananya Srisuk',
      email: 'a.srisuk@feedtech.com',
      department: 'Poultry',
      role: 'Poultry Nutritionist',
      permission_level: 'Standard',
      is_admin: 0,
      status: 'Active',
      avatar_color: '#7c3aed'
    },
    {
      emp_id: 'EMP-5501',
      name: 'David Miller',
      email: 'd.miller@feedtech.com',
      department: 'Raw Material',
      role: 'Procurement Officer',
      permission_level: 'Standard',
      is_admin: 0,
      status: 'Active',
      avatar_color: '#059669'
    },
    {
      emp_id: 'EMP-9999',
      name: 'Kittisak Tech (Admin)',
      email: 'admin@feedtech.com',
      department: 'Executive',
      role: 'System Administrator',
      permission_level: 'Highly Confidential',
      is_admin: 1,
      status: 'Active',
      avatar_color: '#10b981'
    }
  ];

  const insertUser = db.prepare(`
    INSERT INTO users (emp_id, name, email, department, role, permission_level, is_admin, status, avatar_color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const u of users) {
    insertUser.run(u.emp_id, u.name, u.email, u.department, u.role, u.permission_level, u.is_admin, u.status, u.avatar_color);
  }
}

// Seed Tags if empty
const countTags = db.prepare("SELECT COUNT(*) as count FROM tags").get();
if (countTags.count === 0) {
  const initialTags = [
    { name: '#biotech', department: 'Biotech', clearance_level: 'Highly Confidential', description: 'Advanced biotechnology, metabolic pathways, and strain engineering' },
    { name: '#cellular', department: 'Biotech', clearance_level: 'Highly Confidential', description: 'Cell culture, fermentation kinetics, and protein synthesis' },
    { name: '#genetics', department: 'Biotech', clearance_level: 'Highly Confidential', description: 'Gene editing, CRISPR, and genomic sequencing datasets' },
    { name: '#swine', department: 'Swine', clearance_level: 'Restricted', description: 'Swine herd management, breeding trials, and field health' },
    { name: '#nutrition', department: 'Swine', clearance_level: 'Restricted', description: 'Feed formulation algorithms and amino acid balance' },
    { name: '#poultry', department: 'Poultry', clearance_level: 'Standard', description: 'Broiler and layer nutrition and housing management' },
    { name: '#biosecurity', department: 'Regulatory', clearance_level: 'Restricted', description: 'Farm pathogen barrier protocols and disease quarantine' },
    { name: '#scada', department: 'Automation', clearance_level: 'Restricted', description: 'SCADA sensor telemetry, PLC control, and automated mill systems' },
    { name: '#safety', department: 'Safety & Env', clearance_level: 'Standard', description: 'Occupational safety and chemical handling standards' },
    { name: '#rawmaterial', department: 'Raw Material', clearance_level: 'Standard', description: 'Grain, corn, and soybean meal procurement index' },
    { name: '#qclab', department: 'QC-Lab', clearance_level: 'Restricted', description: 'Chemical spectrometry and chromatography assay procedures' },
    { name: '#confidential', department: 'Executive', clearance_level: 'Highly Confidential', description: 'Executive board strategy, patents, and confidential IP' },
    { name: '#general', department: 'General', clearance_level: 'Standard', description: 'Company-wide knowledge and standard orientations' },
    { name: '#standard', department: 'General', clearance_level: 'Standard', description: 'Open employee educational catalog' }
  ];

  const insertTag = db.prepare(`
    INSERT INTO tags (name, department, clearance_level, description)
    VALUES (?, ?, ?, ?)
  `);
  for (const t of initialTags) {
    insertTag.run(t.name, t.department, t.clearance_level, t.description);
  }
}

// Seed Videos if empty
const countVideos = db.prepare("SELECT COUNT(*) as count FROM videos").get();
if (countVideos.count === 0) {
  const sampleVideos = [
    {
      video_id: 'VID-8921',
      title: 'Q3 Drone Survey Analysis & Precision Yield Modeling',
      description: 'Detailed analysis of the Q3 drone flyover data across Southeast Asian crop sectors. Includes multispectral imaging breakdown, preliminary moisture metrics, and algorithmic yield estimates.',
      department: 'Biotech',
      category: 'Research & Whitepaper',
      permission_level: 'Highly Confidential',
      duration: '12:04',
      views: 1420,
      likes: 88,
      thumbnail_url: 'https://images.unsplash.com/photo-1508614589041-895b88991e3e?auto=format&fit=crop&w=800&q=80',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      tags: '#drones, #yield, #biotech, #precision-ag',
      uploaded_by: 'Dr. Alice Smith',
      uploaded_at: '2026-08-24 10:30:00'
    },
    {
      video_id: 'VID-8920',
      title: 'QC-Lab Safety Protocols & Chemical Spectrometry 2026',
      description: 'Official annual quality and safety standards for spectrometry instrumentation, chromatography maintenance, and hazardous reagent storage in all regional Feedtech QC labs.',
      department: 'QC-Lab',
      category: 'Training & Safety Protocols',
      permission_level: 'Standard',
      duration: '45:10',
      views: 3250,
      likes: 210,
      thumbnail_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=800&q=80',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      tags: '#safety, #laboratory, #spectrometry, #protocols',
      uploaded_by: 'Maria Wong',
      uploaded_at: '2026-08-22 14:15:00'
    },
    {
      video_id: 'VID-8919',
      title: 'New Silo Automated Control Panel Operating Tour',
      description: 'Walkthrough of the newly installed SCADA sensor dashboards, emergency ventilation controls, and automated temperature regulation systems at the main feed terminal.',
      department: 'Operations',
      category: 'Production & Mill Operations',
      permission_level: 'Restricted',
      duration: '05:30',
      views: 640,
      likes: 42,
      thumbnail_url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      tags: '#facilities, #silo, #operations, #automation',
      uploaded_by: 'John Doe',
      uploaded_at: '2026-08-20 09:00:00'
    },
    {
      video_id: 'VID-8918',
      title: 'Pathogen Resistance Protocols in New Swine Breeds',
      description: 'Comprehensive epidemiological field trial report examining gut biome resilience and probiotic feed additives in third-generation swine breeds.',
      department: 'Swine',
      category: 'Field Trials & Reports',
      permission_level: 'Restricted',
      duration: '18:45',
      views: 1205,
      likes: 95,
      thumbnail_url: 'https://images.unsplash.com/photo-1516467508483-a7212febe31a?auto=format&fit=crop&w=800&q=80',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      tags: '#swine, #pathogen, #feed-formula, #genetics',
      uploaded_by: 'Somchai Prasert',
      uploaded_at: '2026-08-19 16:45:00'
    },
    {
      video_id: 'VID-8917',
      title: 'Poultry Layer Facility Smart Automation Setup Guide v2',
      description: 'Step-by-step engineering guidelines for commissioning automated egg collection conveyors, infrared climate adjusters, and robotic feeding lines.',
      department: 'Poultry',
      category: 'Production & Mill Operations',
      permission_level: 'Standard',
      duration: '08:45',
      views: 890,
      likes: 67,
      thumbnail_url: 'https://images.unsplash.com/photo-1548550023-2bdb3c5beed7?auto=format&fit=crop&w=800&q=80',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      tags: '#poultry, #automation, #layers, #engineering',
      uploaded_by: 'Ananya Srisuk',
      uploaded_at: '2026-08-18 11:20:00'
    },
    {
      video_id: 'VID-8916',
      title: 'Understanding Cellular Growth Rates in Premium Feed',
      description: 'Microscopic and metabolic evaluation of cellular protein synthesis under varied micro-mineral concentrations. Proprietary patent-pending formula research.',
      department: 'Biotech',
      category: 'Research & Whitepaper',
      permission_level: 'Highly Confidential',
      duration: '22:10',
      views: 3400,
      likes: 290,
      thumbnail_url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyBlazes.mp4',
      tags: '#biotech, #metabolism, #cellular, #confidential',
      uploaded_by: 'Dr. Alice Smith',
      uploaded_at: '2026-08-15 08:30:00'
    },
    {
      video_id: 'VID-8915',
      title: 'Global Raw Material Supply Outlook & Risk Mitigation',
      description: 'Quarterly macro-economic analysis on soybean meal, corn futures, and shipping lane logistics across the Pacific trade corridor.',
      department: 'Raw Material',
      category: 'Townhall & Executive Updates',
      permission_level: 'Standard',
      duration: '31:15',
      views: 2150,
      likes: 140,
      thumbnail_url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?auto=format&fit=crop&w=800&q=80',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerMeltdowns.mp4',
      tags: '#procurement, #supplychain, #logistics, #commodities',
      uploaded_by: 'David Miller',
      uploaded_at: '2026-08-12 13:00:00'
    },
    {
      video_id: 'VID-8914',
      title: 'Aquatic Shrimp Feed Pellet Stability & Water Dissolution Trials',
      description: 'Experimental testing of water-stable binder compounds in saltwater shrimp diets to prevent nutrient leaching and optimize FCR (Feed Conversion Ratio).',
      department: 'Aquatic',
      category: 'Field Trials & Reports',
      permission_level: 'Restricted',
      duration: '14:20',
      views: 980,
      likes: 74,
      thumbnail_url: 'https://images.unsplash.com/photo-1535591273668-578e31182c4f?auto=format&fit=crop&w=800&q=80',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4',
      tags: '#aquatic, #shrimp, #pellet, #fcr',
      uploaded_by: 'Somchai Prasert',
      uploaded_at: '2026-08-10 15:10:00'
    },
    {
      video_id: 'VID-8913',
      title: 'Dairy Process Micro-filtration and Ultra-pasteurization Specs',
      description: 'Technical specs for high-efficiency temperature-controlled membrane filtration in milk separation lines.',
      department: 'Dairy Process',
      category: 'Production & Mill Operations',
      permission_level: 'Restricted',
      duration: '19:50',
      views: 730,
      likes: 51,
      thumbnail_url: 'https://images.unsplash.com/photo-1527153857715-3908f2bae5e8?auto=format&fit=crop&w=800&q=80',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackSeeTheWorld.mp4',
      tags: '#dairy, #pasteurization, #membrane, #processing',
      uploaded_by: 'John Doe',
      uploaded_at: '2026-08-05 11:00:00'
    },
    {
      video_id: 'VID-8912',
      title: 'China Regional Feed Market Strategy & High-Density Facilities',
      description: 'Executive briefing on modern multi-story swine farming facilities and automated feed distribution networks across Northern China.',
      department: 'China',
      category: 'Townhall & Executive Updates',
      permission_level: 'Highly Confidential',
      duration: '28:40',
      views: 1100,
      likes: 95,
      thumbnail_url: 'https://images.unsplash.com/photo-1477959858617-67f30bc75b82?auto=format&fit=crop&w=800&q=80',
      video_url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
      tags: '#china, #strategy, #executive, #confidential',
      uploaded_by: 'Kittisak Tech (Admin)',
      uploaded_at: '2026-08-01 09:30:00'
    }
  ];

  const insertVideo = db.prepare(`
    INSERT INTO videos (video_id, title, description, department, category, permission_level, duration, views, likes, thumbnail_url, video_url, tags, uploaded_by, uploaded_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const v of sampleVideos) {
    insertVideo.run(v.video_id, v.title, v.description, v.department, v.category, v.permission_level, v.duration, v.views, v.likes, v.thumbnail_url, v.video_url, v.tags, v.uploaded_by, v.uploaded_at);
  }
}

// Seed Audit Logs if empty
const countLogs = db.prepare("SELECT COUNT(*) as count FROM audit_logs").get();
if (countLogs.count === 0) {
  const initialLogs = [
    { actor_name: 'Kittisak Tech (Admin)', actor_role: 'System Administrator', action: 'USER_ROLE_UPDATE', target: 'Alice Smith (EMP-1001)', details: 'Upgraded permission level to Highly Confidential for Biotech projects.' },
    { actor_name: 'Maria Wong', actor_role: 'Senior Chemist', action: 'VIDEO_METADATA_EDIT', target: 'VID-8920', details: 'Updated lab safety compliance tags and duration.' },
    { actor_name: 'Dr. Alice Smith', actor_role: 'Lead Scientist', action: 'VIDEO_UPLOAD', target: 'VID-8921', details: 'Uploaded Q3 Drone Survey Analysis with Highly Confidential classification.' },
    { actor_name: 'John Doe', actor_role: 'Facility Manager', action: 'PERMISSION_POLICY_CHECK', target: 'Operations Portal', details: 'Automated policy sync for Operations department members.' }
  ];
  const insertLog = db.prepare("INSERT INTO audit_logs (actor_name, actor_role, action, target, details) VALUES (?, ?, ?, ?, ?)");
  for (const l of initialLogs) {
    insertLog.run(l.actor_name, l.actor_role, l.action, l.target, l.details);
  }
}

// Ensure allowed_tags column exists
try {
  db.exec(`ALTER TABLE users ADD COLUMN allowed_tags TEXT DEFAULT '#general, #standard';`);
} catch (e) {}

// Add Person-based Access Control columns to videos table
try {
  db.exec(`ALTER TABLE videos ADD COLUMN access_mode TEXT DEFAULT 'public';`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE videos ADD COLUMN allowed_user_ids TEXT DEFAULT '[]';`);
} catch (e) {}
try {
  db.exec(`ALTER TABLE videos ADD COLUMN excluded_user_ids TEXT DEFAULT '[]';`);
} catch (e) {}

// Seed / Update user tags for tag-based access control
try {
  db.prepare("UPDATE users SET allowed_tags = '#biotech, #cellular, #metabolism, #genetics, #confidential, #research, #general' WHERE email = 'a.smith@feedtech.com'").run();
  db.prepare("UPDATE users SET allowed_tags = '#operations, #scada, #automation, #facility, #restricted, #safety, #general' WHERE email = 'j.doe@feedtech.com'").run();
  db.prepare("UPDATE users SET allowed_tags = '#qclab, #assay, #spectrometry, #chemistry, #restricted, #standards, #general' WHERE email = 'm.wong@feedtech.com'").run();
  db.prepare("UPDATE users SET allowed_tags = '#swine, #nutrition, #biosecurity, #fieldtrials, #restricted, #general' WHERE email = 's.prasert@feedtech.com'").run();
  db.prepare("UPDATE users SET allowed_tags = '#poultry, #layers, #broiler, #nutrition, #general, #standard' WHERE email = 'a.srisuk@feedtech.com'").run();
  db.prepare("UPDATE users SET allowed_tags = '#rawmaterial, #procurement, #supplychain, #logistics, #commodities, #general, #standard' WHERE email = 'd.miller@feedtech.com'").run();
  db.prepare("UPDATE users SET allowed_tags = '*' WHERE email = 'admin@feedtech.com'").run();
} catch (e) {}

// Ensure Executive & Key Research Personas exist (Clean Corporate Profiles)
try {
  // Update any existing nicknames in database
  db.prepare("UPDATE users SET name = 'Nuntana W.', role = 'Executive Director' WHERE name LIKE '%Noi%' OR email LIKE '%noi%'").run();
  db.prepare("UPDATE users SET name = 'Thanawat R.', role = 'Senior R&D Lead' WHERE name LIKE '%Noom%' OR email LIKE '%noom%'").run();
  db.prepare("UPDATE users SET name = 'Gunnthanat K.', role = 'Engineering Team Lead' WHERE name LIKE '%Gunnthanat%' OR email LIKE '%gunnthanat%'").run();

  const existingNoi = db.prepare("SELECT * FROM users WHERE email = 'noi.exec@feedtech.com'").get();
  if (!existingNoi) {
    db.prepare("INSERT INTO users (emp_id, name, email, department, role, permission_level, is_admin, status, avatar_color, allowed_tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      'VIP-001', 'Nuntana W.', 'noi.exec@feedtech.com', 'Executive', 'Executive Director', 'Standard', 0, 'Active', '#8b5cf6', '*'
    );
  }
  const existingNoom = db.prepare("SELECT * FROM users WHERE email = 'noom.rd@feedtech.com'").get();
  if (!existingNoom) {
    db.prepare("INSERT INTO users (emp_id, name, email, department, role, permission_level, is_admin, status, avatar_color, allowed_tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      'EMP-1002', 'Thanawat R.', 'noom.rd@feedtech.com', 'Biotech', 'Senior R&D Lead', 'Standard', 0, 'Active', '#0284c7', '#biotech, #research'
    );
  }
  const existingGunn = db.prepare("SELECT * FROM users WHERE email = 'gunnthanat@feedtech.com'").get();
  if (!existingGunn) {
    db.prepare("INSERT INTO users (emp_id, name, email, department, role, permission_level, is_admin, status, avatar_color, allowed_tags) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(
      'EMP-1003', 'Gunnthanat K.', 'gunnthanat@feedtech.com', 'Operations', 'Engineering Team Lead', 'Standard', 1, 'Active', '#059669', '*'
    );
  }
} catch (e) {}

// Update videos with Person-Based Access sample configurations
try {
  db.prepare("UPDATE videos SET access_mode = 'include', allowed_user_ids = '[1, 4, 7, 8, 9, 10]' WHERE video_id = 'VID-8921'").run();
  db.prepare("UPDATE videos SET access_mode = 'public', allowed_user_ids = '[]', excluded_user_ids = '[]' WHERE video_id = 'VID-8920'").run();
  db.prepare("UPDATE videos SET access_mode = 'exclude', excluded_user_ids = '[6]' WHERE video_id = 'VID-8919'").run();
  db.prepare("UPDATE videos SET access_mode = 'include', allowed_user_ids = '[1, 4, 9]' WHERE video_id = 'VID-8918'").run();
  db.prepare("UPDATE videos SET access_mode = 'public' WHERE video_id = 'VID-8917'").run();
  db.prepare("UPDATE videos SET access_mode = 'include', allowed_user_ids = '[1, 7, 9, 10, 11]' WHERE video_id = 'VID-8916'").run();
  db.prepare("UPDATE videos SET access_mode = 'public' WHERE video_id = 'VID-8915'").run();
  db.prepare("UPDATE videos SET access_mode = 'exclude', excluded_user_ids = '[5]' WHERE video_id = 'VID-8914'").run();
  db.prepare("UPDATE videos SET access_mode = 'public' WHERE video_id = 'VID-8913'").run();
  db.prepare("UPDATE videos SET access_mode = 'include', allowed_user_ids = '[7, 9, 11]' WHERE video_id = 'VID-8912'").run();
} catch (e) {}

// Global active simulation user in memory (defaults to Dr. Alice Smith)
let currentSimulatedUserId = 1;

// Person-Based Access Control (PBAC) Evaluation Engine (Public, Include Whitelist, Exclude Blacklist)
function evaluateVideoAccess(user, video) {
  if (!user || user.status !== 'Active') return { allowed: false, reason: 'User inactive or not found' };
  
  // Rule 1: Super Admin / Executive admin has full visibility always
  if (user.is_admin === 1 || user.role === 'System Administrator' || user.department === 'Executive') {
    return { allowed: true, reason: '👑 ผู้ดูแลระบบ (Full Administrator Access)' };
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

  // Rule 3: Include Mode (Whitelist) - Only explicitly listed individuals can view
  if (accessMode === 'include') {
    const isIncluded = allowedUsers.includes(user.id) || allowedUsers.includes(String(user.id)) || (video.uploaded_by && video.uploaded_by.includes(user.name));
    if (isIncluded) {
      return { 
        allowed: true, 
        reason: `👥 สิทธิ์เฉพาะบุคคล (Include): บัญชีของคุณอยู่ในรายชื่อผู้ได้รับอนุญาต (${allowedUsers.length} ท่าน)` 
      };
    }
    return { 
      allowed: false, 
      reason: `⛔ สิทธิ์เฉพาะบุคคล: วิดีโอนี้จำกัดสิทธิ์เฉพาะรายชื่อบุคคลที่กำหนดเท่านั้น (${allowedUsers.length} ท่าน)` 
    };
  }

  // Rule 4: Exclude Mode (Blacklist) - Everyone can view EXCEPT listed individuals
  if (accessMode === 'exclude') {
    const isExcluded = excludedUsers.includes(user.id) || excludedUsers.includes(String(user.id));
    if (isExcluded) {
      return { 
        allowed: false, 
        reason: `⛔ ถูกจำกัดสิทธิ์ (Exclude): บัญชีของคุณอยู่ในรายชื่อที่ยกเว้นการเข้าถึง` 
      };
    }
    return { 
      allowed: true, 
      reason: `🌐 เข้าถึงได้ทั่วไป (ยกเว้นเฉพาะบุคคล ${excludedUsers.length} ท่าน)` 
    };
  }

  // Rule 5: Public - Open to all active company members
  return { 
    allowed: true, 
    reason: '🌐 สาธารณะ (Public): พนักงานทุกคนในองค์กรเข้าถึงได้' 
  };
}

// ---------------- API ROUTES ----------------

// Get all users
app.get('/api/users', (req, res) => {
  const users = db.prepare("SELECT * FROM users ORDER BY id ASC").all();
  res.json({ success: true, data: users });
});

// Get current simulated user
app.get('/api/current-user', (req, res) => {
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(currentSimulatedUserId);
  if (!user) {
    const fallback = db.prepare("SELECT * FROM users LIMIT 1").get();
    currentSimulatedUserId = fallback.id;
    return res.json({ success: true, data: fallback });
  }
  res.json({ success: true, data: user });
});

// Switch simulated active user persona
app.post('/api/current-user/switch', (req, res) => {
  const { userId } = req.body;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  currentSimulatedUserId = user.id;

  // Log persona switch in audit
  db.prepare("INSERT INTO audit_logs (actor_name, actor_role, action, target, details) VALUES (?, ?, ?, ?, ?)")
    .run('Simulation Switcher', 'Tester', 'PERSONA_SWITCH', user.name, `Active viewing persona changed to ${user.name} (${user.department} / ${user.permission_level})`);

  res.json({ success: true, message: `Switched persona to ${user.name}`, data: user });
});

// Create new user
app.post('/api/users', (req, res) => {
  const { emp_id, name, email, department, role, permission_level, is_admin, status, allowed_tags } = req.body;
  if (!name || !email || !department) {
    return res.status(400).json({ success: false, message: 'Missing required fields' });
  }

  try {
    const autoEmpId = emp_id || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;
    const colors = ['#10b981', '#2563eb', '#8b5cf6', '#d97706', '#db2777', '#059669'];
    const avatar_color = colors[Math.floor(Math.random() * colors.length)];

    const result = db.prepare(`
      INSERT INTO users (emp_id, name, email, department, role, permission_level, is_admin, status, avatar_color, allowed_tags)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      autoEmpId,
      name,
      email,
      department,
      role || 'Employee',
      permission_level || 'Standard',
      is_admin ? 1 : 0,
      status || 'Active',
      avatar_color,
      allowed_tags || '#general, #standard'
    );

    const currentUser = db.prepare("SELECT * FROM users WHERE id = ?").get(currentSimulatedUserId);
    db.prepare("INSERT INTO audit_logs (actor_name, actor_role, action, target, details) VALUES (?, ?, ?, ?, ?)")
      .run(currentUser ? currentUser.name : 'System Admin', currentUser ? currentUser.role : 'Admin', 'USER_CREATE', name, `Created user ${autoEmpId} with allowed tags: [${allowed_tags || '#general'}]`);

    const newUser = db.prepare("SELECT * FROM users WHERE id = ?").get(result.lastInsertRowid);
    res.json({ success: true, message: 'User created successfully', data: newUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update user
app.put('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  const { name, email, department, role, permission_level, is_admin, status, allowed_tags } = req.body;

  try {
    db.prepare(`
      UPDATE users 
      SET name = COALESCE(?, name),
          email = COALESCE(?, email),
          department = COALESCE(?, department),
          role = COALESCE(?, role),
          permission_level = COALESCE(?, permission_level),
          is_admin = COALESCE(?, is_admin),
          status = COALESCE(?, status),
          allowed_tags = COALESCE(?, allowed_tags)
      WHERE id = ?
    `).run(name, email, department, role, permission_level, is_admin !== undefined ? (is_admin ? 1 : 0) : null, status, allowed_tags, userId);

    const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);

    const currentUser = db.prepare("SELECT * FROM users WHERE id = ?").get(currentSimulatedUserId);
    db.prepare("INSERT INTO audit_logs (actor_name, actor_role, action, target, details) VALUES (?, ?, ?, ?, ?)")
      .run(currentUser ? currentUser.name : 'Admin', currentUser ? currentUser.role : 'Admin', 'USER_UPDATE', updatedUser.name, `Updated allowed tags to [${updatedUser.allowed_tags}]`);

    res.json({ success: true, message: 'User updated successfully', data: updatedUser });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Toggle user status (Active / Inactive)
app.patch('/api/users/:id/toggle-status', (req, res) => {
  const userId = req.params.id;
  const user = db.prepare("SELECT * FROM users WHERE id = ?").get(userId);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
  db.prepare("UPDATE users SET status = ? WHERE id = ?").run(nextStatus, userId);

  const currentUser = db.prepare("SELECT * FROM users WHERE id = ?").get(currentSimulatedUserId);
  db.prepare("INSERT INTO audit_logs (actor_name, actor_role, action, target, details) VALUES (?, ?, ?, ?, ?)")
    .run(currentUser ? currentUser.name : 'Admin', currentUser ? currentUser.role : 'Admin', 'USER_STATUS_TOGGLE', user.name, `Changed account status from ${user.status} to ${nextStatus}`);

  res.json({ success: true, message: `User status changed to ${nextStatus}`, data: { ...user, status: nextStatus } });
});

// Get departments
app.get('/api/departments', (req, res) => {
  const depts = db.prepare("SELECT * FROM departments ORDER BY name ASC").all();
  // Get video count per department
  const counts = db.prepare("SELECT department, COUNT(*) as count FROM videos GROUP BY department").all();
  const countMap = {};
  counts.forEach(c => { countMap[c.department] = c.count; });

  const data = depts.map(d => ({
    ...d,
    video_count: countMap[d.name] || 0
  }));

  res.json({ success: true, data });
});

// Create department
app.post('/api/departments', (req, res) => {
  const { name, code, icon, description } = req.body;
  if (!name || !code) return res.status(400).json({ success: false, message: 'Name and Code required' });
  try {
    const result = db.prepare("INSERT INTO departments (name, code, icon, description) VALUES (?, ?, ?, ?)").run(name, code, icon || 'folder', description || '');
    const newDept = db.prepare("SELECT * FROM departments WHERE id = ?").get(result.lastInsertRowid);
    res.json({ success: true, message: 'Department created', data: newDept });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get categories
app.get('/api/categories', (req, res) => {
  const cats = db.prepare("SELECT * FROM categories ORDER BY id ASC").all();
  const counts = db.prepare("SELECT category, COUNT(*) as count FROM videos GROUP BY category").all();
  const countMap = {};
  counts.forEach(c => { countMap[c.category] = c.count; });

  const data = cats.map(c => ({
    ...c,
    video_count: countMap[c.name] || 0
  }));
  res.json({ success: true, data });
});

// Create category
app.post('/api/categories', (req, res) => {
  const { name, icon } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Name required' });
  try {
    const result = db.prepare("INSERT INTO categories (name, icon) VALUES (?, ?)").run(name, icon || 'category');
    const newCat = db.prepare("SELECT * FROM categories WHERE id = ?").get(result.lastInsertRowid);
    res.json({ success: true, message: 'Category created', data: newCat });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update category
app.put('/api/categories/:id', (req, res) => {
  const { name, icon } = req.body;
  try {
    db.prepare("UPDATE categories SET name = COALESCE(?, name), icon = COALESCE(?, icon) WHERE id = ?").run(name, icon, req.params.id);
    const updated = db.prepare("SELECT * FROM categories WHERE id = ?").get(req.params.id);
    res.json({ success: true, message: 'Category updated', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete category
app.delete('/api/categories/:id', (req, res) => {
  try {
    db.prepare("DELETE FROM categories WHERE id = ?").run(req.params.id);
    res.json({ success: true, message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ---------------- TAG GOVERNANCE & PERMISSION APIS ----------------

// Get all tags with usage statistics
app.get('/api/tags', (req, res) => {
  try {
    const tags = db.prepare("SELECT * FROM tags ORDER BY name ASC").all();
    const allVideos = db.prepare("SELECT tags FROM videos").all();
    const allUsers = db.prepare("SELECT allowed_tags FROM users").all();

    const data = tags.map(t => {
      const cleanTagName = t.name.replace(/^#/, '').toLowerCase();
      
      // Count matching videos
      const videoCount = allVideos.filter(v => {
        if (!v.tags) return false;
        return v.tags.toLowerCase().includes(cleanTagName);
      }).length;

      // Count matching authorized users
      const userCount = allUsers.filter(u => {
        if (!u.allowed_tags) return false;
        if (u.allowed_tags === '*' || u.allowed_tags.includes('*')) return true;
        return u.allowed_tags.toLowerCase().includes(cleanTagName);
      }).length;

      return {
        ...t,
        video_count: videoCount,
        user_count: userCount
      };
    });

    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Create new Tag
app.post('/api/tags', (req, res) => {
  const { name, department, clearance_level, description } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Tag name is required' });

  const formattedName = name.startsWith('#') ? name.toLowerCase() : `#${name.toLowerCase()}`;

  try {
    const result = db.prepare(`
      INSERT INTO tags (name, department, clearance_level, description)
      VALUES (?, ?, ?, ?)
    `).run(formattedName, department || 'General', clearance_level || 'Standard', description || '');

    const currentUser = db.prepare("SELECT * FROM users WHERE id = ?").get(currentSimulatedUserId);
    db.prepare("INSERT INTO audit_logs (actor_name, actor_role, action, target, details) VALUES (?, ?, ?, ?, ?)")
      .run(currentUser ? currentUser.name : 'Admin', currentUser ? currentUser.role : 'Admin', 'TAG_CREATE', formattedName, `Created security tag ${formattedName} with clearance [${clearance_level || 'Standard'}]`);

    const newTag = db.prepare("SELECT * FROM tags WHERE id = ?").get(result.lastInsertRowid);
    res.json({ success: true, message: 'Tag created successfully', data: newTag });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update Tag
app.put('/api/tags/:id', (req, res) => {
  const { name, department, clearance_level, description } = req.body;
  const tagId = req.params.id;

  try {
    const existing = db.prepare("SELECT * FROM tags WHERE id = ?").get(tagId);
    if (!existing) return res.status(404).json({ success: false, message: 'Tag not found' });

    const formattedName = name ? (name.startsWith('#') ? name.toLowerCase() : `#${name.toLowerCase()}`) : existing.name;

    db.prepare(`
      UPDATE tags
      SET name = ?,
          department = COALESCE(?, department),
          clearance_level = COALESCE(?, clearance_level),
          description = COALESCE(?, description)
      WHERE id = ?
    `).run(formattedName, department, clearance_level, description, tagId);

    const currentUser = db.prepare("SELECT * FROM users WHERE id = ?").get(currentSimulatedUserId);
    db.prepare("INSERT INTO audit_logs (actor_name, actor_role, action, target, details) VALUES (?, ?, ?, ?, ?)")
      .run(currentUser ? currentUser.name : 'Admin', currentUser ? currentUser.role : 'Admin', 'TAG_UPDATE', formattedName, `Updated security tag clearance to [${clearance_level || existing.clearance_level}]`);

    const updated = db.prepare("SELECT * FROM tags WHERE id = ?").get(tagId);
    res.json({ success: true, message: 'Tag updated successfully', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete Tag
app.delete('/api/tags/:id', (req, res) => {
  const tagId = req.params.id;
  try {
    const existing = db.prepare("SELECT * FROM tags WHERE id = ?").get(tagId);
    if (!existing) return res.status(404).json({ success: false, message: 'Tag not found' });

    db.prepare("DELETE FROM tags WHERE id = ?").run(tagId);

    const currentUser = db.prepare("SELECT * FROM users WHERE id = ?").get(currentSimulatedUserId);
    db.prepare("INSERT INTO audit_logs (actor_name, actor_role, action, target, details) VALUES (?, ?, ?, ?, ?)")
      .run(currentUser ? currentUser.name : 'Admin', currentUser ? currentUser.role : 'Admin', 'TAG_DELETE', existing.name, `Deleted security tag ${existing.name}`);

    res.json({ success: true, message: 'Tag deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Get accessible videos for the CURRENT SIMULATED USER (Strict Permission Filtering)
app.get('/api/videos', (req, res) => {
  const currentUser = db.prepare("SELECT * FROM users WHERE id = ?").get(currentSimulatedUserId);
  const allVideos = db.prepare("SELECT * FROM videos ORDER BY id DESC").all();

  const accessibleVideos = [];
  const permissionEvaluations = [];

  for (const v of allVideos) {
    const evalResult = evaluateVideoAccess(currentUser, v);
    permissionEvaluations.push({
      video_id: v.video_id,
      title: v.title,
      department: v.department,
      permission_level: v.permission_level,
      allowed: evalResult.allowed,
      reason: evalResult.reason
    });

    // If allowed, push to visible video list
    if (evalResult.allowed) {
      accessibleVideos.push({
        ...v,
        access_grant_reason: evalResult.reason
      });
    }
  }

  // Get user's favorites
  const favRows = db.prepare("SELECT video_id FROM favorites WHERE user_id = ?").all(currentUser.id);
  const favSet = new Set(favRows.map(f => f.video_id));

  // Get user's watch history
  const historyRows = db.prepare("SELECT video_id, progress_percent, watched_at FROM watch_history WHERE user_id = ?").all(currentUser.id);
  const historyMap = {};
  historyRows.forEach(h => { historyMap[h.video_id] = h; });

  const enrichedVideos = accessibleVideos.map(v => ({
    ...v,
    is_favorite: favSet.has(v.id),
    watch_progress: historyMap[v.id] ? historyMap[v.id].progress_percent : 0
  }));

  res.json({
    success: true,
    data: enrichedVideos,
    meta: {
      currentUser,
      total_portal_videos: allVideos.length,
      visible_count: enrichedVideos.length,
      hidden_count: allVideos.length - enrichedVideos.length,
      evaluations: permissionEvaluations
    }
  });
});

// Get ALL videos for Admin Management (Raw unfiltered view for Admin Console)
app.get('/api/videos/all', (req, res) => {
  const videos = db.prepare("SELECT * FROM videos ORDER BY id DESC").all();
  res.json({ success: true, data: videos });
});

// Get single video details
app.get('/api/videos/:id', (req, res) => {
  const videoId = req.params.id;
  const video = db.prepare("SELECT * FROM videos WHERE id = ? OR video_id = ?").get(videoId, videoId);
  if (!video) return res.status(404).json({ success: false, message: 'Video not found' });

  const currentUser = db.prepare("SELECT * FROM users WHERE id = ?").get(currentSimulatedUserId);
  const evalResult = evaluateVideoAccess(currentUser, video);

  // Fetch comments
  const comments = db.prepare("SELECT * FROM comments WHERE video_id = ? ORDER BY id DESC").all(video.id);

  res.json({
    success: true,
    data: video,
    access: evalResult,
    comments
  });
});

// Create / Mock Upload Video (Admin Only)
app.post('/api/videos', (req, res) => {
  const currentUser = db.prepare("SELECT * FROM users WHERE id = ?").get(currentSimulatedUserId);
  const isAdmin = currentUser && (currentUser.is_admin === 1 || currentUser.role === 'System Administrator' || currentUser.department === 'Executive');
  
  if (!isAdmin) {
    return res.status(403).json({ success: false, message: 'สิทธิ์ถูกปฏิเสธ: เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถอัปโหลดวิดีโอได้ พนักงานทั่วไปมีสิทธิ์ดูอย่างเดียว' });
  }

  const { 
    title, description, department, category, permission_level, duration, 
    thumbnail_url, video_url, tags, allow_downloads, enable_comments,
    access_mode, allowed_user_ids, excluded_user_ids
  } = req.body;
  
  if (!title) {
    return res.status(400).json({ success: false, message: 'Video title is required' });
  }

  const video_id = `VID-${Math.floor(8000 + Math.random() * 1999)}`;
  const defaultThumb = 'https://images.unsplash.com/photo-1574943320219-553eb213f72d?auto=format&fit=crop&w=800&q=80';
  const defaultVideo = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  const finalCategory = category || department || 'Research & Whitepaper';

  try {
    const result = db.prepare(`
      INSERT INTO videos (video_id, title, description, department, category, permission_level, duration, thumbnail_url, video_url, tags, uploaded_by, allow_downloads, enable_comments, access_mode, allowed_user_ids, excluded_user_ids)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      video_id,
      title,
      description || 'Uploaded via Feedtech Cloud Hub simulator.',
      department || finalCategory,
      finalCategory,
      permission_level || 'Standard',
      duration || '10:00',
      thumbnail_url || defaultThumb,
      video_url || defaultVideo,
      tags || '#feedtech, #internal',
      currentUser ? currentUser.name : 'Administrator',
      allow_downloads ? 1 : 0,
      enable_comments ? 1 : 0,
      access_mode || 'public',
      typeof allowed_user_ids === 'string' ? allowed_user_ids : JSON.stringify(allowed_user_ids || []),
      typeof excluded_user_ids === 'string' ? excluded_user_ids : JSON.stringify(excluded_user_ids || [])
    );

    db.prepare("INSERT INTO audit_logs (actor_name, actor_role, action, target, details) VALUES (?, ?, ?, ?, ?)")
      .run(currentUser ? currentUser.name : 'Admin', currentUser ? currentUser.role : 'Admin', 'VIDEO_UPLOAD', `${video_id} - ${title}`, `Uploaded new video with Access Mode [${access_mode || 'public'}]`);

    const newVideo = db.prepare("SELECT * FROM videos WHERE id = ?").get(result.lastInsertRowid);
    res.json({ success: true, message: 'Video uploaded and indexed successfully!', data: newVideo });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Update Video Metadata & Permissions
app.put('/api/videos/:id', (req, res) => {
  const videoId = req.params.id;
  const { 
    title, description, department, category, permission_level, tags, 
    thumbnail_url,
    is_hidden, allow_downloads, enable_comments,
    access_mode, allowed_user_ids, excluded_user_ids
  } = req.body;

  try {
    db.prepare(`
      UPDATE videos
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          department = COALESCE(?, department),
          category = COALESCE(?, category),
          permission_level = COALESCE(?, permission_level),
          tags = COALESCE(?, tags),
          thumbnail_url = COALESCE(?, thumbnail_url),
          is_hidden = COALESCE(?, is_hidden),
          allow_downloads = COALESCE(?, allow_downloads),
          enable_comments = COALESCE(?, enable_comments),
          access_mode = COALESCE(?, access_mode),
          allowed_user_ids = COALESCE(?, allowed_user_ids),
          excluded_user_ids = COALESCE(?, excluded_user_ids)
      WHERE id = ? OR video_id = ?
    `).run(
      title, description, department, category, permission_level, tags, 
      thumbnail_url,
      is_hidden, allow_downloads, enable_comments,
      access_mode,
      allowed_user_ids !== undefined ? (typeof allowed_user_ids === 'string' ? allowed_user_ids : JSON.stringify(allowed_user_ids)) : null,
      excluded_user_ids !== undefined ? (typeof excluded_user_ids === 'string' ? excluded_user_ids : JSON.stringify(excluded_user_ids)) : null,
      videoId, videoId
    );

    const updated = db.prepare("SELECT * FROM videos WHERE id = ? OR video_id = ?").get(videoId, videoId);

    const currentUser = db.prepare("SELECT * FROM users WHERE id = ?").get(currentSimulatedUserId);
    db.prepare("INSERT INTO audit_logs (actor_name, actor_role, action, target, details) VALUES (?, ?, ?, ?, ?)")
      .run(currentUser ? currentUser.name : 'Admin', currentUser ? currentUser.role : 'Admin', 'VIDEO_METADATA_UPDATE', updated.video_id, `Updated video [${updated.title}] access mode to ${updated.access_mode || 'public'}`);

    res.json({ success: true, message: 'Video updated successfully', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Category Video Breakdown for Admin Dashboard (Drill-down)
app.get('/api/analytics/category-drilldown/:catName', (req, res) => {
  const catName = decodeURIComponent(req.params.catName);
  try {
    const videos = db.prepare("SELECT * FROM videos WHERE category LIKE ? OR department LIKE ? ORDER BY views DESC").all(`%${catName}%`, `%${catName}%`);
    const allUsers = db.prepare("SELECT id, name, role, department FROM users").all();
    const userMap = {};
    allUsers.forEach(u => userMap[u.id] = u);

    const enrichedVideos = videos.map(v => {
      let allowedNames = [];
      let excludedNames = [];
      try {
        const aIds = JSON.parse(v.allowed_user_ids || '[]');
        allowedNames = aIds.map(id => userMap[id]?.name || `User #${id}`);
      } catch (e) {}
      try {
        const eIds = JSON.parse(v.excluded_user_ids || '[]');
        excludedNames = eIds.map(id => userMap[id]?.name || `User #${id}`);
      } catch (e) {}

      // Get view count and recent viewers
      const viewers = db.prepare(`
        SELECT u.name, u.role, u.department, w.progress_percent, w.watched_at
        FROM watch_history w
        JOIN users u ON w.user_id = u.id
        WHERE w.video_id = ?
        ORDER BY w.watched_at DESC
      `).all(v.id);

      return {
        ...v,
        allowed_names: allowedNames,
        excluded_names: excludedNames,
        viewers
      };
    });

    res.json({
      success: true,
      category: catName,
      total_videos: videos.length,
      total_views: videos.reduce((sum, v) => sum + (v.views || 0), 0),
      videos: enrichedVideos
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Delete Video
app.delete('/api/videos/:id', (req, res) => {
  const videoId = req.params.id;
  const video = db.prepare("SELECT * FROM videos WHERE id = ? OR video_id = ?").get(videoId, videoId);
  if (!video) return res.status(404).json({ success: false, message: 'Video not found' });

  db.prepare("DELETE FROM videos WHERE id = ?").run(video.id);
  db.prepare("DELETE FROM favorites WHERE video_id = ?").run(video.id);
  db.prepare("DELETE FROM watch_history WHERE video_id = ?").run(video.id);

  const currentUser = db.prepare("SELECT * FROM users WHERE id = ?").get(currentSimulatedUserId);
  db.prepare("INSERT INTO audit_logs (actor_name, actor_role, action, target, details) VALUES (?, ?, ?, ?, ?)")
    .run(currentUser ? currentUser.name : 'Admin', currentUser ? currentUser.role : 'Admin', 'VIDEO_DELETE', video.video_id, `Permanently removed video ${video.title}`);

  res.json({ success: true, message: 'Video deleted successfully' });
});

// Toggle Favorite
app.post('/api/videos/:id/favorite', (req, res) => {
  const videoId = req.params.id;
  const video = db.prepare("SELECT * FROM videos WHERE id = ? OR video_id = ?").get(videoId, videoId);
  if (!video) return res.status(404).json({ success: false, message: 'Video not found' });

  const existing = db.prepare("SELECT * FROM favorites WHERE user_id = ? AND video_id = ?").get(currentSimulatedUserId, video.id);
  let isFav = false;

  if (existing) {
    db.prepare("DELETE FROM favorites WHERE id = ?").run(existing.id);
    isFav = false;
  } else {
    db.prepare("INSERT INTO favorites (user_id, video_id) VALUES (?, ?)").run(currentSimulatedUserId, video.id);
    isFav = true;
  }

  res.json({ success: true, is_favorite: isFav });
});

// Track Watch History & Views
app.post('/api/videos/:id/watch', (req, res) => {
  const videoId = req.params.id;
  const { progress } = req.body; // e.g. 45 (%)
  const video = db.prepare("SELECT * FROM videos WHERE id = ? OR video_id = ?").get(videoId, videoId);
  if (!video) return res.status(404).json({ success: false, message: 'Video not found' });

  // Increment view count on first view
  db.prepare("UPDATE videos SET views = views + 1 WHERE id = ?").run(video.id);

  // Update or Insert watch history
  db.prepare(`
    INSERT INTO watch_history (user_id, video_id, progress_percent, watched_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(user_id, video_id) DO UPDATE SET
      progress_percent = excluded.progress_percent,
      watched_at = CURRENT_TIMESTAMP
  `).run(currentSimulatedUserId, video.id, progress || 25);

  res.json({ success: true, message: 'Watch progress tracked' });
});

// Post Comment
app.post('/api/videos/:id/comments', (req, res) => {
  const videoId = req.params.id;
  const { comment } = req.body;
  if (!comment) return res.status(400).json({ success: false, message: 'Comment content is required' });

  const video = db.prepare("SELECT * FROM videos WHERE id = ? OR video_id = ?").get(videoId, videoId);
  if (!video) return res.status(404).json({ success: false, message: 'Video not found' });

  const currentUser = db.prepare("SELECT * FROM users WHERE id = ?").get(currentSimulatedUserId);
  const result = db.prepare(`
    INSERT INTO comments (video_id, user_id, user_name, user_role, comment)
    VALUES (?, ?, ?, ?, ?)
  `).run(video.id, currentUser.id, currentUser.name, `${currentUser.role} (${currentUser.department})`, comment);

  const newComment = db.prepare("SELECT * FROM comments WHERE id = ?").get(result.lastInsertRowid);
  res.json({ success: true, data: newComment });
});

// Get Audit Logs
app.get('/api/audit-logs', (req, res) => {
  const logs = db.prepare("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 50").all();
  res.json({ success: true, data: logs });
});

// Get Analytics / System Stats
app.get('/api/stats', (req, res) => {
  const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get().count;
  const activeUsers = db.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'Active'").get().count;
  const totalVideos = db.prepare("SELECT COUNT(*) as count FROM videos").get().count;
  const totalViews = db.prepare("SELECT SUM(views) as sum FROM videos").get().sum || 0;
  const totalDepartments = db.prepare("SELECT COUNT(*) as count FROM departments").get().count;
  const confidentialCount = db.prepare("SELECT COUNT(*) as count FROM videos WHERE permission_level = 'Highly Confidential'").get().count;
  const restrictedCount = db.prepare("SELECT COUNT(*) as count FROM videos WHERE permission_level = 'Restricted'").get().count;
  const standardCount = db.prepare("SELECT COUNT(*) as count FROM videos WHERE permission_level = 'Standard'").get().count;

  res.json({
    success: true,
    data: {
      totalUsers,
      activeUsers,
      totalVideos,
      totalViews,
      totalDepartments,
      permissions: {
        highly_confidential: confidentialCount,
        restricted: restrictedCount,
        standard: standardCount
      }
    }
  });
});

// Interactive Permission Simulation Matrix Query
app.get('/api/permission-matrix', (req, res) => {
  const users = db.prepare("SELECT * FROM users WHERE status = 'Active'").all();
  const videos = db.prepare("SELECT * FROM videos ORDER BY id ASC").all();

  const matrix = users.map(u => {
    const accessible = [];
    const restricted = [];
    for (const v of videos) {
      const evalRes = evaluateVideoAccess(u, v);
      if (evalRes.allowed) {
        accessible.push({ id: v.id, video_id: v.video_id, title: v.title, level: v.permission_level, dept: v.department });
      } else {
        restricted.push({ id: v.id, video_id: v.video_id, title: v.title, level: v.permission_level, dept: v.department, reason: evalRes.reason });
      }
    }
    return {
      user: u,
      accessibleCount: accessible.length,
      restrictedCount: restricted.length,
      accessible,
      restricted
    };
  });

  res.json({ success: true, data: matrix });
});

// ---------------- EVENTS CRUD ENDPOINTS ----------------
app.get('/api/events', (req, res) => {
  try {
    const events = db.prepare("SELECT * FROM events ORDER BY date DESC, id DESC").all();
    res.json({ success: true, data: events });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.get('/api/events/:id', (req, res) => {
  try {
    const event = db.prepare("SELECT * FROM events WHERE id = ?").get(req.params.id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    res.json({ success: true, data: event });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.post('/api/events', (req, res) => {
  try {
    const { title, description, date, time, location, speaker, speaker_role, department, clearance_level, banner_url, video_url, status, materials_url } = req.body;
    if (!title || !date || !location) {
      return res.status(400).json({ success: false, message: 'Title, date, and location are required' });
    }
    const stmt = db.prepare(`
      INSERT INTO events (title, description, date, time, location, speaker, speaker_role, department, clearance_level, banner_url, video_url, status, materials_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(
      title,
      description || '',
      date,
      time || '09:00 - 16:00',
      location,
      speaker || 'Feedtech Speaker',
      speaker_role || 'Speaker',
      department || 'General',
      clearance_level || 'Standard',
      banner_url || 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=1200',
      video_url || 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      status || 'Upcoming',
      materials_url || ''
    );
    const created = db.prepare("SELECT * FROM events WHERE id = ?").get(info.lastInsertRowid);
    
    // Audit Log
    db.prepare(`
      INSERT INTO audit_logs (actor_name, actor_role, action, target, details)
      VALUES ('Admin', 'System Administrator', 'CREATE_EVENT', ?, ?)
    `).run(title, `Created event: ${title} on ${date}`);

    res.json({ success: true, data: created });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.put('/api/events/:id', (req, res) => {
  try {
    const id = req.params.id;
    const { title, description, date, time, location, speaker, speaker_role, department, clearance_level, banner_url, video_url, status, materials_url } = req.body;
    const stmt = db.prepare(`
      UPDATE events 
      SET title = ?, description = ?, date = ?, time = ?, location = ?, speaker = ?, speaker_role = ?, department = ?, clearance_level = ?, banner_url = ?, video_url = ?, status = ?, materials_url = ?
      WHERE id = ?
    `);
    stmt.run(
      title, description, date, time, location, speaker, speaker_role, department, clearance_level, banner_url, video_url, status, materials_url, id
    );
    const updated = db.prepare("SELECT * FROM events WHERE id = ?").get(id);

    // Audit Log
    db.prepare(`
      INSERT INTO audit_logs (actor_name, actor_role, action, target, details)
      VALUES ('Admin', 'System Administrator', 'UPDATE_EVENT', ?, ?)
    `).run(title, `Updated event: ${title}`);

    res.json({ success: true, data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

app.delete('/api/events/:id', (req, res) => {
  try {
    const id = req.params.id;
    const event = db.prepare("SELECT * FROM events WHERE id = ?").get(id);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });
    db.prepare("DELETE FROM events WHERE id = ?").run(id);

    // Audit Log
    db.prepare(`
      INSERT INTO audit_logs (actor_name, actor_role, action, target, details)
      VALUES ('Admin', 'System Administrator', 'DELETE_EVENT', ?, ?)
    `).run(event.title, `Deleted event ID: ${id}`);

    res.json({ success: true, message: 'Event deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(` Feedtech Video Portal Demo is running on:`);
  console.log(` http://localhost:${PORT}`);
  console.log(` SQLite Database: ${dbPath}`);
  console.log(`=======================================================`);
});

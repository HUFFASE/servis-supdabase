# Project Blueprint: Tech Services & PSA Management Platform

This document outlines the technical architecture, database schema, and UI/UX requirements for a modern Professional Services Automation (PSA) application built with **Next.js (App Router)**, **Antigravity 2.0 (Ant Design 5.0+)**, and **Supabase (PostgreSQL)**.

---

## 🛠️ Architecture & Core Stack
- **Frontend:** Next.js 14+ (App Router), TypeScript, TailwindCSS (for utility layouts)
- **UI Framework:** Antigravity 2.0 (Ant Design 5.0+ token-based theme)
- **Backend/Database:** Supabase (PostgreSQL with Row Level Security enabled)
- **State/Data Fetching:** Supabase Client Realtime, React Context

---

## 🎨 Global Layout & Navigation UI
Except for the `/login` page, all pages must share a persistent, responsive Shell layout.

### 1. Topbar
- **Left:** Company / Application Logo.
- **Right:** 
  - **Notification Bell:** Uses Antigravity `Badge` connected to Supabase Realtime changes. Displays live alerts for critical case updates or expiring certificates. Triggers `notification.open()`.
  - **User Profile:** Antigravity `Avatar` and `Dropdown` component with "Profile", "Settings", and "Logout" actions.

### 2. Sidebar (Dynamic Navigation)
- Uses Antigravity `Menu` in vertical inline mode.
- **Role-Based Visibility (RBAC):** 
  - `Direktör` & `Müdür`: Full access to all menu items (Dashboard, Users, Brands, Services, Certificates, Customers, Contracts, OneOffs, Reports, Cases).
  - `Presales` & `Postsales`: Hidden "Reports" and restricted "Contracts" financial details.

---

## 🗄️ Database Schema & Relations (Supabase PostgreSQL)

### Profiles & Roles
```sql
CREATE TYPE user_role AS ENUM ('Direktör', 'Müdür', 'Presales', 'Postsales');

CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'Postsales',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

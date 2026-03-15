# Biik Time Tracker 🐷

A streamlined, high-performance time management tool built to track daily work hours with real-time synchronization to Google Sheets. 

## 🛠️ The Motivation
Transitioning from an IT Global Helpdesk background, I wanted to build a tool that solved a common workflow friction: manual time logging. I developed Biik Tracker to master the **Next.js App Router** while implementing a "serverless" backend architecture using **Google Apps Script**.

## 🚀 Technical Highlights
* **Framework**: Next.js 14 (App Router) with Tailwind CSS for a responsive, dark-mode-first UI.
* **Backend/Database**: Developed a custom RESTful API using Google Apps Script to utilize Google Sheets as a low-overhead, highly accessible database.
* **Role-Based Access Control (RBAC)**: Implemented a secure Admin Console accessible only to authorized emails for user provisioning and global log management.
* **State Management**: Utilized React hooks (`useEffect`, `useRef`) for persistent timer logic that remains accurate during high-intensity multitasking.

## 🧠 Key Learnings
* **API Architecture**: Designing CRUD operations (Get/Post) in Apps Script to handle data requests from a modern web app.
* **IT Operations to Dev**: Applying my experience in **Identity & Access Management (IAM)** to build the admin verification logic.
* **Frontend Optimization**: Ensuring the UI remains lightweight and fast, even when fetching large datasets from a spreadsheet backend.

## 🏗️ Getting Started
1.  **Clone the repo**: `git clone https://github.com/HadesXjay/biik-time-tracker.git`
2.  **Install dependencies**: `npm install`
3.  **Local Dev**: `npm run dev`
4.  **Configuration**: Update the `API_URL` in the dashboard and admin components with your Google Script deployment URL.

## 📈 Future Roadmap
* [ ] Integration with a formal SQL database (Supabase/PostgreSQL).
* [ ] "Last Seen" user activity tracking in the Admin Console.
* [ ] CSV export functionality for monthly billing reports.

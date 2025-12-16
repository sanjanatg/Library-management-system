# Library Management System

A modern, full-stack Library Management System built with React, TypeScript, and Supabase. This application provides a seamless experience for both students and librarians to manage library resources, track borrowed books, and handle fines.

## 🚀 Tech Stack

### Frontend
- **Framework**: [React](https://react.dev/) (v18) with [Vite](https://vitejs.dev/) for fast build and development.
- **Language**: [TypeScript](https://www.typescriptlang.org/) for type safety and developer experience.
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for utility-first styling.
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) for accessible and customizable components.
- **Icons**: [Lucide React](https://lucide.dev/) for beautiful icons.
- **Routing**: [React Router DOM](https://reactrouter.com/) for client-side routing.
- **State Management**: [TanStack Query](https://tanstack.com/query/latest) for efficient server state management.
- **Charts**: [Recharts](https://recharts.org/) for data visualization in dashboards.

### Backend & Database
- **Platform**: [Supabase](https://supabase.com/) (Firebase alternative).
- **Database**: PostgreSQL.
- **Authentication**: Supabase Auth with Row Level Security (RLS).
- **Security**: Comprehensive RLS policies to ensure data privacy and role-based access control.

## ✨ Features

### 🔐 Authentication & Security
- **Role-Based Access Control (RBAC)**: Distinct login flows and dashboards for **Students** and **Librarians**.
- **Secure Signup**:
  - **Students**: Restricted to specific email domains (`@cambridge.edu.in`, `@cambridge.edu.com`). Requires University Serial Number (USN).
  - **Librarians**: Role-based signup.
- **Protected Routes**: Prevents unauthorized access to dashboard pages.
- **Row Level Security (RLS)**: Database policies ensure students can only view their own data, while librarians have broader management access.

### 🎓 Student Dashboard
- **Personalized View**: See personal details (Name, USN, Department).
- **Borrowed Books**: View currently borrowed books with due dates.
- **Fine Tracking**: Check outstanding fines and payment status.
- **Profile Management**: View student profile information.

### 📚 Librarian Dashboard
- **Book Management**:
  - Add new books to the library inventory.
  - Update book details (copies, author, category).
  - Remove books from the system.
- **Student Management**:
  - View all registered students.
  - Add new students manually.
  - Update student details.
- **Issue & Return**:
  - Issue books to students.
  - Process book returns.
  - Automatically calculate fines for late returns.
- **Fine Management**: Track and manage student fines.
- **Analytics**: Visual charts showing book distribution and usage.

## 🛠️ Setup & Installation

Follow these steps to run the project locally.

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/sanjanatg/Library-management-system.git
    cd Library-management-system
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory and add your Supabase credentials:
    ```env
    VITE_SUPABASE_URL=your_supabase_project_url
    VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
    ```

4.  **Run the development server**
    ```bash
    npm run dev
    ```

5.  **Build for production**
    ```bash
    npm run build
    ```

## 📂 Project Structure

```
src/
├── api/            # API functions for Supabase interactions
├── components/     # Reusable UI components (Buttons, Inputs, etc.)
│   ├── dashboard/  # Specific components for Student/Librarian dashboards
│   └── ui/         # shadcn/ui components
├── contexts/       # React Contexts (AuthContext for global auth state)
├── hooks/          # Custom React hooks (use-toast, etc.)
├── integrations/   # Third-party integrations (Supabase client)
├── pages/          # Main application pages (Auth, Dashboard, Index)
├── utils/          # Utility functions
└── App.tsx         # Main application entry point with routing
```

## 🛡️ Database Schema (Supabase)

- **STUDENT**: Stores student profiles (USN, Name, Email, Dept, Year).
- **Librarian**: Stores librarian profiles.
- **BOOKS**: Library inventory.
- **ISSUE**: Tracks book transactions (Issue Date, Return Date, Status).
- **FINE**: Records fines associated with issues.

---

## 📚 Additional Documentation

- [Implementation Details](./IMPLEMENTATION.md) - Technical implementation and architecture decisions
- [Features Implemented](./FEATURES_IMPLEMENTED.md) - Complete list of all implemented features
- [Quick Reference](./QUICK_REFERENCE.md) - Quick guide for common tasks and operations

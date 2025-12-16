# Library Management System - Role-Based Implementation

## Overview
This document describes the implementation of role-based access control for the library management system with separate dashboards and features for students and librarians.

## Architecture

### Authentication & Authorization
- **AuthContext** (`src/contexts/AuthContext.tsx`): Manages user authentication and role detection
  - Detects user role by checking LIBRARIAN and STUDENT tables
  - Stores `userRole` ('student' | 'librarian') and `userId`
  - Enforces row-level security at the query level

- **ProtectedRoute** (`src/components/ProtectedRoute.tsx`): Route protection
  - Redirects unauthenticated users to `/auth`
  - Optionally enforces specific role requirements
  - Shows loading state while auth is being determined

### Components

#### 1. TableEditor Component (`src/components/TableEditor.tsx`)
A reusable CRUD table editor for librarians to manage all database tables.

**Features:**
- Add new records via dialog form
- Edit existing records
- Delete records with confirmation
- Search/filter functionality
- Support for multiple column types:
  - `text`: Standard text input
  - `number`: Numeric input
  - `date`: Date picker
  - `email`: Email input
  - `select`: Dropdown with predefined options
- Editable/read-only column control
- Toast notifications for success/error feedback
- Automatic refresh after CRUD operations

**Props:**
```typescript
interface TableEditorProps {
  title: string;
  columns: TableColumn[];
  data: any[];
  onAdd: (newRecord: any) => Promise<void>;
  onUpdate: (id: string | number, updates: any) => Promise<void>;
  onDelete: (id: string | number) => Promise<void>;
  idField: string;
  loading?: boolean;
  onRefresh?: () => Promise<void>;
}
```

#### 2. StudentDashboard (`src/components/dashboard/StudentDashboard.tsx`)
Dashboard for authenticated students with read-only access to their own data.

**Features:**
- **Stats Cards:**
  - Books Issued: Count of currently borrowed books
  - Overdue Books: Count of books past due date
  - Total Fines: Sum of unpaid fines

- **My Books Tab:**
  - Table showing all currently issued books
  - Columns: Title, Author, Issue Date, Due Date, Status
  - Status badge: "Active" (green) or "Overdue" (red)
  - Enforced filtering: Only shows books for logged-in student

- **My Fines Tab:**
  - Table showing all fines for this student
  - Columns: Book Title, Due Date, Return Date, Amount, Status
  - Status badge: "Paid" (secondary) or "Unpaid" (red)
  - Enforced filtering: Only shows fines for this student's issues

**Data Access Control:**
```typescript
// Query-level filtering ensures students only see their own data
.eq('Student_ID', String(userId))
```

#### 3. LibrarianDashboard (`src/components/dashboard/LibrarianDashboard.tsx`)
Dashboard for librarians with full CRUD access to all tables.

**Features:**
- **Stats Cards:**
  - Total Books: Count of all books in library
  - Total Students: Count of registered students
  - Active Issues: Count of currently issued books
  - Overdue Books: Count of books past due date

- **Management Tabs:**
  1. **Books Tab** (TableEditor)
     - Columns: Title, Publisher, Year, Available Copies
     - Operations: Add, Edit, Delete books
     - Editable fields: All except Book_ID

  2. **Students Tab** (TableEditor)
     - Columns: Student ID, Name, Email, Year
     - Operations: Add, Edit, Delete students
     - Editable fields: Name, Email, Year (not Student ID)

  3. **Issues Tab** (TableEditor)
     - Columns: Issue ID, Student ID, Book ID, Issue Date, Due Date, Return Date
     - Operations: Edit, Delete issues
     - Editable fields: Due Date, Return Date
     - Read-only fields: Issue ID, Student ID, Book ID, Issue Date

  4. **Fines Tab** (TableEditor)
     - Columns: Fine ID, Issue ID, Amount, Status
     - Operations: Edit, Delete fines
     - Editable fields: Amount, Status (Unpaid/Paid)
     - Read-only fields: Fine ID, Issue ID

## Data Flow

### Student Viewing Their Data
```
1. Student logs in → AuthContext detects role as 'student'
2. Navigates to Dashboard → StudentDashboard renders
3. Queries ISSUE table with filter: eq('Student_ID', userId)
4. Queries FINE table with filter: in('Issue_ID', studentIssueIds)
5. Only student's own data is displayed
```

### Librarian Managing Data
```
1. Librarian logs in → AuthContext detects role as 'librarian'
2. Navigates to Dashboard → LibrarianDashboard renders
3. Librarian selects a tab (e.g., Books)
4. TableEditor loads all records from that table
5. Librarian can:
   - Add new record → Dialog form → Insert to DB
   - Edit record → Dialog form → Update in DB
   - Delete record → Confirmation → Delete from DB
6. After operation, data refreshes automatically
```

## Security Considerations

### Row-Level Security (RLS)
The Supabase database should have RLS policies configured:

**For Students:**
- Can SELECT from BOOK (all books)
- Can SELECT from ISSUE where Student_ID = auth.uid
- Can SELECT from FINE where Issue_ID in (student's issues)
- Cannot INSERT, UPDATE, or DELETE

**For Librarians:**
- Full CRUD on all tables (STUDENT, BOOK, AUTHOR, ISSUE, FINE, LIBRARIAN)

### Client-Side Enforcement
- ProtectedRoute component prevents unauthorized navigation
- StudentDashboard enforces filtering at query level
- UI only shows relevant actions based on role

## Type Safety

All components use TypeScript with proper typing:
- `TableColumn` interface for column definitions
- `TableEditorProps` interface for component props
- Proper type conversions for Supabase queries (e.g., `String(userId)`, `Number(id)`)

## Error Handling

- Toast notifications for all CRUD operations
- Error messages displayed to user
- Graceful fallbacks for missing data
- Loading states during async operations

## Responsive Design

- Mobile-friendly layout using Tailwind CSS
- Responsive grid for stats cards
- Scrollable tables on small screens
- Dialog forms adapt to screen size

## Future Enhancements

1. **Pagination:** Add pagination to large tables
2. **Sorting:** Add sortable columns in TableEditor
3. **Bulk Operations:** Allow bulk edit/delete
4. **Export:** Export table data to CSV/Excel
5. **Advanced Filtering:** More sophisticated filter options
6. **Audit Logging:** Track all CRUD operations
7. **Fine Calculation:** Automatic fine calculation on book return
8. **Book Renewal:** Allow students to renew books
9. **Notifications:** Email notifications for overdue books
10. **Reports:** Advanced analytics and reports for librarians

## Testing Checklist

- [ ] Student can login and see only their books
- [ ] Student can see only their fines
- [ ] Student cannot see other students' data
- [ ] Librarian can add a new book
- [ ] Librarian can edit a book
- [ ] Librarian can delete a book
- [ ] Librarian can add a new student
- [ ] Librarian can edit a student
- [ ] Librarian can delete a student
- [ ] Librarian can update issue due dates
- [ ] Librarian can mark fines as paid
- [ ] Data refreshes after CRUD operations
- [ ] Error messages display correctly
- [ ] UI is responsive on mobile devices

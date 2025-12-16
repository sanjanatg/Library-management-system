# Quick Reference Guide

## Key Files Modified/Created

### New Files
1. **`src/components/TableEditor.tsx`** - Reusable CRUD table editor component
   - Used by LibrarianDashboard for all management operations
   - Supports Add, Edit, Delete, Search functionality

### Modified Files
1. **`src/components/dashboard/StudentDashboard.tsx`**
   - Added "My Books" tab with issued books table
   - Added "My Fines" tab with fines table
   - Enforces row-level filtering for student data

2. **`src/components/dashboard/LibrarianDashboard.tsx`**
   - Added 4 management tabs: Books, Students, Issues, Fines
   - Integrated TableEditor component for CRUD operations
   - Full access to all data

## Feature Matrix

| Feature | Student | Librarian |
|---------|---------|-----------|
| View all books | ✓ | ✓ |
| View own issued books | ✓ | ✓ (all) |
| View own fines | ✓ | ✓ (all) |
| Add books | ✗ | ✓ |
| Edit books | ✗ | ✓ |
| Delete books | ✗ | ✓ |
| Add students | ✗ | ✓ |
| Edit students | ✗ | ✓ |
| Delete students | ✗ | ✓ |
| Manage issues | ✗ | ✓ |
| Manage fines | ✗ | ✓ |

## Data Filtering

### Student Queries
```typescript
// Books issued to this student only
.from('ISSUE')
.select('...')
.eq('Student_ID', String(userId))
.is('Return_Date', null)

// Fines for this student's issues only
.from('FINE')
.select('...')
.in('Issue_ID', studentIssueIds)
```

### Librarian Queries
```typescript
// All books
.from('BOOK').select('*')

// All students
.from('STUDENT').select('*')

// All issues
.from('ISSUE').select('*')

// All fines
.from('FINE').select('*')
```

## Component Hierarchy

```
App
├── AuthProvider
│   └── Routes
│       ├── /auth → Auth page
│       ├── /dashboard → Dashboard page
│       │   ├── StudentDashboard (if role='student')
│       │   │   ├── Stats Cards
│       │   │   └── Tabs
│       │   │       ├── My Books (Table)
│       │   │       └── My Fines (Table)
│       │   └── LibrarianDashboard (if role='librarian')
│       │       ├── Stats Cards
│       │       └── Tabs
│       │           ├── Books (TableEditor)
│       │           ├── Students (TableEditor)
│       │           ├── Issues (TableEditor)
│       │           └── Fines (TableEditor)
│       ├── /books → Books catalog
│       ├── /issues → Issue/Return management (librarian only)
│       ├── /fines → Fines page
│       └── /profile → User profile
```

## API Endpoints Used

All operations use Supabase client with these tables:
- `STUDENT` - Student records
- `BOOK` - Book catalog
- `AUTHOR` - Author information
- `ISSUE` - Book issue records
- `FINE` - Fine records
- `LIBRARIAN` - Librarian records
- `DEPARTMENT` - Department information

## Styling

- **Framework:** Tailwind CSS
- **UI Components:** shadcn/ui
- **Icons:** Lucide React
- **Responsive:** Mobile-first design with breakpoints

## Key Dependencies

```json
{
  "@supabase/supabase-js": "^2.81.1",
  "react": "^18.3.1",
  "react-router-dom": "^6.30.1",
  "tailwindcss": "^3.4.17",
  "lucide-react": "^0.462.0"
}
```

## Common Tasks

### Add a new column to TableEditor
```typescript
const columns: TableColumn[] = [
  { key: 'fieldName', label: 'Display Name', type: 'text', editable: true },
  // ... more columns
];
```

### Add a new tab to LibrarianDashboard
```typescript
<TabsContent value="newTab" className="mt-6">
  <TableEditor
    title="New Management"
    columns={newColumns}
    data={newData}
    onAdd={handleNewAdd}
    onUpdate={handleNewUpdate}
    onDelete={handleNewDelete}
    idField="ID_FIELD"
    onRefresh={async () => setRefreshTrigger(prev => prev + 1)}
  />
</TabsContent>
```

### Enforce student-only filtering
```typescript
// In StudentDashboard or any student-facing component
const { data } = await supabase
  .from('TABLE_NAME')
  .select('...')
  .eq('Student_ID', String(userId))  // Key: Always filter by userId
```

## Debugging

### Check user role
```typescript
const { userRole, userId } = useAuth();
console.log('Role:', userRole, 'ID:', userId);
```

### Check query results
```typescript
const { data, error } = await supabase.from('TABLE').select('*');
if (error) console.error('Query error:', error);
console.log('Data:', data);
```

### Check RLS policies
- Verify Supabase RLS policies allow appropriate access
- Check browser console for auth errors
- Verify user email matches LIBRARIAN.Email or STUDENT.contact

## Performance Tips

1. **Pagination:** Add pagination for large tables (future enhancement)
2. **Lazy Loading:** Use React.lazy() for route components
3. **Query Optimization:** Use select() to fetch only needed columns
4. **Caching:** Consider React Query for caching
5. **Debouncing:** Search input could be debounced

## Security Reminders

- ✓ Row-level security enforced at query level
- ✓ ProtectedRoute prevents unauthorized access
- ✓ Student data filtered by userId
- ✓ No sensitive data in localStorage
- ✓ All operations go through Supabase auth

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Student sees all data | Check RLS policies in Supabase |
| Librarian can't edit | Verify RLS allows UPDATE for librarian role |
| Data not refreshing | Check onRefresh callback is being called |
| Dialog not opening | Verify Dialog component is imported |
| Type errors | Check id parameter conversions (String/Number) |

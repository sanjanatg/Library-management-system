import { useEffect, useMemo, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Users, Receipt, Clock } from 'lucide-react';
import { TableEditor, TableColumn } from '@/components/TableEditor';
import { useAuth } from '@/contexts/AuthContext';

export function LibrarianDashboard() {
  const { userId } = useAuth();
  const hasLoadedRef = useRef(false);
  const [stats, setStats] = useState({
    totalBooks: 0,
    totalStudents: 0,
    activeIssues: 0,
    overdueBooks: 0,
  });
  const [books, setBooks] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [issues, setIssues] = useState<any[]>([]);
  const [fines, setFines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [departments, setDepartments] = useState<any[]>([]);
  const [issuesWithoutFines, setIssuesWithoutFines] = useState<any[]>([]);

  useEffect(() => {
    // Only fetch data on initial mount or when manually refreshed via refreshTrigger
    if (!hasLoadedRef.current || refreshTrigger > 0) {
      hasLoadedRef.current = true;
      fetchLibrarianData();
    }
  }, [refreshTrigger]);

  const fetchLibrarianData = async () => {
    setLoading(true);
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.error('Error getting session:', sessionError);
        return;
      }

      const session = sessionData?.session;
      if (!session) {
        console.warn('No authenticated session found. RLS will block queries.');
        setStats({
          totalBooks: 0,
          totalStudents: 0,
          activeIssues: 0,
          overdueBooks: 0,
        });
        setBooks([]);
        setStudents([]);
        setIssues([]);
        setFines([]);
        setDepartments([]);
        setIssuesWithoutFines([]);
        return;
      }

      console.log('Authenticated as:', session.user.email);

      const [{ count: bookCount, error: bookError },
        { count: studentCount, error: studentError },
        { count: issueCount, error: issueError },
        { count: overdueCount, error: overdueError }]
        = await Promise.all([
          supabase.from('BOOK').select('*', { count: 'exact', head: true }),
          supabase.from('STUDENT').select('*', { count: 'exact', head: true }),
          supabase.from('ISSUE').select('*', { count: 'exact', head: true }).is('Return_Date', null),
          supabase.from('ISSUE').select('*', { count: 'exact', head: true }).is('Return_Date', null).lt('Due_Date', new Date().toISOString().split('T')[0]),
        ]);

      if (bookError) {
        console.error('Book count error:', { error: bookError, user: session.user.email, message: bookError.message });
        setStats(prev => ({ ...prev, totalBooks: 0 }));
      } else {
        setStats(prev => ({ ...prev, totalBooks: bookCount ?? 0 }));
      }

      if (studentError) {
        console.error('Student count error:', { error: studentError, user: session.user.email, message: studentError.message });
        setStats(prev => ({ ...prev, totalStudents: 0 }));
      } else {
        setStats(prev => ({ ...prev, totalStudents: studentCount ?? 0 }));
      }

      if (issueError) {
        console.error('Issue count error:', { error: issueError, user: session.user.email, message: issueError.message });
        setStats(prev => ({ ...prev, activeIssues: 0 }));
      } else {
        setStats(prev => ({ ...prev, activeIssues: issueCount ?? 0 }));
      }

      if (overdueError) {
        console.error('Overdue count error:', { error: overdueError, user: session.user.email, message: overdueError.message });
        setStats(prev => ({ ...prev, overdueBooks: 0 }));
      } else {
        setStats(prev => ({ ...prev, overdueBooks: overdueCount ?? 0 }));
      }

      const { data: booksData, error: booksDataError } = await supabase
        .from('BOOK')
        .select('*, AUTHOR(Author_Name)')
        .order('Title');
      if (booksDataError) {
        console.error('Error fetching books:', booksDataError);
      } else {
        setBooks(booksData || []);
      }

      const { data: studentData, error: studentDataError } = await supabase
        .from('STUDENT')
        .select('*, DEPARTMENT(Dept_Name)')
        .order('name');
      if (studentDataError) {
        console.error('Error fetching students:', studentDataError);
      } else {
        setStudents((studentData || []).map(student => ({
          ...student,
          DepartmentName: student.DEPARTMENT?.Dept_Name,
        })));
      }

      const { data: departmentData, error: departmentError } = await supabase
        .from('DEPARTMENT')
        .select('Department_ID, Dept_Name')
        .order('Dept_Name');
      if (departmentError) {
        console.error('Error fetching departments:', departmentError);
        setDepartments([]);
      } else {
        setDepartments(departmentData || []);
      }

      const { data: issueRecords, error: issueDataError } = await supabase
        .from('ISSUE')
        .select(`
          *,
          STUDENT(name),
          BOOK(Title)
        `)
        .order('Issue_Date', { ascending: false });
      if (issueDataError) {
        console.error('Error fetching issues:', issueDataError);
        setIssues([]);
      } else {
        setIssues((issueRecords || []).map(issue => ({
          ...issue,
          Student_Display: issue.STUDENT?.name,
          Book_Title: issue.BOOK?.Title,
        })));
      }

      const { data: fineRecords, error: fineDataError } = await supabase
        .from('FINE')
        .select(`
          *,
          ISSUE(
            Student_ID,
            Book_ID,
            Due_Date,
            STUDENT(name),
            BOOK(Title)
          )
        `)
        .order('Date_Calculated', { ascending: false });
      if (fineDataError) {
        console.error('Error fetching fines:', fineDataError);
        setFines([]);
      } else {
        setFines((fineRecords || []).map(fine => ({
          ...fine,
          StudentName: fine.ISSUE?.STUDENT?.name,
          BookTitle: fine.ISSUE?.BOOK?.Title,
        })));
      }

      const { data: finedIssues, error: finedIssuesError } = await supabase
        .from('FINE')
        .select('Issue_ID');
      if (finedIssuesError) {
        console.error('Error fetching fined issue IDs:', finedIssuesError);
      }
      const excludedIssueIds = (finedIssues || []).map(issue => issue.Issue_ID);

      let issueQuery = supabase
        .from('ISSUE')
        .select(`
          Issue_ID,
          Due_Date,
          Return_Date,
          STUDENT(name),
          BOOK(Title)
        `)
        .is('Return_Date', null)
        .order('Due_Date', { ascending: false });
      if (excludedIssueIds.length > 0) {
        issueQuery = issueQuery.not('Issue_ID', 'in', `(${excludedIssueIds.join(',')})`);
      }
      const { data: issuesWaiting, error: issuesWaitingError } = await issueQuery;
      if (issuesWaitingError) {
        console.error('Error fetching issues without fines:', issuesWaitingError);
        setIssuesWithoutFines([]);
      } else {
        setIssuesWithoutFines((issuesWaiting || []).map(issue => ({
          ...issue,
          StudentName: issue.STUDENT?.name,
          BookTitle: issue.BOOK?.Title,
        })));
      }

    } catch (err) {
      console.error('fetchLibrarianData unexpected error:', err);
      setStats({
        totalBooks: 0,
        totalStudents: 0,
        activeIssues: 0,
        overdueBooks: 0,
      });
      setBooks([]);
      setStudents([]);
      setIssues([]);
      setFines([]);
      setDepartments([]);
      setIssuesWithoutFines([]);
    } finally {
      setLoading(false);
    }
  };

  const bookColumns: TableColumn[] = [
    { key: 'Title', label: 'Title', editable: true },
    { key: 'Publisher', label: 'Publisher', editable: true },
    { key: 'Year_of_Publication', label: 'Year', type: 'number', editable: true },
    { key: 'Available_Copies', label: 'Available Copies', type: 'number', editable: true },
  ];

  const studentColumns: TableColumn[] = [
    { key: 'student_id', label: 'Student ID (USN)', editable: true, required: true, showInForm: true },
    { key: 'name', label: 'Name', editable: true, required: true, showInForm: true },
    { key: 'email', label: 'Email', type: 'email', editable: true, required: true, showInForm: true },
    { key: 'year', label: 'Year', type: 'number', editable: true, required: true, showInForm: true },
    { key: 'dept_id', label: 'Department', type: 'select', options: departments.map(d => ({ value: d.Department_ID, label: d.Dept_Name })), editable: true, required: true, showInForm: true },
    { key: 'DepartmentName', label: 'Department Name', editable: false, showInTable: true, showInForm: false },
  ];

  const issueColumns: TableColumn[] = [
    { key: 'Issue_ID', label: 'Issue ID', editable: false, showInForm: false },
    { key: 'Student_ID', label: 'Student', type: 'select', options: students.map(s => ({ value: s.student_id, label: `${s.name} (${s.student_id})` })), editable: true, required: true, showInForm: true },
    { key: 'Book_ID', label: 'Book', type: 'select', options: books.map(b => ({ value: b.Book_ID, label: `${b.Title} (${b.Available_Copies} available)` })), editable: true, required: true, showInForm: true },
    { key: 'Issue_Date', label: 'Issue Date', type: 'date', editable: true, required: true, defaultValue: new Date().toISOString().split('T')[0], showInForm: true },
    { key: 'Due_Date', label: 'Due Date', type: 'date', editable: true, required: true, defaultValue: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], showInForm: true },
    { key: 'Return_Date', label: 'Return Date', type: 'date', editable: true, showInForm: true },
    { key: 'Renewal_Count', label: 'Renewals', type: 'number', editable: true, defaultValue: 0, showInForm: false },
    { key: 'Librarian_ID', label: 'Librarian ID', editable: false, showInForm: false },
    { key: 'Student_Display', label: 'Student', editable: false, showInTable: true, showInForm: false },
    { key: 'Book_Title', label: 'Book Title', editable: false, showInTable: true, showInForm: false },
  ];

  const fineColumns: TableColumn[] = [
    { key: 'Fine_ID', label: 'Fine ID', editable: false, showInForm: false },
    { key: 'Issue_ID', label: 'Issue', type: 'select', options: issuesWithoutFines.map(i => ({ value: i.Issue_ID, label: `${i.BookTitle} - ${i.StudentName}` })), editable: true, required: true, showInForm: true },
    { key: 'Amount', label: 'Amount (₹)', type: 'number', editable: true, required: true, showInForm: true },
    { key: 'Status', label: 'Status', type: 'select', options: [
      { value: 'Unpaid', label: 'Unpaid' },
      { value: 'Paid', label: 'Paid' }
    ], editable: true, required: true, defaultValue: 'Unpaid', showInForm: true },
    { key: 'Date_Calculated', label: 'Date Calculated', type: 'date', editable: true, defaultValue: new Date().toISOString().split('T')[0], readOnly: true, showInForm: true },
    { key: 'StudentName', label: 'Student', editable: false, showInTable: true, showInForm: false },
    { key: 'BookTitle', label: 'Book', editable: false, showInTable: true, showInForm: false },
  ];

  const handleBookAdd = async (newRecord: any) => {
    const payload = {
      ...newRecord,
      Book_ID: newRecord.Book_ID ?? Math.floor(Date.now() / 1000),
    };
    const { error } = await supabase.from('BOOK').insert([payload]);
    if (error) throw error;
  };

  const handleBookUpdate = async (id: string | number, updates: any) => {
    const { error } = await supabase.from('BOOK').update(updates).eq('Book_ID', Number(id));
    if (error) {
      if (error.message?.includes('foreign key constraint')) {
        throw new Error('Cannot update this book because it is referenced by existing issue records.');
      }
      throw error;
    }
  };

  const handleBookDelete = async (id: string | number) => {
    const bookId = Number(id);

    const { error } = await supabase.from('BOOK').delete().eq('Book_ID', bookId);
    if (error) {
      if (error.message?.includes('foreign key constraint')) {
        const { data: referencingIssues, error: issuesError } = await supabase
          .from('ISSUE')
          .select('Issue_ID, Student_ID, Return_Date')
          .eq('Book_ID', bookId)
          .limit(5);

        if (issuesError) {
          throw new Error('Cannot delete this book because it is still referenced by issue records (failed to list details).');
        }

        if (referencingIssues && referencingIssues.length > 0) {
          const issueList = referencingIssues.map(issue => `#${issue.Issue_ID}`).join(', ');
          throw new Error(`Cannot delete this book because issue(s) ${issueList}${referencingIssues.length === 5 ? '...' : ''} still reference it.`);
        }

        throw new Error('Cannot delete this book because it is still referenced by issue records.');
      }
      throw error;
    }
  };

  const handleStudentAdd = async (newRecord: any) => {
    const payload = {
      student_id: newRecord.student_id,
      name: newRecord.name,
      email: newRecord.email.toLowerCase(),
      year: Number(newRecord.year),
      dept_id: newRecord.dept_id,
    };
    const { error } = await supabase.from('STUDENT').insert([payload]);
    if (error) throw error;
  };

  const handleStudentUpdate = async (id: string | number, updates: any) => {
    const payload = { ...updates };
    if (payload.year) payload.year = Number(payload.year);
    if (payload.email) payload.email = payload.email.toLowerCase();
    const { error } = await supabase.from('STUDENT').update(payload).eq('student_id', String(id));
    if (error) throw error;
  };

  const handleStudentDelete = async (id: string | number) => {
    const { error } = await supabase.from('STUDENT').delete().eq('student_id', String(id));
    if (error) throw error;
  };

  const handleIssueAdd = async (newRecord: any) => {
    const payload: any = {
      Student_ID: newRecord.Student_ID,
      Book_ID: Number(newRecord.Book_ID),
      Librarian_ID: userId,
      Issue_Date: newRecord.Issue_Date,
      Due_Date: newRecord.Due_Date,
      Return_Date: newRecord.Return_Date || null,
      Renewal_Count: 0,
    };
    const { error } = await supabase.from('ISSUE').insert([payload] as any);
    if (error) throw error;
  };

  const handleIssueUpdate = async (id: string | number, updates: any) => {
    const payload = { ...updates };
    const { error } = await supabase.from('ISSUE').update(payload).eq('Issue_ID', Number(id));
    if (error) throw error;
  };

  const handleIssueDelete = async (id: string | number) => {
    const { error } = await supabase.from('ISSUE').delete().eq('Issue_ID', Number(id));
    if (error) throw error;
  };

  const handleFineAdd = async (newRecord: any) => {
    const payload: any = {
      Issue_ID: Number(newRecord.Issue_ID),
      Amount: Number(newRecord.Amount),
      Status: newRecord.Status || 'Unpaid',
      Date_Calculated: newRecord.Date_Calculated,
    };
    const { error } = await supabase.from('FINE').insert([payload] as any);
    if (error) throw error;
  };

  const handleFineUpdate = async (id: string | number, updates: any) => {
    const payload = { ...updates };
    if (payload.Amount) payload.Amount = Number(payload.Amount);
    const { error } = await supabase.from('FINE').update(payload).eq('Fine_ID', Number(id));
    if (error) throw error;
  };

  const handleFineDelete = async (id: string | number) => {
    const { error } = await supabase.from('FINE').delete().eq('Fine_ID', Number(id));
    if (error) throw error;
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground mb-6">Librarian Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Books
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalBooks}</div>
            <p className="text-xs text-muted-foreground mt-1">In library</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Students
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.totalStudents}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Issues
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.activeIssues}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently issued</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Overdue Books
            </CardTitle>
            <Clock className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.overdueBooks}</div>
            <p className="text-xs text-muted-foreground mt-1">Need attention</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="books" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="books">Books</TabsTrigger>
          <TabsTrigger value="students">Students</TabsTrigger>
          <TabsTrigger value="issues">Issues</TabsTrigger>
          <TabsTrigger value="fines">Fines</TabsTrigger>
        </TabsList>

        <TabsContent value="books" className="mt-6">
          <TableEditor
            title="Books Management"
            columns={bookColumns}
            data={books}
            onAdd={handleBookAdd}
            onUpdate={handleBookUpdate}
            onDelete={handleBookDelete}
            idField="Book_ID"
            onRefresh={async () => setRefreshTrigger(prev => prev + 1)}
            uniqueFields={['Title']}
          />
        </TabsContent>

        <TabsContent value="students" className="mt-6">
          <TableEditor
            title="Students Management"
            columns={studentColumns}
            data={students}
            onAdd={handleStudentAdd}
            onUpdate={handleStudentUpdate}
            onDelete={handleStudentDelete}
            idField="student_id"
            onRefresh={async () => setRefreshTrigger(prev => prev + 1)}
            uniqueFields={['student_id', 'email']}
          />
        </TabsContent>

        <TabsContent value="issues" className="mt-6">
          <TableEditor
            title="Issues Management"
            columns={issueColumns}
            data={issues}
            onAdd={handleIssueAdd}
            onUpdate={handleIssueUpdate}
            onDelete={handleIssueDelete}
            idField="Issue_ID"
            onRefresh={async () => setRefreshTrigger(prev => prev + 1)}
          />
        </TabsContent>

        <TabsContent value="fines" className="mt-6">
          <TableEditor
            title="Fines Management"
            columns={fineColumns}
            data={fines}
            onAdd={handleFineAdd}
            onUpdate={handleFineUpdate}
            onDelete={handleFineDelete}
            idField="Fine_ID"
            onRefresh={async () => setRefreshTrigger(prev => prev + 1)}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

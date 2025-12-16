import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function Reports() {
  const [popularBooks, setPopularBooks] = useState<any[]>([]);
  const [departmentStats, setDepartmentStats] = useState<any[]>([]);
  const [overdueStats, setOverdueStats] = useState({ count: 0, totalFines: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      // Most popular books
      const { data: books } = await supabase
        .from('ISSUE')
        .select(`
          Book_ID,
          BOOK(Title, AUTHOR(Author_Name))
        `);

      const bookCounts = books?.reduce((acc: any, issue) => {
        const bookId = issue.Book_ID;
        if (!acc[bookId]) {
          acc[bookId] = {
            title: issue.BOOK?.Title,
            author: issue.BOOK?.AUTHOR?.Author_Name,
            count: 0,
          };
        }
        acc[bookId].count++;
        return acc;
      }, {});

      const sortedBooks = Object.values(bookCounts || {})
        .sort((a: any, b: any) => b.count - a.count)
        .slice(0, 10);
      setPopularBooks(sortedBooks as any[]);

      // Department-wise statistics
      const { data: deptData } = await supabase
        .from('STUDENT')
        .select(`
          dept_id,
          DEPARTMENT(Dept_Name)
        `);

      const deptCounts = deptData?.reduce((acc: any, student) => {
        const deptId = student.dept_id;
        if (!acc[deptId]) {
          acc[deptId] = {
            name: student.DEPARTMENT?.Dept_Name || 'Unknown',
            count: 0,
          };
        }
        acc[deptId].count++;
        return acc;
      }, {});

      setDepartmentStats(Object.values(deptCounts || {}));

      // Overdue statistics
      const { data: overdueIssues } = await supabase
        .from('ISSUE')
        .select('*')
        .is('Return_Date', null)
        .lt('Due_Date', new Date().toISOString().split('T')[0]);

      const { data: unpaidFines } = await supabase
        .from('FINE')
        .select('Amount')
        .eq('Status', 'Unpaid');

      const totalFines = unpaidFines?.reduce((sum, fine) => sum + Number(fine.Amount), 0) || 0;

      setOverdueStats({
        count: overdueIssues?.length || 0,
        totalFines,
      });
    } catch (error) {
      console.error('Error fetching reports:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center text-muted-foreground">Loading reports...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-6">Reports & Analytics</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Overdue Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-foreground">{overdueStats.count}</p>
                <p className="text-sm text-muted-foreground">Books overdue</p>
                <p className="text-xl font-semibold text-destructive mt-4">
                  ₹{overdueStats.totalFines.toFixed(2)}
                </p>
                <p className="text-sm text-muted-foreground">Total unpaid fines</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Department-wise Students</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {departmentStats.map((dept: any, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{dept.name}</span>
                    <span className="font-semibold">{dept.count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Most Popular Books</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rank</TableHead>
                  <TableHead>Book Title</TableHead>
                  <TableHead>Author</TableHead>
                  <TableHead>Times Issued</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {popularBooks.map((book, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>{book.title}</TableCell>
                    <TableCell>{book.author}</TableCell>
                    <TableCell>{book.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

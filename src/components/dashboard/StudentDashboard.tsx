import { useEffect, useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Receipt, Clock } from 'lucide-react';

export function StudentDashboard() {
  const { userId } = useAuth();
  const hasLoadedRef = useRef(false);
  const [stats, setStats] = useState({
    booksIssued: 0,
    overdueBooks: 0,
    totalFines: 0,
  });
  const [myBooks, setMyBooks] = useState<any[]>([]);
  const [myFines, setMyFines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Only fetch data on initial mount
    if (!hasLoadedRef.current && userId) {
      hasLoadedRef.current = true;
      fetchStudentData();
    }
  }, [userId]);

  const fetchStudentData = async () => {
    if (!userId) return;

    try {
      // Fetch books issued (not returned)
      const { data: issues } = await supabase
        .from('ISSUE')
        .select(`
          *,
          BOOK(Title, Author_ID, AUTHOR(Author_Name)),
          STUDENT(name)
        `)
        .eq('Student_ID', String(userId))
        .is('Return_Date', null)
        .order('Issue_Date', { ascending: false });

      // Count overdue books
      const today = new Date().toISOString().split('T')[0];
      const overdueCount = issues?.filter(
        issue => issue.Due_Date && issue.Due_Date < today
      ).length || 0;

      setMyBooks(issues || []);

      // Fetch fines for this student's issues
      const issueIds = issues?.map(i => i.Issue_ID) || [];
      const { data: fines } = await supabase
        .from('FINE')
        .select(`
          *,
          ISSUE(
            Issue_Date,
            Due_Date,
            Return_Date,
            BOOK(Title)
          )
        `)
        .in('Issue_ID', issueIds)
        .order('Date_Calculated', { ascending: false });

      setMyFines(fines || []);

      const totalFines = fines
        ?.filter(f => f.Status === 'Unpaid')
        .reduce((sum, f) => sum + Number(f.Amount), 0) || 0;

      setStats({
        booksIssued: issues?.length || 0,
        overdueBooks: overdueCount,
        totalFines,
      });
    } catch (error) {
      console.error('Error fetching student data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading dashboard...</div>;
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-foreground mb-6">Student Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Books Issued
            </CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.booksIssued}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently borrowed</p>
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
            <p className="text-xs text-muted-foreground mt-1">Need to return</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Fines
            </CardTitle>
            <Receipt className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">₹{stats.totalFines.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Unpaid amount</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="books" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="books">My Books</TabsTrigger>
          <TabsTrigger value="fines">My Fines</TabsTrigger>
        </TabsList>

        <TabsContent value="books" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Currently Issued Books</CardTitle>
            </CardHeader>
            <CardContent>
              {myBooks.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Book Title</TableHead>
                        <TableHead>Author</TableHead>
                        <TableHead>Issue Date</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myBooks.map((issue) => {
                        const today = new Date().toISOString().split('T')[0];
                        const isOverdue = issue.Due_Date && issue.Due_Date < today;
                        return (
                          <TableRow key={issue.Issue_ID}>
                            <TableCell className="font-medium">{issue.BOOK?.Title}</TableCell>
                            <TableCell>{issue.BOOK?.AUTHOR?.Author_Name || 'Unknown'}</TableCell>
                            <TableCell>{new Date(issue.Issue_Date).toLocaleDateString()}</TableCell>
                            <TableCell>{new Date(issue.Due_Date).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <Badge variant={isOverdue ? 'destructive' : 'default'}>
                                {isOverdue ? 'Overdue' : 'Active'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No books currently issued.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fines" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>My Fines</CardTitle>
            </CardHeader>
            <CardContent>
              {myFines.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Book Title</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Return Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {myFines.map((fine) => (
                        <TableRow key={fine.Fine_ID}>
                          <TableCell className="font-medium">{fine.ISSUE?.BOOK?.Title}</TableCell>
                          <TableCell>{new Date(fine.ISSUE?.Due_Date).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(fine.ISSUE?.Return_Date).toLocaleDateString()}</TableCell>
                          <TableCell>₹{Number(fine.Amount).toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant={fine.Status === 'Paid' ? 'secondary' : 'destructive'}>
                              {fine.Status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">No fines recorded.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

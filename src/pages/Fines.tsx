import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';

export default function Fines() {
  const { userRole, userId } = useAuth();
  const [fines, setFines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFines();
  }, [userId, userRole]);

  const fetchFines = async () => {
    try {
      let query = supabase
        .from('FINE')
        .select(`
          *,
          ISSUE(
            Issue_Date,
            Due_Date,
            Return_Date,
            Student_ID,
            BOOK(Title),
            STUDENT(name)
          )
        `)
        .order('Date_Calculated', { ascending: false });

      // Filter by student if not librarian
      if (userRole === 'student') {
        const { data: issues } = await supabase
          .from('ISSUE')
          .select('Issue_ID')
          .eq('Student_ID', String(userId));
        
        const issueIds = issues?.map(i => i.Issue_ID) || [];
        if (issueIds.length > 0) {
          query = query.in('Issue_ID', issueIds);
        } else {
          query = query.eq('Issue_ID', -1); // No issues, return empty
        }
      }

      const { data, error } = await query;

      if (error) throw error;
      setFines(data || []);
    } catch (error) {
      console.error('Error fetching fines:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayFine = async (fineId: number) => {
    try {
      // Update local state immediately for instant UI feedback
      setFines(prevFines =>
        prevFines.map(fine =>
          fine.Fine_ID === fineId ? { ...fine, Status: 'Paid' } : fine
        )
      );

      const { error } = await supabase
        .from('FINE')
        .update({ Status: 'Paid' })
        .eq('Fine_ID', fineId);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Fine marked as paid',
      });
    } catch (error: any) {
      // Revert local state on error
      fetchFines();
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const totalUnpaid = fines
    .filter(f => f.Status === 'Unpaid')
    .reduce((sum, f) => sum + Number(f.Amount), 0);

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center text-muted-foreground">Loading fines...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-6">Fines</h1>

        {totalUnpaid > 0 && (
          <Card className="mb-6 border-destructive">
            <CardHeader>
              <CardTitle className="text-destructive">Outstanding Fines</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">₹{totalUnpaid.toFixed(2)}</p>
              <p className="text-sm text-muted-foreground mt-1">Total unpaid amount</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Fine History</CardTitle>
          </CardHeader>
          <CardContent>
            {fines.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    {userRole === 'librarian' && <TableHead>Student</TableHead>}
                    <TableHead>Due Date</TableHead>
                    <TableHead>Return Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    {userRole === 'librarian' && <TableHead>Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fines.map((fine) => (
                    <TableRow key={fine.Fine_ID}>
                      <TableCell className="font-medium">{fine.ISSUE?.BOOK?.Title}</TableCell>
                      {userRole === 'librarian' && (
                        <TableCell>{fine.ISSUE?.STUDENT?.name}</TableCell>
                      )}
                      <TableCell>{new Date(fine.ISSUE?.Due_Date).toLocaleDateString()}</TableCell>
                      <TableCell>{new Date(fine.ISSUE?.Return_Date).toLocaleDateString()}</TableCell>
                      <TableCell>₹{Number(fine.Amount).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={fine.Status === 'Paid' ? 'secondary' : 'destructive'}>
                          {fine.Status}
                        </Badge>
                      </TableCell>
                      {userRole === 'librarian' && (
                        <TableCell>
                          {fine.Status === 'Unpaid' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handlePayFine(fine.Fine_ID)}
                            >
                              Mark Paid
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-8">No fines found.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

export function ActiveIssues() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveIssues();
  }, []);

  const fetchActiveIssues = async () => {
    try {
      const { data, error } = await supabase
        .from('ISSUE')
        .select(`
          *,
          STUDENT(name, student_id),
          BOOK(Title),
          LIBRARIAN(Name)
        `)
        .is('Return_Date', null)
        .order('Issue_Date', { ascending: false });

      if (error) throw error;
      setIssues(data || []);
    } catch (error) {
      console.error('Error fetching active issues:', error);
    } finally {
      setLoading(false);
    }
  };

  const isOverdue = (dueDate: string) => {
    return new Date(dueDate) < new Date();
  };

  if (loading) {
    return <div className="text-center text-muted-foreground">Loading active issues...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Active Issues ({issues.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {issues.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Issued By</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {issues.map((issue) => (
                <TableRow key={issue.Issue_ID}>
                  <TableCell className="font-medium">{issue.BOOK?.Title}</TableCell>
                  <TableCell>{issue.STUDENT?.name}</TableCell>
                  <TableCell>{new Date(issue.Issue_Date).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(issue.Due_Date).toLocaleDateString()}</TableCell>
                  <TableCell>{issue.LIBRARIAN?.Name || 'N/A'}</TableCell>
                  <TableCell>
                    <Badge variant={isOverdue(issue.Due_Date) ? 'destructive' : 'default'}>
                      {isOverdue(issue.Due_Date) ? 'Overdue' : 'Active'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <p className="text-center text-muted-foreground py-8">No active issues found.</p>
        )}
      </CardContent>
    </Card>
  );
}

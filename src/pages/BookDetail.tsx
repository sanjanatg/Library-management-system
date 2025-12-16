import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, User, Calendar } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface BookDetail {
  Book_ID: number;
  Title: string;
  Publisher: string | null;
  Year_of_Publication: number | null;
  Available_Copies: number;
  Author_ID: number | null;
  AUTHOR?: {
    Author_Name: string;
  };
}

interface IssueHistory {
  Issue_ID: number;
  Issue_Date: string;
  Due_Date: string | null;
  Return_Date: string | null;
  STUDENT?: {
    name: string;
  };
  LIBRARIAN?: {
    Name: string;
  };
}

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState<BookDetail | null>(null);
  const [issueHistory, setIssueHistory] = useState<IssueHistory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookDetails();
    fetchIssueHistory();
  }, [id]);

  const fetchBookDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('BOOK')
        .select(`
          *,
          AUTHOR (
            Author_Name
          )
        `)
        .eq('Book_ID', parseInt(id!))
        .single();

      if (error) throw error;
      setBook(data);
    } catch (error) {
      console.error('Error fetching book details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchIssueHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('ISSUE')
        .select(`
          *,
          STUDENT (
            name
          ),
          LIBRARIAN (
            Name
          )
        `)
        .eq('Book_ID', parseInt(id!))
        .order('Issue_Date', { ascending: false });

      if (error) throw error;
      setIssueHistory(data || []);
    } catch (error) {
      console.error('Error fetching issue history:', error);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center text-muted-foreground">Loading book details...</div>
      </MainLayout>
    );
  }

  if (!book) {
    return (
      <MainLayout>
        <div className="text-center text-muted-foreground">Book not found.</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div>
        <Button
          variant="ghost"
          onClick={() => navigate('/books')}
          className="mb-6"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Books
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl mb-2">{book.Title}</CardTitle>
                <p className="text-muted-foreground">
                  by {book.AUTHOR?.Author_Name || 'Unknown Author'}
                </p>
              </div>
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Publisher</p>
                <p className="font-medium">{book.Publisher || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Year of Publication</p>
                <p className="font-medium">{book.Year_of_Publication || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Available Copies</p>
                <Badge variant={book.Available_Copies > 0 ? 'default' : 'secondary'}>
                  {book.Available_Copies}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Issue History</CardTitle>
          </CardHeader>
          <CardContent>
            {issueHistory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Issue Date</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead>Return Date</TableHead>
                    <TableHead>Issued By</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {issueHistory.map((issue) => (
                    <TableRow key={issue.Issue_ID}>
                      <TableCell>{issue.STUDENT?.name || 'N/A'}</TableCell>
                      <TableCell>{new Date(issue.Issue_Date).toLocaleDateString()}</TableCell>
                      <TableCell>{issue.Due_Date ? new Date(issue.Due_Date).toLocaleDateString() : 'N/A'}</TableCell>
                      <TableCell>{issue.Return_Date ? new Date(issue.Return_Date).toLocaleDateString() : '-'}</TableCell>
                      <TableCell>{issue.LIBRARIAN?.Name || 'N/A'}</TableCell>
                      <TableCell>
                        <Badge variant={issue.Return_Date ? 'secondary' : 'default'}>
                          {issue.Return_Date ? 'Returned' : 'Active'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-center text-muted-foreground py-4">No issue history available.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';

export function IssueBookForm() {
  const { userId } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');
  const [selectedBook, setSelectedBook] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchAvailableBooks();
  }, []);

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('STUDENT')
      .select('*')
      .order('name');
    setStudents(data || []);
  };

  const fetchAvailableBooks = async () => {
    const { data } = await supabase
      .from('BOOK')
      .select('*, AUTHOR(Author_Name)')
      .gt('Available_Copies', 0)
      .order('Title');
    setBooks(data || []);
  };

  const handleIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent || !selectedBook) {
      toast({
        title: 'Error',
        description: 'Please select both student and book',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      if (!userId) {
        throw new Error('Unable to determine your librarian identity. Please re-login.');
      }

      const librarianId = Number(userId);
      const issueDate = new Date().toISOString().split('T')[0];
      const dueDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const studentId = selectedStudent;
      const bookId = Number(selectedBook);

      const { data: studentExists, error: studentError } = await supabase
        .from('STUDENT')
        .select('student_id')
        .eq('student_id', studentId)
        .single();

      if (studentError || !studentExists) {
        throw new Error('Selected student ID is invalid. Please choose a valid student.');
      }

      const { data: bookRecord, error: bookError } = await supabase
        .from('BOOK')
        .select('Book_ID, Available_Copies')
        .eq('Book_ID', bookId)
        .single();

      if (bookError || !bookRecord) {
        throw new Error('Selected book is invalid. Please choose another book.');
      }

      if (bookRecord.Available_Copies <= 0) {
        throw new Error('Selected book does not have available copies.');
      }

      const { data: issueData, error: issueError } = await supabase
        .from('ISSUE')
        .insert([{ 
          Student_ID: studentId,
          Book_ID: bookRecord.Book_ID,
          Librarian_ID: userId,
          Issue_Date: issueDate,
          Due_Date: dueDate,
          Renewal_Count: 0,
          Issue_ID: Math.floor(Math.random() * 1000000), // Temporary ID
        }])
        .select()
        .single();

      if (issueError) throw issueError;

      // Update available copies
      const { error: updateError } = await supabase
        .from('BOOK')
        .update({ Available_Copies: bookRecord.Available_Copies - 1 })
        .eq('Book_ID', bookRecord.Book_ID);

      if (updateError) throw updateError;

      toast({
        title: 'Success',
        description: 'Book issued successfully',
      });

      setSelectedStudent('');
      setSelectedBook('');
      fetchAvailableBooks();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issue a Book</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleIssue} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student">Select Student</Label>
            <Select value={selectedStudent} onValueChange={setSelectedStudent}>
              <SelectTrigger id="student">
                <SelectValue placeholder="Choose a student" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student) => (
                  <SelectItem key={student.student_id} value={student.student_id.toString()}>
                    {student.name} (ID: {student.student_id})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="book">Select Book</Label>
            <Select value={selectedBook} onValueChange={setSelectedBook}>
              <SelectTrigger id="book">
                <SelectValue placeholder="Choose a book" />
              </SelectTrigger>
              <SelectContent>
                {books.map((book) => (
                  <SelectItem key={book.Book_ID} value={book.Book_ID.toString()}>
                    {book.Title} by {book.AUTHOR?.Author_Name} ({book.Available_Copies} available)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Issuing...' : 'Issue Book'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

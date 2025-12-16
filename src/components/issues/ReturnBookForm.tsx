import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export function ReturnBookForm() {
  const [activeIssues, setActiveIssues] = useState<any[]>([]);
  const [selectedIssue, setSelectedIssue] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchActiveIssues();
  }, []);

  const fetchActiveIssues = async () => {
    const { data } = await supabase
      .from('ISSUE')
      .select(`
        *,
        STUDENT(name),
        BOOK(Title, Book_ID, Available_Copies)
      `)
      .is('Return_Date', null)
      .order('Issue_Date', { ascending: false });
    setActiveIssues(data || []);
  };

  const calculateFine = (dueDate: string) => {
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today.getTime() - due.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return diffDays * 5; // ₹5 per day fine
    }
    return 0;
  };

  const handleReturn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedIssue) {
      toast({
        title: 'Error',
        description: 'Please select an issue to return',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const issue = activeIssues.find(i => i.Issue_ID === parseInt(selectedIssue));
      const returnDate = new Date().toISOString().split('T')[0];

      // Update issue record
      const { error: returnError } = await supabase
        .from('ISSUE')
        .update({ Return_Date: returnDate })
        .eq('Issue_ID', parseInt(selectedIssue));

      if (returnError) throw returnError;

      // Update available copies
      const { error: updateError } = await supabase
        .from('BOOK')
        .update({ Available_Copies: issue.BOOK.Available_Copies + 1 })
        .eq('Book_ID', issue.BOOK.Book_ID);

      if (updateError) throw updateError;

      // Calculate and create fine if overdue
      const fineAmount = calculateFine(issue.Due_Date);
      if (fineAmount > 0) {
        const { data: fineData, error: fineError } = await supabase
          .from('FINE')
          .insert([{
            Fine_ID: Math.floor(Math.random() * 1000000), // Temporary ID
            Issue_ID: parseInt(selectedIssue),
            Amount: fineAmount,
            Status: 'Unpaid',
            Date_Calculated: returnDate,
          }])
          .select()
          .single();

        if (fineError) throw fineError;

        toast({
          title: 'Book Returned',
          description: `Fine of ₹${fineAmount} has been applied for overdue return.`,
        });
      } else {
        toast({
          title: 'Success',
          description: 'Book returned successfully',
        });
      }

      setSelectedIssue('');
      fetchActiveIssues();
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
        <CardTitle>Return a Book</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleReturn} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="issue">Select Issue to Return</Label>
            <Select value={selectedIssue} onValueChange={setSelectedIssue}>
              <SelectTrigger id="issue">
                <SelectValue placeholder="Choose an active issue" />
              </SelectTrigger>
              <SelectContent>
                {activeIssues.map((issue) => {
                  const fineAmount = calculateFine(issue.Due_Date);
                  return (
                    <SelectItem key={issue.Issue_ID} value={issue.Issue_ID.toString()}>
                      {issue.BOOK?.Title} - {issue.STUDENT?.name}
                      {fineAmount > 0 && ` (Fine: ₹${fineAmount})`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {selectedIssue && (
            <div className="p-4 bg-muted rounded-md">
              {(() => {
                const issue = activeIssues.find(i => i.Issue_ID === parseInt(selectedIssue));
                const fineAmount = calculateFine(issue?.Due_Date);
                return (
                  <div className="space-y-2 text-sm">
                    <p><span className="font-medium">Book:</span> {issue?.BOOK?.Title}</p>
                    <p><span className="font-medium">Student:</span> {issue?.STUDENT?.name}</p>
                    <p><span className="font-medium">Issue Date:</span> {new Date(issue?.Issue_Date).toLocaleDateString()}</p>
                    <p><span className="font-medium">Due Date:</span> {new Date(issue?.Due_Date).toLocaleDateString()}</p>
                    {fineAmount > 0 && (
                      <div className="pt-2 border-t">
                        <Badge variant="destructive">
                          Overdue Fine: ₹{fineAmount}
                        </Badge>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? 'Processing...' : 'Return Book'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

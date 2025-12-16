import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, BookOpen } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Book {
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

export default function Books() {
  const [books, setBooks] = useState<Book[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Book[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const { data, error } = await supabase
        .from('BOOK')
        .select(`
          *,
          AUTHOR (
            Author_Name
          )
        `)
        .order('Title');

      if (error) throw error;
      setBooks(data || []);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults(null);
      setSearchError(null);
      return;
    }

    const normalized = searchTerm.trim().toLowerCase();
    let isCurrent = true;
    const fetchSearch = async () => {
      setSearching(true);
      setSearchError(null);
      try {
        const { data, error } = await supabase
          .from('BOOK')
          .select(`
            *,
            AUTHOR(Author_Name)
          `)
          .or(`Title.ilike.%${normalized}%,AUTHOR.Author_Name.ilike.%${normalized}%`)
          .order('Title');

        if (!isCurrent) return;
        if (error) {
          setSearchError(error.message);
          setSearchResults([]);
        } else {
          setSearchResults(data || []);
        }
      } catch (error: any) {
        if (!isCurrent) return;
        setSearchError(error.message);
        setSearchResults([]);
      } finally {
        if (isCurrent) setSearching(false);
      }
    };

    fetchSearch();
    return () => {
      isCurrent = false;
    };
  }, [searchTerm]);

  const normalizedSearch = searchTerm.trim().toLowerCase();
  const booksToShow = searchResults ?? books;

  const handleDeleteBook = async (bookId: number) => {
    try {
      const { error } = await supabase
        .from('BOOK')
        .delete()
        .eq('Book_ID', bookId);
      if (error) throw error;
      setBooks(prev => prev.filter(book => book.Book_ID !== bookId));
      if (searchResults) {
        setSearchResults(prev => prev?.filter(book => book.Book_ID !== bookId) ?? []);
      }
    } catch (err) {
      console.error('Error deleting book:', err);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center text-muted-foreground">Loading books...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-6">Books Catalog</h1>

        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by title or author..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {booksToShow.map((book) => (
            <Card key={book.Book_ID} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg mb-2">{book.Title}</CardTitle>
                    <p className="text-sm text-muted-foreground">
                      by {book.AUTHOR?.Author_Name || 'Unknown Author'}
                    </p>
                  </div>
                  <BookOpen className="h-5 w-5 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {book.Publisher && (
                    <p className="text-sm text-muted-foreground">
                      Publisher: {book.Publisher}
                    </p>
                  )}
                  {book.Year_of_Publication && (
                    <p className="text-sm text-muted-foreground">
                      Year: {book.Year_of_Publication}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-4">
                    <Badge variant={book.Available_Copies > 0 ? 'default' : 'secondary'}>
                      {book.Available_Copies > 0 
                        ? `${book.Available_Copies} available`
                        : 'Not available'
                      }
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/books/${book.Book_ID}`)}
                    >
                      Details
                    </Button>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate(`/books/${book.Book_ID}`)}
                    >
                      Details
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteBook(book.Book_ID)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {booksToShow.length === 0 && (
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">No books found matching your search.</p>
            {normalizedSearch && (
              <p className="text-sm text-muted-foreground mt-2">
                Want to add <span className="font-semibold">{searchTerm}</span>?
                <br />
                Visit the Librarian Dashboard and use the Books tab to add or delete records.
              </p>
            )}
          </Card>
        )}
      </div>
    </MainLayout>
  );
}

import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { BookOpen, Library, Users, BarChart } from 'lucide-react';

export default function Index() {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/dashboard');
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-muted/30 to-background p-8">
      <div className="w-full max-w-5xl mx-auto text-center space-y-12">
        <div className="space-y-4">
          <div className="flex justify-center mb-8">
            <div className="h-20 w-20 bg-primary rounded-full flex items-center justify-center shadow-lg">
              <Library className="h-10 w-10 text-primary-foreground" />
            </div>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-foreground">
            Library Management System
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Modern, efficient library management for students and librarians
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="p-6 bg-card rounded-lg border shadow-sm">
            <BookOpen className="h-8 w-8 text-primary mb-3 mx-auto" />
            <h3 className="font-semibold text-lg mb-2">Manage Books</h3>
            <p className="text-sm text-muted-foreground">Browse, issue, and return books with ease</p>
          </div>
          
          <div className="p-6 bg-card rounded-lg border shadow-sm">
            <Users className="h-8 w-8 text-primary mb-3 mx-auto" />
            <h3 className="font-semibold text-lg mb-2">Track Students</h3>
            <p className="text-sm text-muted-foreground">Monitor student activity and book history</p>
          </div>
          
          <div className="p-6 bg-card rounded-lg border shadow-sm">
            <BarChart className="h-8 w-8 text-primary mb-3 mx-auto" />
            <h3 className="font-semibold text-lg mb-2">View Reports</h3>
            <p className="text-sm text-muted-foreground">Analyze library statistics and trends</p>
          </div>
        </div>

        <div className="flex gap-4 justify-center pt-4">
          <Button size="lg" onClick={() => navigate('/auth')}>
            Get Started
          </Button>
          <Button size="lg" variant="outline" onClick={() => navigate('/auth')}>
            Sign In
          </Button>
        </div>
      </div>
    </div>
  );
}

import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  LayoutDashboard, 
  BookMarked, 
  Receipt, 
  BarChart3, 
  User, 
  LogOut,
  Menu
} from 'lucide-react';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { userRole, signOut } = useAuth();
  const location = useLocation();

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['student', 'librarian'] },
    { name: 'Books', href: '/books', icon: BookOpen, roles: ['student', 'librarian'] },
    { name: 'Issue/Return', href: '/issues', icon: BookMarked, roles: ['librarian'] },
    { name: 'Fines', href: '/fines', icon: Receipt, roles: ['student', 'librarian'] },
    { name: 'Reports', href: '/reports', icon: BarChart3, roles: ['librarian'] },
    { name: 'Profile', href: '/profile', icon: User, roles: ['student', 'librarian'] },
  ];

  const filteredNav = navigation.filter(item => 
    item.roles.includes(userRole || '')
  );

  const NavLinks = () => (
    <>
      {filteredNav.map((item) => {
        const isActive = location.pathname === item.href;
        return (
          <Link
            key={item.name}
            to={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-md transition-colors ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span>{item.name}</span>
          </Link>
        );
      })}
      <Button
        variant="ghost"
        className="flex items-center gap-3 px-4 py-3 w-full justify-start text-muted-foreground hover:bg-accent hover:text-accent-foreground"
        onClick={signOut}
      >
        <LogOut className="h-5 w-5" />
        <span>Sign Out</span>
      </Button>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center justify-between p-4 border-b">
        <h1 className="text-xl font-bold text-foreground">Library Management</h1>
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-foreground mb-6">Navigation</h2>
              <nav className="flex flex-col gap-2">
                <NavLinks />
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      <div className="flex">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-64 border-r min-h-screen bg-card">
          <div className="p-6">
            <h1 className="text-xl font-bold text-foreground mb-6">Library Management</h1>
            <nav className="flex flex-col gap-2">
              <NavLinks />
            </nav>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}

import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/MainLayout';
import { StudentDashboard } from '@/components/dashboard/StudentDashboard';
import { LibrarianDashboard } from '@/components/dashboard/LibrarianDashboard';

export default function Dashboard() {
  const { userRole } = useAuth();

  return (
    <MainLayout>
      {userRole === 'student' && <StudentDashboard />}
      {userRole === 'librarian' && <LibrarianDashboard />}
      {!userRole && (
        <div className="text-muted-foreground">
          <h2 className="text-xl font-semibold text-foreground mb-2">No role linked</h2>
          <p>Your account is authenticated but not linked to a Student or Librarian record.</p>
          <ul className="list-disc pl-6 mt-2 text-sm">
            <li>If you are a student, ensure your row in the STUDENT table has your login email in the <code>email</code> column.</li>
            <li>If you are a librarian, ensure your row in the LIBRARIAN table has your login email in the <code>Email</code> column.</li>
            <li>Ask the administrator to add the record if it’s missing, and verify Row Level Security allows read access for authenticated users.</li>
          </ul>
        </div>
      )}
    </MainLayout>
  );
}

import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { MainLayout } from '@/components/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Profile() {
  const { user, userRole, userId } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, [userId, userRole]);

  const fetchProfile = async () => {
    if (!userId || !userRole) return;

    try {
      if (userRole === 'student') {
        const { data, error } = await supabase
          .from('STUDENT')
          .select(`
            *,
            DEPARTMENT(Dept_Name)
          `)
          .eq('student_id', userId)
          .single();

        if (error) throw error;
        setProfileData(data);
      } else {
        const { data, error } = await supabase
          .from('LIBRARIAN')
          .select('*')
          .eq('Librarian_ID', userId)
          .single();

        if (error) throw error;
        setProfileData(data);
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="text-center text-muted-foreground">Loading profile...</div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-6">My Profile</h1>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Profile Information</CardTitle>
              <Badge>{userRole}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email}</p>
              </div>

              {userRole === 'student' && profileData && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{profileData.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Student ID</p>
                    <p className="font-medium">{profileData.student_id}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Year</p>
                    <p className="font-medium">{profileData.year}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="font-medium">{profileData.DEPARTMENT?.Dept_Name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Contact</p>
                    <p className="font-medium">{profileData.contact}</p>
                  </div>
                </>
              )}

              {userRole === 'librarian' && profileData && (
                <>
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{profileData.Name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Librarian ID</p>
                    <p className="font-medium">{profileData.Librarian_ID}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Role</p>
                    <p className="font-medium">{profileData.Role || 'N/A'}</p>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { BookOpen } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DEPARTMENT_CODES } from '@/constants/departments';
import { normalizeStudentId, validateStudentId } from '@/utils/studentId';

export default function Auth() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'student' | 'librarian'>('student');
  const [name, setName] = useState('');
  const [year, setYear] = useState<number | undefined>(undefined);
  const [deptId, setDeptId] = useState<string | undefined>(undefined);
  const [studentId, setStudentId] = useState<string>('');
  const [studentIdError, setStudentIdError] = useState<string>('');
  const [studentIdTouched, setStudentIdTouched] = useState<boolean>(false);
  const { signIn, signUp, user } = useAuth();
  const navigate = useNavigate();

  const isAllowedStudentEmail = (value: string) => /@cambridge\.edu\.(in|com)$/i.test(value.trim().toLowerCase());

  // Redirect if already logged in
  if (user) {
    navigate('/dashboard');
    return null;
  }

  // Validation summary:
  // - Users choose a role (student/librarian) in the form.
  // - If role === 'student', the email must end with '@cambridge.edu.in'.
  // - Librarians have no domain restriction.
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (role === 'student' && !isAllowedStudentEmail(email)) {
      setLoading(false);
      toast({
        title: 'Invalid email domain',
        description: 'Students must use their university email (e.g., name@cambridge.edu.in or name@cambridge.edu.com).',
        variant: 'destructive',
      });
      return;
    }

    // Sign In only needs email/password. Student extra fields are not required here.

    // Trim to avoid trailing/leading spaces breaking login
    const trimmedEmail = email.trim();
    const { error } = await signIn(trimmedEmail, password, role);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Signed in successfully!',
      });
      navigate('/dashboard');
    }

    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (role === 'student' && !isAllowedStudentEmail(email)) {
      setLoading(false);
      toast({
        title: 'Invalid email domain',
        description: 'Students must use their university email (e.g., name@cambridge.edu.in or name@cambridge.edu.com).',
        variant: 'destructive',
      });
      return;
    }

    // Trim to avoid accidental spaces during sign up
    const trimmedEmail = email.trim();
    const { error, insertError } = await signUp(trimmedEmail, password, role, {
      name: name || undefined,
      year,
      deptId,
      studentId: normalizeStudentId(studentId),
    });

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } else if (insertError) {
      toast({
        title: 'Account created, but linking failed',
        description: `Your auth account was created but we could not link your role record. ${insertError.message ?? ''}`,
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Account created! Please check your email to verify.',
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 bg-primary rounded-full flex items-center justify-center">
              <BookOpen className="h-6 w-6 text-primary-foreground" />
            </div>
          </div>
          <CardTitle className="text-2xl">Library Management System</CardTitle>
          <CardDescription>Sign in to access your library account</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-role">Role</Label>
                  <Select value={role} onValueChange={(v: 'student' | 'librarian') => setRole(v)}>
                    <SelectTrigger id="signin-role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="librarian">Librarian</SelectItem>
                    </SelectContent>
                  </Select>
                  {role === 'student' && (
                    <p className="text-xs text-muted-foreground">Students must use their university email (cambridge.edu.in or cambridge.edu.com).</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-role">Role</Label>
                  <Select value={role} onValueChange={(v: 'student' | 'librarian') => setRole(v)}>
                    <SelectTrigger id="signup-role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="librarian">Librarian</SelectItem>
                    </SelectContent>
                  </Select>
                  {role === 'student' && (
                    <p className="text-xs text-muted-foreground">Students must use their university email (cambridge.edu.in or cambridge.edu.com).</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Name</Label>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Your full name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                {role === 'student' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-year">Year</Label>
                      <Input
                        id="signup-year"
                        type="number"
                        placeholder="e.g., 3"
                        value={year ?? ''}
                        onChange={(e) => setYear(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-student-id">Student ID</Label>
                      <Input
                        id="signup-student-id"
                        type="text"
                        placeholder="e.g., 1cd23is145"
                        value={studentId}
                        onChange={(e) => {
                          setStudentId(e.target.value);
                          if (studentIdTouched) {
                            setStudentIdError(validateStudentId(e.target.value) ? '' : 'Format: 1cd<yy><branch><rrr>');
                          }
                        }}
                        onBlur={(e) => {
                          setStudentIdTouched(true);
                          const v = e.target.value;
                          setStudentIdError(validateStudentId(v) ? '' : 'Format: 1cd<yy><branch><rrr>');
                        }}
                      />
                      {studentIdTouched && studentIdError && (
                        <p className="text-xs text-destructive">{studentIdError}</p>
                      )}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-dept">Department</Label>
                      <Select value={deptId} onValueChange={(v) => setDeptId(v)}>
                        <SelectTrigger id="signup-dept">
                          <SelectValue placeholder="Select department" />
                        </SelectTrigger>
                        <SelectContent>
                          {DEPARTMENT_CODES.map((d) => (
                            <SelectItem key={d.code} value={d.code}>{`${d.code} - ${d.name}`}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Sign Up'}
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  Note: After signup, contact your librarian to link your account.
                </p>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

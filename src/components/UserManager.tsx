
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  Users, 
  UserCheck, 
  UserX, 
  Shield, 
  Clock, 
  AlertTriangle, 
  RefreshCw,
  Eye,
  Settings,
  Lock,
  Unlock,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  department: string;
  status: 'active' | 'disabled' | 'locked' | 'password_expired';
  lastLogin: string;
  groups: string[];
  applications: string[];
  trustDomain: string;
  passwordExpiry: string;
  failedLogins: number;
  twoFactorEnabled: boolean;
}

const UserManager = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Mock data - in real implementation, this would come from API
  const mockUsers: User[] = [
    {
      id: '1',
      username: 'jdoe',
      fullName: 'John Doe',
      email: 'john.doe@company.com',
      department: 'Engineering',
      status: 'active',
      lastLogin: '2024-06-14T10:30:00Z',
      groups: ['Developers', 'DevOps', 'All Users'],
      applications: ['Jenkins', 'GitLab', 'Monitoring Dashboard'],
      trustDomain: 'COMPANY.COM',
      passwordExpiry: '2024-12-15T00:00:00Z',
      failedLogins: 0,
      twoFactorEnabled: true
    },
    {
      id: '2',
      username: 'msmith',
      fullName: 'Mary Smith',
      email: 'mary.smith@company.com',
      department: 'HR',
      status: 'active',
      lastLogin: '2024-06-13T16:45:00Z',
      groups: ['HR Team', 'All Users'],
      applications: ['HR Portal', 'Payroll System'],
      trustDomain: 'COMPANY.COM',
      passwordExpiry: '2024-11-20T00:00:00Z',
      failedLogins: 1,
      twoFactorEnabled: false
    },
    {
      id: '3',
      username: 'bwilson',
      fullName: 'Bob Wilson',
      email: 'bob.wilson@company.com',
      department: 'IT',
      status: 'locked',
      lastLogin: '2024-06-10T09:15:00Z',
      groups: ['IT Admins', 'All Users'],
      applications: ['Admin Panel', 'Server Management', 'Network Tools'],
      trustDomain: 'COMPANY.COM',
      passwordExpiry: '2024-10-30T00:00:00Z',
      failedLogins: 5,
      twoFactorEnabled: true
    },
    {
      id: '4',
      username: 'agreen',
      fullName: 'Alice Green',
      email: 'alice.green@partner.com',
      department: 'External',
      status: 'password_expired',
      lastLogin: '2024-06-01T14:20:00Z',
      groups: ['External Users', 'Project Team A'],
      applications: ['Project Portal'],
      trustDomain: 'PARTNER.COM',
      passwordExpiry: '2024-06-01T00:00:00Z',
      failedLogins: 0,
      twoFactorEnabled: false
    }
  ];

  useEffect(() => {
    setUsers(mockUsers);
  }, []);

  const filteredUsers = users.filter(user =>
    user.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: User['status']) => {
    const variants = {
      active: 'default',
      disabled: 'secondary',
      locked: 'destructive',
      password_expired: 'outline'
    } as const;

    const labels = {
      active: 'Active',
      disabled: 'Disabled',
      locked: 'Locked',
      password_expired: 'Password Expired'
    };

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  const handleUserAction = (action: string, userId: string) => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      toast({
        title: "Action Completed",
        description: `User ${action} completed successfully`
      });
    }, 1000);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getUserStats = () => {
    const total = users.length;
    const active = users.filter(u => u.status === 'active').length;
    const locked = users.filter(u => u.status === 'locked').length;
    const expired = users.filter(u => u.status === 'password_expired').length;
    
    return { total, active, locked, expired };
  };

  const stats = getUserStats();

  return (
    <div className="space-y-6">
      {/* User Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <UserCheck className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Locked Users</CardTitle>
            <UserX className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.locked}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Password Expired</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.expired}</div>
          </CardContent>
        </Card>
      </div>

      {/* Main User Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>
                Manage user accounts, permissions, and access control
              </CardDescription>
            </div>
            <Button onClick={() => handleUserAction('refresh', '')} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="flex items-center space-x-2 mb-6">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name, username, email, or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>

          {/* Users Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Groups</TableHead>
                <TableHead>Trust Domain</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.fullName}</div>
                      <div className="text-sm text-muted-foreground">
                        {user.username} • {user.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{user.department}</TableCell>
                  <TableCell>{getStatusBadge(user.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1 text-muted-foreground" />
                      {formatDate(user.lastLogin)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {user.groups.slice(0, 2).map((group) => (
                        <Badge key={group} variant="outline" className="text-xs">
                          {group}
                        </Badge>
                      ))}
                      {user.groups.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{user.groups.length - 2}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{user.trustDomain}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      {user.status === 'locked' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUserAction('unlock', user.id)}
                          disabled={loading}
                        >
                          <Unlock className="h-3 w-3" />
                        </Button>
                      )}
                      {user.status === 'password_expired' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUserAction('reset password', user.id)}
                          disabled={loading}
                        >
                          <RotateCcw className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* User Details Modal/Panel */}
      {selectedUser && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>User Details: {selectedUser.fullName}</CardTitle>
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="overview" className="w-full">
              <TabsList>
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="access">Access & Permissions</TabsTrigger>
                <TabsTrigger value="security">Security</TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Username</label>
                    <p className="text-sm text-muted-foreground">{selectedUser.username}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Department</label>
                    <p className="text-sm text-muted-foreground">{selectedUser.department}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Status</label>
                    <div className="mt-1">{getStatusBadge(selectedUser.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Trust Domain</label>
                    <p className="text-sm text-muted-foreground">{selectedUser.trustDomain}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Last Login</label>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedUser.lastLogin)}</p>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="access" className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Group Memberships</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedUser.groups.map((group) => (
                      <Badge key={group} variant="outline">{group}</Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Application Access</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedUser.applications.map((app) => (
                      <Badge key={app} variant="default">{app}</Badge>
                    ))}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="security" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium">Password Expiry</label>
                    <p className="text-sm text-muted-foreground">{formatDate(selectedUser.passwordExpiry)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Failed Login Attempts</label>
                    <p className="text-sm text-muted-foreground">{selectedUser.failedLogins}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Two-Factor Authentication</label>
                    <Badge variant={selectedUser.twoFactorEnabled ? 'default' : 'destructive'}>
                      {selectedUser.twoFactorEnabled ? 'Enabled' : 'Disabled'}
                    </Badge>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserManager;

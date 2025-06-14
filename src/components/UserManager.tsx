import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { 
  User, 
  Users, 
  Search, 
  Shield, 
  Clock,
  Settings,
  UserCheck,
  UserX,
  Key
} from 'lucide-react';
import TemporaryAccess from './TemporaryAccess';

interface UserInfo {
  username: string;
  display_name: string;
  email: string;
  domain: string;
  status: 'active' | 'inactive';
  groups: string[];
  applications: string[];
  is_admin: boolean;
  last_login?: string;
}

const mockUsers: UserInfo[] = [
  {
    username: 'john.doe',
    display_name: 'John Doe',
    email: 'john.doe@example.com',
    domain: 'example.com',
    status: 'active',
    groups: ['developers', 'qa'],
    applications: ['app1', 'app2'],
    is_admin: false,
    last_login: '2024-01-20T14:30:00Z',
  },
  {
    username: 'jane.smith',
    display_name: 'Jane Smith',
    email: 'jane.smith@example.com',
    domain: 'example.com',
    status: 'inactive',
    groups: ['managers'],
    applications: ['app3'],
    is_admin: true,
    last_login: '2023-12-15T09:00:00Z',
  },
  {
    username: 'peter.jones',
    display_name: 'Peter Jones',
    email: 'peter.jones@example.com',
    domain: 'example.com',
    status: 'active',
    groups: ['developers', 'ops'],
    applications: ['app1', 'app4', 'app5'],
    is_admin: false,
    last_login: '2024-01-22T10:15:00Z',
  },
];

const UserManager = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserInfo | null>(null);
  const [activeTab, setActiveTab] = useState('users');

  const filteredUsers = mockUsers.filter((user) => {
    const searchStr = `${user.username} ${user.display_name} ${user.email}`.toLowerCase();
    return searchStr.includes(searchTerm.toLowerCase());
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">User Management</h2>
        <p className="text-muted-foreground">
          Manage user access, roles, and temporary permissions
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="users" className="flex items-center space-x-2">
            <Users className="h-4 w-4" />
            <span>Users</span>
          </TabsTrigger>
          <TabsTrigger value="temporary" className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>Temporary Access</span>
          </TabsTrigger>
          <TabsTrigger value="audit" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Audit Log</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* User Search and List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Users</CardTitle>
                  <CardDescription>
                    Search and manage user accounts
                  </CardDescription>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {filteredUsers.map((user) => (
                      <div
                        key={user.username}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedUser?.username === user.username
                            ? 'bg-primary/10 border-primary'
                            : 'hover:bg-accent'
                        }`}
                        onClick={() => setSelectedUser(user)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <User className="h-8 w-8 p-1 bg-muted rounded-full" />
                            <div>
                              <div className="font-medium">{user.display_name}</div>
                              <div className="text-sm text-muted-foreground">
                                {user.username}@{user.domain}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                              {user.status}
                            </Badge>
                            {user.is_admin && <Badge variant="destructive">Admin</Badge>}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* User Details */}
            <div>
              {selectedUser ? (
                <Card>
                  <CardHeader>
                    <CardTitle>User Details</CardTitle>
                    <CardDescription>
                      {selectedUser.display_name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Basic Information</h4>
                      <div className="space-y-1 text-sm">
                        <div><strong>Username:</strong> {selectedUser.username}</div>
                        <div><strong>Domain:</strong> {selectedUser.domain}</div>
                        <div><strong>Email:</strong> {selectedUser.email}</div>
                        <div><strong>Status:</strong> {selectedUser.status}</div>
                        <div><strong>Last Login:</strong> {selectedUser.last_login || 'Never'}</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Group Memberships ({selectedUser.groups.length})</h4>
                      <div className="space-y-1">
                        {selectedUser.groups.slice(0, 5).map((group) => (
                          <Badge key={group} variant="outline" className="text-xs">
                            {group}
                          </Badge>
                        ))}
                        {selectedUser.groups.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{selectedUser.groups.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Application Access</h4>
                      <div className="space-y-1">
                        {selectedUser.applications.map((app) => (
                          <div key={app} className="text-sm text-muted-foreground">
                            • {app}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2">
                      <Button size="sm" className="w-full">
                        <Settings className="h-4 w-4 mr-2" />
                        Edit User
                      </Button>
                      <Button size="sm" variant="outline" className="w-full">
                        <Key className="h-4 w-4 mr-2" />
                        Reset Password
                      </Button>
                      <Button 
                        size="sm" 
                        variant={selectedUser.status === 'active' ? 'destructive' : 'default'}
                        className="w-full"
                      >
                        {selectedUser.status === 'active' ? (
                          <>
                            <UserX className="h-4 w-4 mr-2" />
                            Disable User
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-4 w-4 mr-2" />
                            Enable User
                          </>
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Select a user to view details
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="temporary">
          <TemporaryAccess />
        </TabsContent>

        <TabsContent value="audit">
          <Card>
            <CardHeader>
              <CardTitle>Audit Log</CardTitle>
              <CardDescription>
                User access and activity audit log
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Audit Log</h3>
                <p className="text-muted-foreground">
                  Audit logging functionality will be implemented here
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default UserManager;

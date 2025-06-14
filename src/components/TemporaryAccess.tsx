
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Clock, User, Shield, Plus, AlertCircle, CheckCircle, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TemporaryAccessRequest {
  id: string;
  user: string;
  domain: string;
  application: string;
  environment: string;
  role: string;
  reason: string;
  requested_by: string;
  requested_at: string;
  expires_at: string;
  status: 'pending' | 'approved' | 'denied' | 'expired';
  approved_by?: string;
  approved_at?: string;
}

interface Application {
  name: string;
  environments: { name: string; roles: string[] }[];
}

const TemporaryAccess = () => {
  const [requests, setRequests] = useState<TemporaryAccessRequest[]>([]);
  const [applications, setApplications] = useState<Record<string, Application>>({});
  const [loading, setLoading] = useState(true);
  const [showGrantDialog, setShowGrantDialog] = useState(false);
  const { toast } = useToast();

  // Grant form state
  const [grantForm, setGrantForm] = useState({
    user: '',
    domain: '',
    application: '',
    environment: '',
    role: '',
    duration: '4', // hours
    reason: ''
  });

  const fetchRequests = async () => {
    try {
      const response = await fetch('/api/temporary-access');
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error('Failed to fetch temporary access requests:', error);
      toast({
        title: "Error",
        description: "Failed to fetch temporary access requests",
        variant: "destructive"
      });
    }
  };

  const fetchApplications = async () => {
    try {
      const response = await fetch('/api/applications');
      const data = await response.json();
      setApplications(data);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchRequests(), fetchApplications()]);
      setLoading(false);
    };
    loadData();
  }, []);

  const handleGrantAccess = async () => {
    try {
      const response = await fetch('/api/temporary-access/grant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...grantForm,
          duration_hours: parseInt(grantForm.duration)
        })
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Temporary access granted successfully"
        });
        setShowGrantDialog(false);
        setGrantForm({
          user: '',
          domain: '',
          application: '',
          environment: '',
          role: '',
          duration: '4',
          reason: ''
        });
        fetchRequests();
      } else {
        throw new Error('Failed to grant access');
      }
    } catch (error) {
      console.error('Failed to grant temporary access:', error);
      toast({
        title: "Error",
        description: "Failed to grant temporary access",
        variant: "destructive"
      });
    }
  };

  const handleApproveRequest = async (requestId: string) => {
    try {
      const response = await fetch(`/api/temporary-access/${requestId}/approve`, {
        method: 'POST'
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Access request approved"
        });
        fetchRequests();
      } else {
        throw new Error('Failed to approve request');
      }
    } catch (error) {
      console.error('Failed to approve request:', error);
      toast({
        title: "Error",
        description: "Failed to approve request",
        variant: "destructive"
      });
    }
  };

  const handleRevokeAccess = async (requestId: string) => {
    try {
      const response = await fetch(`/api/temporary-access/${requestId}/revoke`, {
        method: 'POST'
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Temporary access revoked"
        });
        fetchRequests();
      } else {
        throw new Error('Failed to revoke access');
      }
    } catch (error) {
      console.error('Failed to revoke access:', error);
      toast({
        title: "Error",
        description: "Failed to revoke access",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      pending: 'secondary',
      approved: 'default',
      denied: 'destructive',
      expired: 'outline'
    } as const;

    return <Badge variant={variants[status as keyof typeof variants] || 'secondary'}>{status}</Badge>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'denied':
        return <X className="h-4 w-4 text-red-500" />;
      case 'expired':
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p>Loading temporary access requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Temporary Access Management</h2>
          <p className="text-muted-foreground">
            Grant and manage temporary sudo access for applications
          </p>
        </div>
        <Dialog open={showGrantDialog} onOpenChange={setShowGrantDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Grant Temporary Access
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Grant Temporary Access</DialogTitle>
              <DialogDescription>
                Grant temporary sudo access to a user for a specific application
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="user">User</Label>
                  <Input
                    id="user"
                    value={grantForm.user}
                    onChange={(e) => setGrantForm({...grantForm, user: e.target.value})}
                    placeholder="username"
                  />
                </div>
                <div>
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    value={grantForm.domain}
                    onChange={(e) => setGrantForm({...grantForm, domain: e.target.value})}
                    placeholder="DOMAIN.COM"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="application">Application</Label>
                <Select value={grantForm.application} onValueChange={(value) => setGrantForm({...grantForm, application: value, environment: '', role: ''})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select application" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.keys(applications).map(app => (
                      <SelectItem key={app} value={app}>{app}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {grantForm.application && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="environment">Environment</Label>
                    <Select value={grantForm.environment} onValueChange={(value) => setGrantForm({...grantForm, environment: value, role: ''})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select environment" />
                      </SelectTrigger>
                      <SelectContent>
                        {applications[grantForm.application]?.environments.map(env => (
                          <SelectItem key={env.name} value={env.name}>{env.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="role">Role</Label>
                    <Select value={grantForm.role} onValueChange={(value) => setGrantForm({...grantForm, role: value})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent>
                        {grantForm.environment && applications[grantForm.application]?.environments
                          .find(env => env.name === grantForm.environment)?.roles.map(role => (
                          <SelectItem key={role} value={role}>{role}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="duration">Duration (hours)</Label>
                <Select value={grantForm.duration} onValueChange={(value) => setGrantForm({...grantForm, duration: value})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 hour</SelectItem>
                    <SelectItem value="2">2 hours</SelectItem>
                    <SelectItem value="4">4 hours</SelectItem>
                    <SelectItem value="8">8 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="reason">Reason</Label>
                <Textarea
                  id="reason"
                  value={grantForm.reason}
                  onChange={(e) => setGrantForm({...grantForm, reason: e.target.value})}
                  placeholder="Reason for temporary access..."
                />
              </div>

              <Button onClick={handleGrantAccess} className="w-full">
                Grant Access
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Active Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Access Requests</CardTitle>
          <CardDescription>
            Current temporary access requests and their status
          </CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No Access Requests</h3>
              <p className="text-muted-foreground">
                No temporary access requests found
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {requests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(request.status)}
                      <div>
                        <h4 className="font-medium">
                          {request.user}@{request.domain}
                        </h4>
                        <p className="text-sm text-muted-foreground">
                          {request.application} - {request.environment} ({request.role})
                        </p>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                    <div className="mt-2 text-xs text-muted-foreground">
                      <p>Requested: {new Date(request.requested_at).toLocaleString()}</p>
                      <p>Expires: {new Date(request.expires_at).toLocaleString()}</p>
                      {request.reason && <p>Reason: {request.reason}</p>}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {request.status === 'pending' && (
                      <Button size="sm" onClick={() => handleApproveRequest(request.id)}>
                        Approve
                      </Button>
                    )}
                    {request.status === 'approved' && (
                      <Button 
                        size="sm" 
                        variant="destructive" 
                        onClick={() => handleRevokeAccess(request.id)}
                      >
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Information Alert */}
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Temporary Access Process:</strong>
          <br />
          1. Grant temporary access creates temporary IdM groups and rules
          <br />
          2. User gains sudo access for the specified duration
          <br />
          3. Access automatically expires and cleanup occurs
          <br />
          4. All activities are logged and auditable
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default TemporaryAccess;

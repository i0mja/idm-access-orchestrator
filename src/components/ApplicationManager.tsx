
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Plus, 
  Settings, 
  Play, 
  Trash2, 
  Edit,
  Server,
  Users,
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TrustDomain {
  name: string;
  netbios_name: string;
  realm: string;
  type: string;
}

interface Application {
  name: string;
  description: string;
  realms: string[];
  environments: Environment[];
  created_at: string;
  updated_at: string;
  last_applied?: string;
  last_apply_results?: any;
}

interface Environment {
  name: string;
  host_pattern: string;
  roles: string[];
}

interface ApplicationManagerProps {
  applications: Record<string, Application>;
  onApplicationsChange: (applications: Record<string, Application>) => void;
  onRefresh: () => void;
}

const ApplicationManager: React.FC<ApplicationManagerProps> = ({
  applications,
  onApplicationsChange,
  onRefresh
}) => {
  const [trustDomains, setTrustDomains] = useState<TrustDomain[]>([]);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showApplyDialog, setShowApplyDialog] = useState(false);
  const [currentApp, setCurrentApp] = useState<string>('');
  const [applyInProgress, setApplyInProgress] = useState(false);
  const [applyResults, setApplyResults] = useState<any>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    selectedRealms: [] as string[]
  });

  const { toast } = useToast();

  useEffect(() => {
    fetchTrustDomains();
  }, []);

  const fetchTrustDomains = async () => {
    try {
      const response = await fetch('/api/trusts');
      const data = await response.json();
      setTrustDomains(data);
    } catch (error) {
      console.error('Failed to fetch trust domains:', error);
      toast({
        title: "Error",
        description: "Failed to fetch trust domains",
        variant: "destructive"
      });
    }
  };

  const handleCreateApplication = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || formData.selectedRealms.length === 0) {
      toast({
        title: "Validation Error",
        description: "Application name and at least one realm are required",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await fetch('/api/applications', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          realms: formData.selectedRealms
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Success",
          description: "Application created successfully"
        });
        
        setShowCreateDialog(false);
        setFormData({ name: '', description: '', selectedRealms: [] });
        onRefresh();
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to create application');
      }
    } catch (error) {
      console.error('Failed to create application:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create application",
        variant: "destructive"
      });
    }
  };

  const handleApplyApplication = async (appName: string) => {
    setCurrentApp(appName);
    setApplyInProgress(true);
    setApplyResults(null);
    
    try {
      const response = await fetch(`/api/applications/${appName}/apply`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          application_name: appName,
          create_ad_groups: false
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setApplyResults(result.results);
        
        toast({
          title: "Success", 
          description: "Application configuration applied successfully"
        });
        
        onRefresh();
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to apply configuration');
      }
    } catch (error) {
      console.error('Failed to apply application:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to apply configuration",
        variant: "destructive"
      });
    } finally {
      setApplyInProgress(false);
    }
  };

  const handleDeleteApplication = async (appName: string) => {
    if (!confirm(`Are you sure you want to delete the application "${appName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/applications/${appName}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Application deleted successfully"
        });
        onRefresh();
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete application');
      }
    } catch (error) {
      console.error('Failed to delete application:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete application",
        variant: "destructive"
      });
    }
  };

  const handleRealmToggle = (realmName: string) => {
    setFormData(prev => ({
      ...prev,
      selectedRealms: prev.selectedRealms.includes(realmName)
        ? prev.selectedRealms.filter(r => r !== realmName)
        : [...prev.selectedRealms, realmName]
    }));
  };

  const getApplicationStatusColor = (app: Application) => {
    if (!app.last_applied) return 'secondary';
    
    const lastApplied = new Date(app.last_applied);
    const updated = new Date(app.updated_at);
    
    return lastApplied >= updated ? 'default' : 'destructive';
  };

  const getApplyResultsSummary = (results: any) => {
    if (!results) return null;
    
    const categories = ['hostgroups', 'external_groups', 'posix_groups', 'hbac_rules', 'sudo_rules'];
    const summary = categories.map(category => {
      const items = results[category] || {};
      const successful = Object.values(items).filter((item: any) => item.success).length;
      const total = Object.keys(items).length;
      return { category, successful, total };
    });

    return summary;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Application Management</h2>
          <p className="text-muted-foreground">
            Create and manage IdM application configurations
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Application
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Application</DialogTitle>
              <DialogDescription>
                Define a new application with its associated AD realms and environments
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleCreateApplication} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="app-name">Application Name</Label>
                  <Input
                    id="app-name"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., myapp, webservice, database"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="app-description">Description</Label>
                  <Textarea
                    id="app-description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Brief description of the application..."
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label>Select AD Realms</Label>
                  <div className="mt-2 space-y-2">
                    {trustDomains.length === 0 ? (
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          No trust domains found. Ensure AD trusts are configured in IdM.
                        </AlertDescription>
                      </Alert>
                    ) : (
                      trustDomains.map((domain) => (
                        <div key={domain.name} className="flex items-center space-x-2">
                          <Checkbox
                            id={domain.name}
                            checked={formData.selectedRealms.includes(domain.netbios_name)}
                            onCheckedChange={() => handleRealmToggle(domain.netbios_name)}
                          />
                          <Label htmlFor={domain.name} className="flex-1">
                            <div>
                              <span className="font-medium">{domain.name}</span>
                              <span className="text-sm text-muted-foreground ml-2">
                                ({domain.netbios_name})
                              </span>
                            </div>
                          </Label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button type="submit">Create Application</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Applications List */}
      {Object.keys(applications).length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No Applications</h3>
            <p className="text-muted-foreground mb-6">
              Create your first application to get started with IdM access configuration
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create First Application
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {Object.entries(applications).map(([name, app]) => (
            <Card key={name}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-3">
                      <span>{app.name}</span>
                      <Badge variant={getApplicationStatusColor(app)}>
                        {app.last_applied ? 'Applied' : 'Pending'}
                      </Badge>
                    </CardTitle>
                    <CardDescription>
                      {app.description || 'No description provided'}
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleApplyApplication(name)}
                      disabled={applyInProgress}
                    >
                      {applyInProgress && currentApp === name ? (
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Play className="h-4 w-4 mr-2" />
                      )}
                      Apply
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteApplication(name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent>
                <div className="space-y-4">
                  {/* Application Info */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Realms:</strong> {app.realms.join(', ')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Server className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Environments:</strong> {app.environments.length}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        <strong>Created:</strong> {new Date(app.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  {/* Environments */}
                  <div>
                    <h4 className="font-medium mb-2">Environments & Roles</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {app.environments.map((env) => (
                        <div key={env.name} className="border rounded-lg p-3">
                          <div className="font-medium text-sm mb-1">{env.name}</div>
                          <div className="text-xs text-muted-foreground mb-2">
                            Pattern: {env.host_pattern}
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {env.roles.map((role) => (
                              <Badge key={role} variant="secondary" className="text-xs">
                                {role}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Apply Results */}
                  {app.last_apply_results && (
                    <div>
                      <h4 className="font-medium mb-2">Last Apply Results</h4>
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {getApplyResultsSummary(app.last_apply_results)?.map((item) => (
                          <div key={item.category} className="text-center p-2 border rounded">
                            <div className="text-xs text-muted-foreground mb-1">
                              {item.category.replace('_', ' ').toUpperCase()}
                            </div>
                            <div className="text-sm font-medium">
                              {item.successful}/{item.total}
                            </div>
                            {item.successful === item.total ? (
                              <CheckCircle className="h-3 w-3 text-green-500 mx-auto mt-1" />
                            ) : (
                              <AlertCircle className="h-3 w-3 text-red-500 mx-auto mt-1" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Last Applied */}
                  {app.last_applied && (
                    <div className="text-xs text-muted-foreground">
                      Last applied: {new Date(app.last_applied).toLocaleString()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ApplicationManager;

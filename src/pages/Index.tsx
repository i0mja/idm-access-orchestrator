
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Server, 
  Shield, 
  Users, 
  Settings, 
  Plus, 
  RefreshCw, 
  Download,
  TestTube,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import ApplicationManager from '@/components/ApplicationManager';
import TestAccess from '@/components/TestAccess';
import SystemStatus from '@/components/SystemStatus';
import TrustDomains from '@/components/TrustDomains';
import { useToast } from '@/hooks/use-toast';

interface SystemStatus {
  idm_connected: boolean;
  applications_count: number;
  enrolled_hosts_count: number;
  trust_domains_count: number;
  config_path: string;
  last_updated?: string;
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

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [applications, setApplications] = useState<Record<string, Application>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch('/api/status');
      const data = await response.json();
      setSystemStatus(data);
    } catch (error) {
      console.error('Failed to fetch system status:', error);
      toast({
        title: "Error",
        description: "Failed to fetch system status",
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
      toast({
        title: "Error", 
        description: "Failed to fetch applications",
        variant: "destructive"
      });
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchSystemStatus(), fetchApplications()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const exportConfiguration = async () => {
    try {
      const response = await fetch('/api/export');
      const data = await response.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { 
        type: 'application/json' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `idm_acf_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Configuration exported successfully"
      });
    } catch (error) {
      console.error('Failed to export configuration:', error);
      toast({
        title: "Error",
        description: "Failed to export configuration",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (connected: boolean) => {
    return connected ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <AlertCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getApplicationStatusColor = (app: Application) => {
    if (!app.last_applied) return 'secondary';
    
    const lastApplied = new Date(app.last_applied);
    const updated = new Date(app.updated_at);
    
    return lastApplied >= updated ? 'default' : 'destructive';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Loading IdM Access Configurator...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 mb-2">
                IdM Access Configurator (ACF)
              </h1>
              <p className="text-slate-600 text-lg">
                Enterprise-grade Red Hat IdM and Active Directory integration platform
              </p>
            </div>
            <div className="flex items-center space-x-3">
              <Button onClick={refreshData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button onClick={exportConfiguration} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
          </div>
        </div>

        {/* System Status Alert */}
        {systemStatus && (
          <Alert className={`mb-6 ${systemStatus.idm_connected ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
            <div className="flex items-center">
              {getStatusIcon(systemStatus.idm_connected)}
              <AlertDescription className="ml-2">
                IdM Connection: {systemStatus.idm_connected ? 'Connected' : 'Disconnected'} |
                Applications: {systemStatus.applications_count} |
                Enrolled Hosts: {systemStatus.enrolled_hosts_count} |
                Trust Domains: {systemStatus.trust_domains_count}
              </AlertDescription>
            </div>
          </Alert>
        )}

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <Server className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="applications" className="flex items-center space-x-2">
              <Shield className="h-4 w-4" />
              <span>Applications</span>
            </TabsTrigger>
            <TabsTrigger value="domains" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Domains</span>
            </TabsTrigger>
            <TabsTrigger value="testing" className="flex items-center space-x-2">
              <TestTube className="h-4 w-4" />
              <span>Testing</span>
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>System</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Applications</CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStatus?.applications_count || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Configured applications
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Enrolled Hosts</CardTitle>
                  <Server className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStatus?.enrolled_hosts_count || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    IdM enrolled systems
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Trust Domains</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{systemStatus?.trust_domains_count || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Active Directory trusts
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">IdM Status</CardTitle>
                  {systemStatus && getStatusIcon(systemStatus.idm_connected)}
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {systemStatus?.idm_connected ? 'Online' : 'Offline'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Connection status
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Applications Overview */}
            <Card>
              <CardHeader>
                <CardTitle>Application Overview</CardTitle>
                <CardDescription>
                  Current applications and their configuration status
                </CardDescription>
              </CardHeader>
              <CardContent>
                {Object.keys(applications).length === 0 ? (
                  <div className="text-center py-8">
                    <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">No Applications Configured</h3>
                    <p className="text-muted-foreground mb-4">
                      Get started by creating your first application configuration
                    </p>
                    <Button onClick={() => setActiveTab('applications')}>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Application
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(applications).map(([name, app]) => (
                      <div key={name} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <h4 className="font-medium">{app.name}</h4>
                            <Badge variant={getApplicationStatusColor(app)}>
                              {app.last_applied ? 'Applied' : 'Pending'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {app.description || 'No description'}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                            <span>Environments: {app.environments.length}</span>
                            <span>Realms: {app.realms.length}</span>
                            {app.last_applied && (
                              <span className="flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                Applied: {new Date(app.last_applied).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="applications">
            <ApplicationManager 
              applications={applications}
              onApplicationsChange={setApplications}
              onRefresh={fetchApplications}
            />
          </TabsContent>

          <TabsContent value="domains">
            <TrustDomains />
          </TabsContent>

          <TabsContent value="testing">
            <TestAccess />
          </TabsContent>

          <TabsContent value="system">
            <SystemStatus systemStatus={systemStatus} onRefresh={fetchSystemStatus} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;

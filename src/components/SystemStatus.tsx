
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  Server,
  Shield,
  Users,
  Settings,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  Database,
  Network,
  HardDrive
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SystemStatus {
  idm_connected: boolean;
  applications_count: number;
  enrolled_hosts_count: number;
  trust_domains_count: number;
  config_path: string;
  last_updated?: string;
}

interface SystemStatusProps {
  systemStatus: SystemStatus | null;
  onRefresh: () => void;
}

const SystemStatus: React.FC<SystemStatusProps> = ({
  systemStatus,
  onRefresh
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
      toast({
        title: "Success",
        description: "System status refreshed successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh system status",
        variant: "destructive"
      });
    } finally {
      setRefreshing(false);
    }
  };

  const getStatusColor = (connected: boolean) => {
    return connected ? 'text-green-500' : 'text-red-500';
  };

  const getStatusIcon = (connected: boolean) => {
    return connected ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <AlertCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getHealthScore = () => {
    if (!systemStatus) return 0;
    
    let score = 0;
    const maxScore = 4;
    
    if (systemStatus.idm_connected) score += 1;
    if (systemStatus.applications_count > 0) score += 1;
    if (systemStatus.enrolled_hosts_count > 0) score += 1;
    if (systemStatus.trust_domains_count > 0) score += 1;
    
    return Math.round((score / maxScore) * 100);
  };

  const getHealthStatus = (score: number) => {
    if (score >= 75) return { text: 'Excellent', color: 'text-green-600' };
    if (score >= 50) return { text: 'Good', color: 'text-yellow-600' };
    if (score >= 25) return { text: 'Fair', color: 'text-orange-600' };
    return { text: 'Poor', color: 'text-red-600' };
  };

  if (!systemStatus) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Loading system status...</p>
        </div>
      </div>
    );
  }

  const healthScore = getHealthScore();
  const healthStatus = getHealthStatus(healthScore);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">System Status</h2>
          <p className="text-muted-foreground">
            Monitor IdM Access Configurator health and connectivity
          </p>
        </div>
        <Button onClick={handleRefresh} variant="outline" disabled={refreshing}>
          <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Health Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Shield className="h-5 w-5" />
            <span>System Health</span>
          </CardTitle>
          <CardDescription>
            Overall system health and connectivity status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">
                  <span className={healthStatus.color}>{healthScore}%</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  System Health Score
                </div>
              </div>
              <Badge variant={healthScore >= 75 ? "default" : healthScore >= 50 ? "secondary" : "destructive"}>
                {healthStatus.text}
              </Badge>
            </div>
            <Progress value={healthScore} className="w-full" />
            <div className="text-xs text-muted-foreground">
              Based on IdM connectivity, configured applications, enrolled hosts, and trust domains
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Status */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* IdM Connectivity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>IdM Connectivity</span>
              </div>
              {getStatusIcon(systemStatus.idm_connected)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Connection Status</span>
                <Badge variant={systemStatus.idm_connected ? "default" : "destructive"}>
                  {systemStatus.idm_connected ? 'Connected' : 'Disconnected'}
                </Badge>
              </div>
              
              {systemStatus.idm_connected ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Successfully connected to IdM server. All IPA commands are available.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-red-200 bg-red-50">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Cannot connect to IdM server. Check Kerberos authentication and network connectivity.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Configuration Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Configuration</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Config File</span>
                <Badge variant="outline">
                  {systemStatus.config_path}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Last Updated</span>
                <span className="text-sm font-mono">
                  {systemStatus.last_updated 
                    ? new Date(systemStatus.last_updated).toLocaleString()
                    : 'Never'
                  }
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Applications</span>
                <Badge variant="secondary">
                  {systemStatus.applications_count}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Infrastructure Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5" />
              <span>Infrastructure</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Enrolled Hosts</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {systemStatus.enrolled_hosts_count}
                  </Badge>
                  {systemStatus.enrolled_hosts_count > 0 && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Trust Domains</span>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline">
                    {systemStatus.trust_domains_count}
                  </Badge>
                  {systemStatus.trust_domains_count > 0 && (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>

              <div className="text-xs text-muted-foreground">
                {systemStatus.enrolled_hosts_count === 0 && (
                  <div className="flex items-center space-x-1 text-orange-600">
                    <AlertCircle className="h-3 w-3" />
                    <span>No enrolled hosts found</span>
                  </div>
                )}
                {systemStatus.trust_domains_count === 0 && (
                  <div className="flex items-center space-x-1 text-orange-600">
                    <AlertCircle className="h-3 w-3" />
                    <span>No AD trusts configured</span>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Network Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Network className="h-5 w-5" />
              <span>Network & Services</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">API Server</span>
                <Badge variant="default">
                  Running
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">LDAP Connectivity</span>
                <Badge variant={systemStatus.idm_connected ? "default" : "destructive"}>
                  {systemStatus.idm_connected ? 'Available' : 'Unavailable'}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Kerberos Auth</span>
                <Badge variant={systemStatus.idm_connected ? "default" : "destructive"}>
                  {systemStatus.idm_connected ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Requirements */}
      <Card>
        <CardHeader>
          <CardTitle>System Requirements & Recommendations</CardTitle>
          <CardDescription>
            Ensure optimal performance and functionality
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <h4 className="font-medium mb-2">Prerequisites</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Red Hat IdM/FreeIPA server installed</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Active Kerberos ticket (kinit admin)</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Network connectivity to AD domains</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span>Appropriate sudo privileges</span>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-2">Recommendations</h4>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Run on IdM master or replica server</li>
                <li>• Use dedicated service account</li> 
                <li>• Enable audit logging for compliance</li>
                <li>• Regular backup of configuration files</li>
                <li>• Monitor trust relationships health</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemStatus;

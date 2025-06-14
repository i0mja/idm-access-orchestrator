
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Server, 
  Shield, 
  Users, 
  ArrowRight,
  ArrowLeft,
  Wifi,
  Key,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

interface IdMConnection {
  server: string;
  realm: string;
  username: string;
  password: string;
  ca_cert?: string;
}

interface TrustedRealm {
  domain: string;
  netbios_name: string;
  admin_username: string;
  admin_password: string;
}

interface SetupWizardProps {
  onComplete: () => void;
}

const SetupWizard: React.FC<SetupWizardProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [idmConnection, setIdmConnection] = useState<IdMConnection>({
    server: '',
    realm: '',
    username: 'admin',
    password: ''
  });
  const [trustedRealms, setTrustedRealms] = useState<TrustedRealm[]>([]);
  const [newRealm, setNewRealm] = useState<TrustedRealm>({
    domain: '',
    netbios_name: '',
    admin_username: 'Administrator',
    admin_password: ''
  });
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [completing, setCompleting] = useState(false);
  const { toast } = useToast();

  const steps: SetupStep[] = [
    {
      id: 'welcome',
      title: 'Welcome to IdM ACF',
      description: 'Set up your Red Hat Identity Management integration',
      icon: Shield
    },
    {
      id: 'idm-connection',
      title: 'IdM Server Connection',
      description: 'Configure connection to your Red Hat IdM server',
      icon: Server
    },
    {
      id: 'connectivity-test',
      title: 'Connectivity Test',
      description: 'Verify connection to IdM server',
      icon: Wifi
    },
    {
      id: 'trusted-realms',
      title: 'Trusted AD Realms',
      description: 'Configure Active Directory trust relationships',
      icon: Users
    },
    {
      id: 'final-setup',
      title: 'Complete Setup',
      description: 'Finalize configuration and initialize the system',
      icon: Settings
    }
  ];

  const testIdmConnection = async () => {
    setTesting(true);
    setTestResults(null);
    
    try {
      const response = await fetch('/api/setup/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(idmConnection)
      });
      
      const results = await response.json();
      setTestResults(results);
      
      if (results.success) {
        toast({
          title: "Success",
          description: "IdM connection test successful"
        });
      } else {
        toast({
          title: "Connection Failed",
          description: results.error || "Failed to connect to IdM server",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      setTestResults({
        success: false,
        error: 'Network error during connection test'
      });
      toast({
        title: "Error",
        description: "Network error during connection test",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const addTrustedRealm = () => {
    if (!newRealm.domain || !newRealm.netbios_name) {
      toast({
        title: "Validation Error",
        description: "Domain and NetBIOS name are required",
        variant: "destructive"
      });
      return;
    }

    setTrustedRealms([...trustedRealms, { ...newRealm }]);
    setNewRealm({
      domain: '',
      netbios_name: '',
      admin_username: 'Administrator',
      admin_password: ''
    });
  };

  const removeTrustedRealm = (index: number) => {
    setTrustedRealms(trustedRealms.filter((_, i) => i !== index));
  };

  const completeSetup = async () => {
    setCompleting(true);
    
    try {
      const setupData = {
        idm_connection: idmConnection,
        trusted_realms: trustedRealms
      };
      
      const response = await fetch('/api/setup/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(setupData)
      });
      
      if (response.ok) {
        toast({
          title: "Setup Complete",
          description: "IdM ACF has been successfully configured"
        });
        onComplete();
      } else {
        const error = await response.json();
        toast({
          title: "Setup Failed",
          description: error.detail || "Failed to complete setup",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Setup completion failed:', error);
      toast({
        title: "Error",
        description: "Network error during setup completion",
        variant: "destructive"
      });
    } finally {
      setCompleting(false);
    }
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const canProceed = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return true;
      case 'idm-connection':
        return idmConnection.server && idmConnection.realm && idmConnection.username && idmConnection.password;
      case 'connectivity-test':
        return testResults?.success;
      case 'trusted-realms':
        return true; // Optional step
      case 'final-setup':
        return true;
      default:
        return false;
    }
  };

  const renderStepContent = () => {
    switch (steps[currentStep].id) {
      case 'welcome':
        return (
          <div className="text-center space-y-6">
            <div className="mx-auto w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
              <Shield className="h-12 w-12 text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-bold mb-2">Welcome to IdM Access Configurator</h3>
              <p className="text-muted-foreground">
                This wizard will guide you through setting up your Red Hat Identity Management 
                integration and Active Directory trust relationships.
              </p>
            </div>
            <Alert>
              <Key className="h-4 w-4" />
              <AlertDescription>
                Make sure you have administrative credentials for both your IdM server and 
                any Active Directory domains you want to trust.
              </AlertDescription>
            </Alert>
          </div>
        );

      case 'idm-connection':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">IdM Server Configuration</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="server">IdM Server</Label>
                  <Input
                    id="server"
                    placeholder="idm.example.com"
                    value={idmConnection.server}
                    onChange={(e) => setIdmConnection({...idmConnection, server: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="realm">Realm</Label>
                  <Input
                    id="realm"
                    placeholder="EXAMPLE.COM"
                    value={idmConnection.realm}
                    onChange={(e) => setIdmConnection({...idmConnection, realm: e.target.value.toUpperCase()})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Admin Username</Label>
                  <Input
                    id="username"
                    value={idmConnection.username}
                    onChange={(e) => setIdmConnection({...idmConnection, username: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Admin Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={idmConnection.password}
                    onChange={(e) => setIdmConnection({...idmConnection, password: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2 mt-4">
                <Label htmlFor="ca_cert">CA Certificate (Optional)</Label>
                <Textarea
                  id="ca_cert"
                  placeholder="-----BEGIN CERTIFICATE-----..."
                  rows={4}
                  value={idmConnection.ca_cert || ''}
                  onChange={(e) => setIdmConnection({...idmConnection, ca_cert: e.target.value})}
                />
                <p className="text-sm text-muted-foreground">
                  Paste the CA certificate if using custom PKI
                </p>
              </div>
            </div>
          </div>
        );

      case 'connectivity-test':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-4">Test IdM Connection</h3>
              <p className="text-muted-foreground mb-4">
                Verify that we can connect to your IdM server with the provided credentials.
              </p>
              
              <div className="space-y-4">
                <div className="p-4 border rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Server:</span> {idmConnection.server}
                    </div>
                    <div>
                      <span className="font-medium">Realm:</span> {idmConnection.realm}
                    </div>
                    <div>
                      <span className="font-medium">Username:</span> {idmConnection.username}
                    </div>
                    <div>
                      <span className="font-medium">SSL:</span> {idmConnection.ca_cert ? 'Custom CA' : 'Default'}
                    </div>
                  </div>
                </div>

                <Button 
                  onClick={testIdmConnection} 
                  disabled={testing}
                  className="w-full"
                >
                  {testing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Testing Connection...
                    </>
                  ) : (
                    <>
                      <Wifi className="h-4 w-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>

                {testResults && (
                  <Alert className={testResults.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                    {testResults.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-600" />
                    )}
                    <AlertDescription>
                      {testResults.success ? (
                        <div>
                          <div className="font-medium text-green-800">Connection Successful!</div>
                          <div className="text-green-700">
                            Successfully authenticated to IdM server
                          </div>
                          {testResults.server_info && (
                            <div className="mt-2 text-sm">
                              <div>Version: {testResults.server_info.version}</div>
                              <div>Enrolled Hosts: {testResults.server_info.hosts_count}</div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium text-red-800">Connection Failed</div>
                          <div className="text-red-700">{testResults.error}</div>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </div>
          </div>
        );

      case 'trusted-realms':
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-semibold mb-2">Configure Trusted AD Realms</h3>
              <p className="text-muted-foreground mb-4">
                Add Active Directory domains that you want to establish trust relationships with.
                This step is optional and can be configured later.
              </p>
              
              {/* Add New Realm Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Add Trusted Realm</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="domain">AD Domain</Label>
                      <Input
                        id="domain"
                        placeholder="ad.example.com"
                        value={newRealm.domain}
                        onChange={(e) => setNewRealm({...newRealm, domain: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="netbios">NetBIOS Name</Label>
                      <Input
                        id="netbios"
                        placeholder="ADEXAMPLE"
                        value={newRealm.netbios_name}
                        onChange={(e) => setNewRealm({...newRealm, netbios_name: e.target.value.toUpperCase()})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ad_username">AD Admin Username</Label>
                      <Input
                        id="ad_username"
                        value={newRealm.admin_username}
                        onChange={(e) => setNewRealm({...newRealm, admin_username: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="ad_password">AD Admin Password</Label>
                      <Input
                        id="ad_password"
                        type="password"
                        value={newRealm.admin_password}
                        onChange={(e) => setNewRealm({...newRealm, admin_password: e.target.value})}
                      />
                    </div>
                  </div>
                  <Button onClick={addTrustedRealm} className="w-full">
                    <Users className="h-4 w-4 mr-2" />
                    Add Trusted Realm
                  </Button>
                </CardContent>
              </Card>

              {/* Current Trusted Realms */}
              {trustedRealms.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Configured Trusted Realms</h4>
                  <div className="space-y-3">
                    {trustedRealms.map((realm, index) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3">
                            <Badge variant="default">{realm.netbios_name}</Badge>
                            <span className="font-medium">{realm.domain}</span>
                          </div>
                          <div className="text-sm text-muted-foreground mt-1">
                            Admin: {realm.admin_username}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => removeTrustedRealm(index)}
                        >
                          Remove
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 'final-setup':
        return (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-xl font-semibold mb-4">Complete Setup</h3>
              <p className="text-muted-foreground mb-6">
                Review your configuration and complete the IdM ACF setup.
              </p>
            </div>

            {/* Configuration Summary */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Server className="h-5 w-5" />
                    <span>IdM Server</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div><span className="font-medium">Server:</span> {idmConnection.server}</div>
                    <div><span className="font-medium">Realm:</span> {idmConnection.realm}</div>
                    <div><span className="font-medium">Username:</span> {idmConnection.username}</div>
                    <div><span className="font-medium">SSL:</span> {idmConnection.ca_cert ? 'Custom CA' : 'Default'}</div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Trusted AD Realms</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {trustedRealms.length > 0 ? (
                    <div className="space-y-2">
                      {trustedRealms.map((realm, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <Badge variant="outline">{realm.netbios_name}</Badge>
                          <span className="text-sm">{realm.domain}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No trusted realms configured</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <Alert>
              <Settings className="h-4 w-4" />
              <AlertDescription>
                The setup will create the initial configuration file and test the IdM connection.
                You can modify these settings later in the system configuration.
              </AlertDescription>
            </Alert>

            <Button 
              onClick={completeSetup} 
              disabled={completing}
              className="w-full"
              size="lg"
            >
              {completing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Completing Setup...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Complete Setup
                </>
              )}
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <Card className="shadow-lg">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">IdM Access Configurator Setup</CardTitle>
            <CardDescription>
              Step {currentStep + 1} of {steps.length}: {steps[currentStep].title}
            </CardDescription>
            <Progress value={((currentStep + 1) / steps.length) * 100} className="mt-4" />
          </CardHeader>
          
          <CardContent className="space-y-6">
            {/* Step Indicator */}
            <div className="flex justify-center space-x-4 mb-8">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = index === currentStep;
                const isCompleted = index < currentStep;
                
                return (
                  <div
                    key={step.id}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${
                      isActive ? 'bg-primary text-primary-foreground' :
                      isCompleted ? 'bg-green-100 text-green-700' :
                      'bg-muted text-muted-foreground'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium hidden md:block">{step.title}</span>
                  </div>
                );
              })}
            </div>

            {/* Step Content */}
            <div className="min-h-[400px]">
              {renderStepContent()}
            </div>

            {/* Navigation */}
            <div className="flex justify-between pt-6 border-t">
              <Button
                variant="outline"
                onClick={prevStep}
                disabled={currentStep === 0}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              
              {currentStep < steps.length - 1 ? (
                <Button
                  onClick={nextStep}
                  disabled={!canProceed()}
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SetupWizard;

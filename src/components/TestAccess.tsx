
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TestTube,
  CheckCircle,
  XCircle,
  RefreshCw,
  Terminal,
  User,
  Server,
  Shield
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TestResult {
  hbac_test: any;
  sudo_test: any;
  user: string;
  host: string;
  command: string;
}

const TestAccess: React.FC = () => {
  const [testForm, setTestForm] = useState({
    user: '',
    domain: '',
    target_host: '',
    command: 'sudo -l'
  });
  const [testing, setTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult | null>(null);
  const { toast } = useToast();

  const handleTest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!testForm.user || !testForm.domain || !testForm.target_host) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setTesting(true);
    setTestResults(null);

    try {
      const response = await fetch('/api/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testForm),
      });

      if (response.ok) {
        const results = await response.json();
        setTestResults(results);
      } else {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to run access test');
      }
    } catch (error) {
      console.error('Failed to test access:', error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to test access",
        variant: "destructive"
      });
    } finally {
      setTesting(false);
    }
  };

  const getTestResultIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-5 w-5 text-green-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    );
  };

  const getTestResultBadge = (success: boolean) => {
    return (
      <Badge variant={success ? "default" : "destructive"}>
        {success ? "PASS" : "FAIL"}
      </Badge>
    );
  };

  const formatHBACResult = (result: any) => {
    if (!result) return "No result";
    
    if (result.success) {
      return result.output || "Access allowed";
    } else {
      return result.error || "Access denied";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Access Testing</h2>
        <p className="text-muted-foreground">
          Test user access permissions for specific hosts and commands
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Test Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TestTube className="h-5 w-5" />
              <span>Run Access Test</span>
            </CardTitle>
            <CardDescription>
              Test HBAC and sudo access for a specific user and host combination
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleTest} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="user">Username</Label>
                  <Input
                    id="user"
                    value={testForm.user}
                    onChange={(e) => setTestForm(prev => ({ ...prev, user: e.target.value }))}
                    placeholder="john.doe"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    value={testForm.domain}
                    onChange={(e) => setTestForm(prev => ({ ...prev, domain: e.target.value }))}
                    placeholder="DOMAIN.COM"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="target_host">Target Host</Label>
                <Input
                  id="target_host"
                  value={testForm.target_host}
                  onChange={(e) => setTestForm(prev => ({ ...prev, target_host: e.target.value }))}
                  placeholder="server.domain.com"
                  required
                />
              </div>

              <div>
                <Label htmlFor="command">Command to Test</Label>
                <Input
                  id="command"
                  value={testForm.command}
                  onChange={(e) => setTestForm(prev => ({ ...prev, command: e.target.value }))}
                  placeholder="sudo -l"
                />
              </div>

              <Button type="submit" disabled={testing} className="w-full">
                {testing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Testing Access...
                  </>
                ) : (
                  <>
                    <TestTube className="h-4 w-4 mr-2" />
                    Run Test
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Test Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Terminal className="h-5 w-5" />
              <span>Test Results</span>
            </CardTitle>
            <CardDescription>
              Results of the most recent access test
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!testResults ? (
              <div className="text-center py-8 text-muted-foreground">
                <TestTube className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Run a test to see results here</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Test Summary */}
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium">Test Summary</h4>
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{testResults.user}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Host:</span>
                      <div className="font-mono">{testResults.host}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Command:</span>
                      <div className="font-mono">{testResults.command}</div>
                    </div>
                  </div>
                </div>

                {/* HBAC Test Results */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center space-x-2">
                      <Shield className="h-4 w-4" />
                      <span>HBAC Test</span>
                    </h4>
                    {getTestResultBadge(testResults.hbac_test?.success || false)}
                  </div>
                  
                  <Alert className={testResults.hbac_test?.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                    <div className="flex items-start space-x-2">
                      {getTestResultIcon(testResults.hbac_test?.success || false)}
                      <AlertDescription className="flex-1">
                        <div className="font-medium mb-1">
                          {testResults.hbac_test?.success ? 'Access Allowed' : 'Access Denied'}
                        </div>
                        <div className="text-sm font-mono bg-white/50 p-2 rounded">
                          {formatHBACResult(testResults.hbac_test)}
                        </div>
                      </AlertDescription>
                    </div>
                  </Alert>
                </div>

                {/* Sudo Test Results */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center space-x-2">
                      <Terminal className="h-4 w-4" />
                      <span>Sudo Test</span>
                    </h4>
                    {getTestResultBadge(testResults.sudo_test?.success || false)}
                  </div>
                  
                  <Alert className={testResults.sudo_test?.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}>
                    <div className="flex items-start space-x-2">
                      {getTestResultIcon(testResults.sudo_test?.success || false)}
                      <AlertDescription className="flex-1">
                        <div className="font-medium mb-1">
                          {testResults.sudo_test?.success ? 'Test Available' : 'Test Unavailable'}
                        </div>
                        <div className="text-sm">
                          {testResults.sudo_test?.message || 'Sudo test would require SSH connection to target host'}
                        </div>
                      </AlertDescription>
                    </div>
                  </Alert>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Test Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle>Testing Guidelines</CardTitle>
          <CardDescription>
            Important information about access testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-medium mb-2">HBAC Testing</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Tests Host-Based Access Control rules in IdM</li>
                <li>• Verifies if user can access the specified host via SSH</li>
                <li>• Uses IdM's built-in hbactest command</li>
                <li>• Results are immediate and accurate</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2">Sudo Testing</h4>
              <ul className="text-sm text-muted-foreground space-y-1 ml-4">
                <li>• Would test actual sudo permissions on target host</li>
                <li>• Requires SSH connectivity to target system</li>
                <li>• In production, would execute: ssh user@host "sudo -l"</li>
                <li>• Currently simulated for security reasons</li>
              </ul>
            </div>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Note:</strong> Sudo testing requires SSH access to target hosts. 
                In production environments, ensure proper SSH key distribution and 
                network connectivity between the IdM server and target systems.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TestAccess;

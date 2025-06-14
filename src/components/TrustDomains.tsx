
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Users,
  Shield,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Globe
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TrustDomain {
  name: string;
  netbios_name: string;
  realm: string;
  type: string;
}

const TrustDomains: React.FC = () => {
  const [trustDomains, setTrustDomains] = useState<TrustDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchTrustDomains = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrustDomains();
  }, []);

  const getTrustTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'ad':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getTrustTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'ad':
        return <Users className="h-4 w-4" />;
      default:
        return <Globe className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex flex-col items-center space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-lg font-medium">Loading trust domains...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Trust Domains</h2>
          <p className="text-muted-foreground">
            Active Directory domains trusted by this IdM realm
          </p>
        </div>
        <Button onClick={fetchTrustDomains} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Trust Domains */}
      {trustDomains.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Shield className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">No Trust Domains Found</h3>
            <p className="text-muted-foreground mb-6">
              No Active Directory trusts are currently configured in this IdM realm.
            </p>
            <Alert className="max-w-md mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Use the IdM CLI to establish AD trusts:
                <br />
                <code className="bg-muted px-1 rounded text-xs mt-1 block">
                  ipa trust-add --admin Administrator --password DOMAIN.COM
                </code>
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>Trust Summary</span>
              </CardTitle>
              <CardDescription>
                Overview of configured trust relationships
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-primary">
                    {trustDomains.length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total Trusts
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {trustDomains.filter(d => d.type === 'ad').length}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    AD Domains
                  </div>
                </div>
                <div className="text-center p-4 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {new Set(trustDomains.map(d => d.realm.split('.')[1])).size}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Unique Forests
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Trust Domains List */}
          <div className="grid gap-4">
            {trustDomains.map((domain) => (
              <Card key={domain.name}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center space-x-3">
                      {getTrustTypeIcon(domain.type)}
                      <span>{domain.name}</span>
                      <Badge variant={getTrustTypeColor(domain.type)}>
                        {domain.type.toUpperCase()}
                      </Badge>
                    </CardTitle>
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Domain Name
                      </label>
                      <div className="font-mono text-sm mt-1">
                        {domain.name}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        NetBIOS Name
                      </label>
                      <div className="font-mono text-sm mt-1">
                        {domain.netbios_name}
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Realm
                      </label>
                      <div className="font-mono text-sm mt-1">
                        {domain.realm}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 p-3 bg-muted rounded-lg">
                    <div className="text-sm font-medium mb-2">
                      External Group Configuration
                    </div>
                    <div className="text-xs text-muted-foreground font-mono">
                      External groups will use SID format: {domain.netbios_name}\groupname
                    </div>
                    <div className="text-xs text-muted-foreground font-mono mt-1">
                      Example: ipa group-add-member external-group --external "{domain.netbios_name}\IdM_myapp_dev_full"
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TrustDomains;

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { 
  Settings, 
  Users, 
  UserCheck, 
  Bell, 
  Shield, 
  Palette, 
  FileText,
  Save,
  RotateCcw
} from 'lucide-react';

interface SystemSetting {
  value: string;
  type: 'string' | 'number' | 'boolean';
  description: string;
  updatedAt: string;
}

interface SettingsGroup {
  [key: string]: SystemSetting;
}

interface AllSettings {
  [key: string]: SettingsGroup;
}

export const SystemSettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<AllSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [authError, setAuthError] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [credentials, setCredentials] = useState({ email: 'admin@school.com', password: 'admin123' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleLogin = async () => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('auth_token', data.token); // Fixed: Use correct token key
        toast.success("Login successful! Reloading settings...");
        setAuthError(false);
        setShowLoginForm(false);
        fetchSettings();
      } else {
        const error = await response.text();
        toast.error(`Login failed: ${error}`);
      }
    } catch (error) {
      console.error('Login error:', error);
      toast.error("Login failed: Network error");
    }
  };

  const fetchSettings = async () => {
    try {
      console.log('🚀 SystemSettingsPage: Starting fetchSettings...');
      
      const token = localStorage.getItem('auth_token'); // Fixed: Use correct token key
      console.log('🔍 Token check:', {
        exists: !!token,
        length: token?.length || 0,
        preview: token ? token.substring(0, 30) + '...' : 'none'
      });
      
      if (!token) {
        setAuthError(true);
        console.error('❌ No token found in localStorage');
        toast.error("Authentication required. Please log in as an administrator.");
        setLoading(false);
        return;
      }

      // Validate token format and content
      let payload;
      try {
        payload = JSON.parse(atob(token.split('.')[1]));
        const expiry = new Date(payload.exp * 1000);
        const now = new Date();
        const isExpired = expiry <= now;
        const isAdmin = payload.role === 'admin';
        
        console.log('🔍 Token validation:', { 
          userId: payload.userId, 
          email: payload.email, 
          role: payload.role,
          isAdmin,
          expires: expiry.toLocaleString(),
          current: now.toLocaleString(),
          isExpired,
          tokenValid: !isExpired && isAdmin
        });
        
        if (!isAdmin) {
          setAuthError(true);
          console.error('❌ User role is not admin:', payload.role);
          toast.error("Administrator role required for system settings.");
          setLoading(false);
          return;
        }
        
        if (isExpired) {
          setAuthError(true);
          console.error('❌ Token has expired at:', expiry.toLocaleString());
          toast.error("Session expired. Please log in again.");
          setLoading(false);
          return;
        }
      } catch (e) {
        setAuthError(true);
        console.error('❌ Invalid token format:', e);
        toast.error("Invalid authentication token. Please log in again.");
        setLoading(false);
        return;
      }

      console.log('🔑 Making API request to /api/settings...');
      console.log('📤 Request headers:', {
        Authorization: `Bearer ${token.substring(0, 20)}...`,
        'Content-Type': 'application/json'
      });
      
      const response = await fetch('/api/settings', {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('📡 Settings API response:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });
      
      if (response.ok) {
        const data = await response.json();
        const categories = Object.keys(data);
        const totalSettings = Object.values(data).reduce((acc: number, cat: any) => acc + Object.keys(cat).length, 0);
        
        console.log('✅ Settings loaded successfully:', {
          categories,
          totalSettings,
          sampleData: categories.length > 0 ? Object.keys(data[categories[0]]).slice(0, 3) : []
        });
        
        setSettings(data);
        setAuthError(false);
        toast.success(`System settings loaded successfully! (${totalSettings} settings)`);
      } else if (response.status === 401 || response.status === 403) {
        const errorText = await response.text();
        setAuthError(true);
        console.error('❌ Authentication failed:', { 
          status: response.status, 
          statusText: response.statusText,
          error: errorText,
          tokenPayload: payload 
        });
        toast.error(`Access denied (${response.status}): Administrator privileges required.`);
      } else {
        const errorText = await response.text();
        console.error('❌ Settings API error:', { 
          status: response.status, 
          statusText: response.statusText,
          error: errorText 
        });
        toast.error(`Failed to load system settings: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('❌ Network error fetching settings:', error);
      toast.error("Failed to load system settings: Network error");
    } finally {
      console.log('🏁 fetchSettings completed, setting loading to false');
      setLoading(false);
    }
  };

  const updateSetting = (category: string, key: string, value: string | boolean | number) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category],
        [key]: {
          ...prev[category]?.[key],
          value: String(value)
        }
      }
    }));
    setHasChanges(true);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('auth_token'); // Fixed: Use correct token key
      const response = await fetch('/api/settings/bulk', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ settings })
      });
      
      if (response.ok) {
        setHasChanges(false);
        toast.success("System settings saved successfully");
        fetchSettings(); // Refresh to get updated timestamps
      } else if (response.status === 401 || response.status === 403) {
        toast.error("Authentication failed. Please log in again.");
      } else {
        const errorText = await response.text();
        console.error('Save settings error:', response.status, errorText);
        toast.error(`Failed to save system settings: ${response.status}`);
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error("Failed to save system settings: Network error");
    } finally {
      setSaving(false);
    }
  };

  const resetSettings = () => {
    fetchSettings();
    setHasChanges(false);
    toast.success("All changes have been discarded");
  };

  const renderSettingField = (category: string, key: string, setting: SystemSetting) => {
    const { value, type, description } = setting;
    
    switch (type) {
      case 'boolean':
        return (
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">{formatKey(key)}</Label>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            <Switch
              checked={value === 'true'}
              onCheckedChange={(checked) => updateSetting(category, key, checked)}
            />
          </div>
        );
      
      case 'number':
        return (
          <div className="space-y-2">
            <Label htmlFor={`${category}-${key}`} className="text-base font-medium">
              {formatKey(key)}
            </Label>
            <p className="text-sm text-muted-foreground">{description}</p>
            <Input
              id={`${category}-${key}`}
              type="number"
              value={value}
              onChange={(e) => updateSetting(category, key, e.target.value)}
              className="max-w-xs"
            />
          </div>
        );
      
      default:
        if (key.includes('password') || key.includes('secret') || key.includes('key')) {
          return (
            <div className="space-y-2">
              <Label htmlFor={`${category}-${key}`} className="text-base font-medium">
                {formatKey(key)}
              </Label>
              <p className="text-sm text-muted-foreground">{description}</p>
              <Input
                id={`${category}-${key}`}
                type="password"
                value={value}
                onChange={(e) => updateSetting(category, key, e.target.value)}
                placeholder="••••••••"
              />
            </div>
          );
        }
        
        if (key.includes('email') || key.includes('notification') || description.toLowerCase().includes('email')) {
          return (
            <div className="space-y-2">
              <Label htmlFor={`${category}-${key}`} className="text-base font-medium">
                {formatKey(key)}
              </Label>
              <p className="text-sm text-muted-foreground">{description}</p>
              <Input
                id={`${category}-${key}`}
                type="email"
                value={value}
                onChange={(e) => updateSetting(category, key, e.target.value)}
              />
            </div>
          );
        }

        if (key === 'timezone') {
          return (
            <div className="space-y-2">
              <Label className="text-base font-medium">{formatKey(key)}</Label>
              <p className="text-sm text-muted-foreground">{description}</p>
              <Select value={value} onValueChange={(val) => updateSetting(category, key, val)}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="UTC">UTC</SelectItem>
                  <SelectItem value="America/New_York">Eastern Time</SelectItem>
                  <SelectItem value="America/Chicago">Central Time</SelectItem>
                  <SelectItem value="America/Denver">Mountain Time</SelectItem>
                  <SelectItem value="America/Los_Angeles">Pacific Time</SelectItem>
                  <SelectItem value="Europe/London">London</SelectItem>
                  <SelectItem value="Europe/Paris">Paris</SelectItem>
                  <SelectItem value="Asia/Tokyo">Tokyo</SelectItem>
                  <SelectItem value="Asia/Shanghai">Shanghai</SelectItem>
                  <SelectItem value="Asia/Kolkata">India Standard Time</SelectItem>
                </SelectContent>
              </Select>
            </div>
          );
        }

        if (key === 'default_theme') {
          return (
            <div className="space-y-2">
              <Label className="text-base font-medium">{formatKey(key)}</Label>
              <p className="text-sm text-muted-foreground">{description}</p>
              <Select value={value} onValueChange={(val) => updateSetting(category, key, val)}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">Light</SelectItem>
                  <SelectItem value="dark">Dark</SelectItem>
                  <SelectItem value="auto">Auto (System)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          );
        }

        if (key === 'time_format') {
          return (
            <div className="space-y-2">
              <Label className="text-base font-medium">{formatKey(key)}</Label>
              <p className="text-sm text-muted-foreground">{description}</p>
              <Select value={value} onValueChange={(val) => updateSetting(category, key, val)}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12h">12 Hour (AM/PM)</SelectItem>
                  <SelectItem value="24h">24 Hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
          );
        }

        if (key === 'weekly_report_day') {
          return (
            <div className="space-y-2">
              <Label className="text-base font-medium">{formatKey(key)}</Label>
              <p className="text-sm text-muted-foreground">{description}</p>
              <Select value={value} onValueChange={(val) => updateSetting(category, key, val)}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monday">Monday</SelectItem>
                  <SelectItem value="tuesday">Tuesday</SelectItem>
                  <SelectItem value="wednesday">Wednesday</SelectItem>
                  <SelectItem value="thursday">Thursday</SelectItem>
                  <SelectItem value="friday">Friday</SelectItem>
                  <SelectItem value="saturday">Saturday</SelectItem>
                  <SelectItem value="sunday">Sunday</SelectItem>
                </SelectContent>
              </Select>
            </div>
          );
        }

        if (key === 'default_language') {
          return (
            <div className="space-y-2">
              <Label className="text-base font-medium">{formatKey(key)}</Label>
              <p className="text-sm text-muted-foreground">{description}</p>
              <Select value={value} onValueChange={(val) => updateSetting(category, key, val)}>
                <SelectTrigger className="max-w-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="zh">Chinese</SelectItem>
                  <SelectItem value="hi">Hindi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          );
        }

        return (
          <div className="space-y-2">
            <Label htmlFor={`${category}-${key}`} className="text-base font-medium">
              {formatKey(key)}
            </Label>
            <p className="text-sm text-muted-foreground">{description}</p>
            <Input
              id={`${category}-${key}`}
              value={value}
              onChange={(e) => updateSetting(category, key, e.target.value)}
            />
          </div>
        );
    }
  };

  const formatKey = (key: string) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading system settings...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading system settings...</p>
        </div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="flex items-center justify-center p-8">
        <Card className="max-w-lg w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 p-3 bg-red-100 rounded-full w-12 h-12 flex items-center justify-center">
              <Shield className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-900">System Settings Access Denied</CardTitle>
            <CardDescription>
              Administrator privileges are required to access system settings.
              <br />
              <strong>Debug Info:</strong> Check browser console for detailed authentication logs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showLoginForm ? (
              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Quick Fix:</strong> Use the admin credentials below to login directly.
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => setShowLoginForm(true)} className="flex-1">
                    🔐 Login as Admin
                  </Button>
                  <Button onClick={() => window.location.reload()} variant="outline">
                    🔄 Refresh Page
                  </Button>
                </div>
                <div className="text-center">
                  <Button 
                    onClick={() => {
                      localStorage.clear();
                      sessionStorage.clear();
                      window.location.reload();
                    }} 
                    variant="destructive" 
                    size="sm"
                  >
                    🗑️ Clear Storage & Reload
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={credentials.email}
                    onChange={(e) => setCredentials(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="Enter admin email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={credentials.password}
                    onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Enter admin password"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleLogin} className="flex-1">
                    🚀 Login
                  </Button>
                  <Button onClick={() => setShowLoginForm(false)} variant="outline">
                    Cancel
                  </Button>
                </div>
                <div className="text-center text-sm text-muted-foreground">
                  <strong>Default credentials:</strong><br />
                  Email: admin@school.com<br />
                  Password: admin123
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
          <p className="text-muted-foreground">
            Configure system-wide preferences and administrative settings
          </p>
        </div>
        
        {hasChanges && (
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Unsaved Changes
            </Badge>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={resetSettings}
              disabled={saving}
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>
            <Button 
              size="sm" 
              onClick={saveSettings}
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </div>

      {/* Settings Tabs */}
      <Tabs defaultValue="system" className="space-y-6">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            System
          </TabsTrigger>
          <TabsTrigger value="user_management" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="attendance" className="flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="ui" className="flex items-center gap-2">
            <Palette className="h-4 w-4" />
            Interface
          </TabsTrigger>
          <TabsTrigger value="reports" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Reports
          </TabsTrigger>
        </TabsList>

        {/* System Configuration */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                <CardTitle>System Configuration</CardTitle>
              </div>
              <CardDescription>
                Basic system configuration including application identity, timezone, and date/time formats
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings.system && Object.entries(settings.system).map(([key, setting]) => (
                <div key={key}>
                  {renderSettingField('system', key, setting)}
                  <Separator className="mt-6" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Management */}
        <TabsContent value="user_management">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                <CardTitle>User Management</CardTitle>
              </div>
              <CardDescription>
                User authentication policies, password requirements, and session management
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings.user_management && Object.entries(settings.user_management).map(([key, setting]) => (
                <div key={key}>
                  {renderSettingField('user_management', key, setting)}
                  <Separator className="mt-6" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attendance Settings */}
        <TabsContent value="attendance">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                <CardTitle>Attendance Settings</CardTitle>
              </div>
              <CardDescription>
                Configure attendance tracking rules, photo verification, and late marking policies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings.attendance && Object.entries(settings.attendance).map(([key, setting]) => (
                <div key={key}>
                  {renderSettingField('attendance', key, setting)}
                  <Separator className="mt-6" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                <CardTitle>Notification Settings</CardTitle>
              </div>
              <CardDescription>
                Email, SMS, and push notification preferences for students, teachers, and parents
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings.notifications && Object.entries(settings.notifications).map(([key, setting]) => (
                <div key={key}>
                  {renderSettingField('notifications', key, setting)}
                  <Separator className="mt-6" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security & Backup */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                <CardTitle>Security & Backup</CardTitle>
              </div>
              <CardDescription>
                Security policies, audit logging, backup schedules, and data protection settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings.security && Object.entries(settings.security).map(([key, setting]) => (
                <div key={key}>
                  {renderSettingField('security', key, setting)}
                  <Separator className="mt-6" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* User Interface */}
        <TabsContent value="ui">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                <CardTitle>User Interface</CardTitle>
              </div>
              <CardDescription>
                Theme preferences, language settings, and layout customization options
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings.ui && Object.entries(settings.ui).map(([key, setting]) => (
                <div key={key}>
                  {renderSettingField('ui', key, setting)}
                  <Separator className="mt-6" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Reports & Analytics */}
        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                <CardTitle>Reports & Analytics</CardTitle>
              </div>
              <CardDescription>
                Report generation settings, caching preferences, and data analytics configuration
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {settings.reports && Object.entries(settings.reports).map(([key, setting]) => (
                <div key={key}>
                  {renderSettingField('reports', key, setting)}
                  <Separator className="mt-6" />
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Bottom Action Bar */}
      {hasChanges && (
        <div className="fixed bottom-6 right-6 bg-white border rounded-lg shadow-lg p-4 flex items-center gap-3">
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            You have unsaved changes
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetSettings}
            disabled={saving}
          >
            Discard
          </Button>
          <Button 
            size="sm" 
            onClick={saveSettings}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save All Changes'}
          </Button>
        </div>
      )}
    </div>
  );
};

export default SystemSettingsPage;

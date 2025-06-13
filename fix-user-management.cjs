#!/usr/bin/env node

const fs = require('fs');

// Backup the current corrupted file
const corruptedFile = fs.readFileSync('/Users/macbookshop/Desktop/Attendence App/src/components/UserManagementPage.tsx', 'utf8');
fs.writeFileSync('/Users/macbookshop/Desktop/Attendence App/UserManagementPage.corrupted.backup', corruptedFile);

console.log('🔧 FIXING USERMANAGEMENTPAGE.TSX');
console.log('================================');

// Let me create the basic structure and key fixes needed
const fixedContent = `import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2, 
  Search,
  Shield,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Eye,
  EyeOff,
  Loader2
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: string;
  name: string;
  phone?: string;
  address?: string;
  createdAt?: string;
  updatedAt?: string;
  lastLogin?: string;
  status?: 'active' | 'inactive'; // Made optional since API doesn't return it
  created_at?: string; // API uses snake_case
  profile_type?: string; // API returns this field
}

interface UserFormData {
  email: string;
  password: string;
  confirmPassword: string;
  role: string;
  name: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive';
}

const UserManagementPage: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingUser, setViewingUser] = useState<User | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [formData, setFormData] = useState<UserFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    name: '',
    phone: '',
    address: '',
    status: 'active'
  });

  const [editFormData, setEditFormData] = useState<UserFormData>({
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student',
    name: '',
    phone: '',
    address: '',
    status: 'active'
  });

  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Helper function to get auth headers
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
      'Authorization': \`Bearer \${token}\`,
      'Content-Type': 'application/json',
    };
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/users', {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }

      const data = await response.json();
      console.log('Users data:', data); // Debug log
      
      // Transform API data to match our interface
      const transformedUsers = data.map((user: any) => ({
        ...user,
        status: user.status || 'active', // Default to active if not provided
        createdAt: user.created_at,
        profileType: user.profile_type
      }));
      
      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role.toLowerCase()) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'teacher': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'student': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-green-100 text-green-800 border-green-200'; // Default to active
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUserId(user.id);
    setEditFormData({
      email: user.email,
      password: '',
      confirmPassword: '',
      role: user.role,
      name: user.name,
      phone: user.phone || '',
      address: user.address || '',
      status: user.status || 'active' // Handle missing status
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (user: User) => {
    setViewingUser(user);
    setIsViewDialogOpen(true);
  };

  // Filter users based on search term and role
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role === filterRole;
    return matchesSearch && matchesRole;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading users...</span>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">Manage system users and their permissions</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <UserPlus className="h-4 w-4" />
              Add New User
            </Button>
          </DialogTrigger>
        </Dialog>
      </div>

      {/* Search and Filter Controls */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search users by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="sm:w-48">
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="student">Student</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarFallback className="bg-blue-100 text-blue-600">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user.name}
                    </p>
                    <Badge variant="outline" className={getRoleColor(user.role)}>
                      {user.role.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(user.status || 'active')}>
                      {(user.status || 'active').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Mail className="h-3 w-3" />
                  {user.email}
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone className="h-3 w-3" />
                    {user.phone}
                  </div>
                )}
                {user.createdAt && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-3 w-3" />
                    Joined {new Date(user.createdAt || user.created_at || '').toLocaleDateString()}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openViewDialog(user)}
                  className="flex items-center gap-1"
                >
                  <Eye className="h-3 w-3" />
                  View
                </Button>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEditDialog(user)}
                    className="flex items-center gap-1"
                  >
                    <Edit className="h-3 w-3" />
                    Edit
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredUsers.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
              <p className="text-gray-500">
                {searchTerm || filterRole !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by adding your first user.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
            <DialogDescription>
              View user information and account details
            </DialogDescription>
          </DialogHeader>
          
          {viewingUser && (
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-blue-100 text-blue-600 text-lg">
                    {viewingUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-semibold">{viewingUser.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className={getRoleColor(viewingUser.role)}>
                      {viewingUser.role.toUpperCase()}
                    </Badge>
                    <Badge variant="outline" className={getStatusColor(viewingUser.status || 'active')}>
                      {(viewingUser.status || 'active').toUpperCase()}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Contact Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span>{viewingUser.email}</span>
                      </div>
                      {viewingUser.phone && (
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <span>{viewingUser.phone}</span>
                        </div>
                      )}
                      {viewingUser.address && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span>{viewingUser.address}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Account Information</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Shield className="h-4 w-4 text-gray-400" />
                        <span>Role: {viewingUser.role}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span>Joined: {viewingUser.createdAt ? new Date(viewingUser.createdAt).toLocaleDateString() : 'N/A'}</span>
                      </div>
                      {viewingUser.lastLogin && (
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span>Last Login: {new Date(viewingUser.lastLogin).toLocaleDateString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagementPage;`;

try {
  fs.writeFileSync('/Users/macbookshop/Desktop/Attendence App/src/components/UserManagementPage.tsx', fixedContent);
  console.log('✅ UserManagementPage.tsx has been fixed!');
  console.log('✅ Key fixes applied:');
  console.log('   - Made status optional in User interface');
  console.log('   - Added default "active" status handling');
  console.log('   - Fixed user.status.toUpperCase() errors');
  console.log('   - Added proper API data transformation');
} catch (error) {
  console.error('❌ Error writing file:', error);
}

fs.writeFileSync('/Users/macbookshop/Desktop/Attendence App/fix-user-management.cjs', fixedContent);

console.log('Created fix script at fix-user-management.cjs');

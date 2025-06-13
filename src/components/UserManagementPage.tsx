import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { 
  Users, 
  UserPlus, 
  Edit, 
  Trash2,
  Search,
  Mail,
  Phone,
  Calendar,
  Eye,
  EyeOff,
  Loader2,
  Shield,
  Save
} from 'lucide-react';

interface User {
  id: string;
  email: string;
  role: string;
  name: string;
  phone?: string;
  address?: string;
  created_at?: string;
  status?: 'active' | 'inactive';
  profile_type?: string;
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
  const [roleFilter, setRoleFilter] = useState('all');
  
  // Dialog states
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Form states
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Selected user states
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  
  // Form data
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

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${token}`,
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
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      confirmPassword: '',
      role: 'student',
      name: '',
      phone: '',
      address: '',
      status: 'active'
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const resetEditForm = () => {
    setEditFormData({
      email: '',
      password: '',
      confirmPassword: '',
      role: 'student',
      name: '',
      phone: '',
      address: '',
      status: 'active'
    });
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
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
      status: user.status || 'active'
    });
    setIsEditDialogOpen(true);
  };

  const openViewDialog = (user: User) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const openDeleteDialog = (user: User) => {
    setSelectedUser(user);
    setDeletingUserId(user.id);
    setIsDeleteDialogOpen(true);
  };

  const validateAddForm = () => {
    const errors = [];
    
    if (!formData.name.trim()) errors.push('Name is required');
    if (!formData.email.trim()) errors.push('Email is required');
    if (!formData.password.trim()) errors.push('Password is required');
    if (formData.password !== formData.confirmPassword) errors.push('Passwords do not match');
    if (formData.password.length < 6) errors.push('Password must be at least 6 characters');
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      errors.push('Please enter a valid email address');
    }
    
    return errors;
  };

  const validateEditForm = () => {
    const errors = [];
    
    if (!editFormData.name.trim()) errors.push('Name is required');
    if (!editFormData.email.trim()) errors.push('Email is required');
    
    // Only validate password if it's being changed
    if (editFormData.password.trim()) {
      if (editFormData.password !== editFormData.confirmPassword) {
        errors.push('Passwords do not match');
      }
      if (editFormData.password.length < 6) {
        errors.push('Password must be at least 6 characters');
      }
    }
    
    return errors;
  };

  const handleAddUser = async () => {
    const validationErrors = validateAddForm();
    if (validationErrors.length > 0) {
      toast.error(validationErrors.join(', '));
      return;
    }

    try {
      setIsCreating(true);
      
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role: formData.role,
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          status: formData.status
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      toast.success('User created successfully!');
      setIsAddDialogOpen(false);
      resetForm();
      fetchUsers();
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  const handleEditUser = async () => {
    if (!editingUserId) return;
    
    const validationErrors = validateEditForm();
    if (validationErrors.length > 0) {
      toast.error(validationErrors.join(', '));
      return;
    }

    try {
      setIsUpdating(true);
      
      const updateData: any = {
        name: editFormData.name,
        phone: editFormData.phone,
        address: editFormData.address,
        status: editFormData.status
      };
      
      // Only include password if it's being changed
      if (editFormData.password.trim()) {
        updateData.password = editFormData.password;
      }
      
      const response = await fetch(`/api/users/${editingUserId}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      toast.success('User updated successfully!');
      setIsEditDialogOpen(false);
      setEditingUserId(null);
      resetEditForm();
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update user');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!deletingUserId) return;

    try {
      setIsDeleting(true);
      
      const response = await fetch(`/api/users/${deletingUserId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete user');
      }

      toast.success('User deleted successfully!');
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      setDeletingUserId(null);
      fetchUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete user');
    } finally {
      setIsDeleting(false);
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

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
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
        <Button onClick={openAddDialog} className="flex items-center gap-2">
          <UserPlus className="h-4 w-4" />
          Add New User
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search users by name or email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-[180px]">
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
        </CardContent>
      </Card>

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
                    <div className="flex gap-1 mt-1">
                      <Badge variant="outline" className={getRoleColor(user.role)}>
                        {user.role.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(user.status || 'active')}>
                        {(user.status || 'active').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Mail className="h-3 w-3" />
                  <span className="truncate">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Phone className="h-3 w-3" />
                    {user.phone}
                  </div>
                )}
                {user.created_at && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <Calendar className="h-3 w-3" />
                    Joined {new Date(user.created_at).toLocaleDateString()}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 border-t gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => openViewDialog(user)}
                  className="flex items-center gap-1 flex-1"
                >
                  <Eye className="h-3 w-3" />
                  View
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => openEditDialog(user)}
                  className="flex items-center gap-1 flex-1"
                >
                  <Edit className="h-3 w-3" />
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => openDeleteDialog(user)}
                  className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
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
                {searchTerm || roleFilter !== 'all'
                  ? 'Try adjusting your search criteria or filters.'
                  : 'Get started by adding your first user.'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add New User</DialogTitle>
            <DialogDescription>
              Create a new user account with login credentials
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-name">Full Name *</Label>
              <Input
                id="add-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-email">Email Address *</Label>
              <Input
                id="add-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@school.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-role">Role *</Label>
              <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="add-password">Password *</Label>
                <div className="relative">
                  <Input
                    id="add-password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="Enter password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-confirm-password">Confirm Password *</Label>
                <div className="relative">
                  <Input
                    id="add-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    placeholder="Confirm password"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-phone">Phone Number</Label>
              <Input
                id="add-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-address">Address</Label>
              <Input
                id="add-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="add-status">Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleAddUser}
              disabled={isCreating || !formData.name || !formData.email || !formData.password}
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Create User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information (leave password blank to keep current)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                value={editFormData.name}
                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                placeholder="Enter full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email Address *</Label>
              <Input
                id="edit-email"
                type="email"
                value={editFormData.email}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                placeholder="user@school.com"
                required
                disabled
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-role">Role</Label>
              <Select value={editFormData.role} onValueChange={(value) => setEditFormData({ ...editFormData, role: value })} disabled>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="teacher">Teacher</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-password">New Password</Label>
                <div className="relative">
                  <Input
                    id="edit-password"
                    type={showPassword ? "text" : "password"}
                    value={editFormData.password}
                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                    placeholder="Leave blank to keep current"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-confirm-password">Confirm Password</Label>
                <div className="relative">
                  <Input
                    id="edit-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    value={editFormData.confirmPassword}
                    onChange={(e) => setEditFormData({ ...editFormData, confirmPassword: e.target.value })}
                    placeholder="Confirm new password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={editFormData.phone}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={editFormData.address}
                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                placeholder="Enter address"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
              <Select value={editFormData.status} onValueChange={(value: any) => setEditFormData({ ...editFormData, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleEditUser}
              disabled={isUpdating || !editFormData.name || !editFormData.email}
            >
              {isUpdating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Update User
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View User Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedUser && (
            <>
              <DialogHeader>
                <DialogTitle>User Details</DialogTitle>
                <DialogDescription>
                  Complete information for {selectedUser.name}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* User Header */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="bg-blue-100 text-blue-600 text-xl">
                      {selectedUser.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">{selectedUser.name}</h3>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className={getRoleColor(selectedUser.role)}>
                        {selectedUser.role.toUpperCase()}
                      </Badge>
                      <Badge variant="outline" className={getStatusColor(selectedUser.status || 'active')}>
                        {(selectedUser.status || 'active').toUpperCase()}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* User Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Contact Information
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Email:</span>
                          <span>{selectedUser.email}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Phone:</span>
                          <span>{selectedUser.phone || 'Not provided'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Address:</span>
                          <span className="text-right">{selectedUser.address || 'Not provided'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="pt-6">
                      <h4 className="font-medium mb-4 flex items-center gap-2">
                        <Shield className="h-4 w-4" />
                        Account Information
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Role:</span>
                          <span className="capitalize">{selectedUser.role}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Status:</span>
                          <span className="capitalize">{selectedUser.status || 'active'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Created:</span>
                          <span>{selectedUser.created_at ? new Date(selectedUser.created_at).toLocaleDateString() : 'Unknown'}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                  Close
                </Button>
                <Button onClick={() => {
                  setIsViewDialogOpen(false);
                  openEditDialog(selectedUser);
                }}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit User
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedUser?.name}? This action cannot be undone.
              {selectedUser?.role === 'admin' && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  <p className="text-red-800 text-sm font-medium">
                    ⚠️ Warning: This is an admin user. Deleting admin users may affect system access.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete User'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagementPage;

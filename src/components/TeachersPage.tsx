import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Search, Plus, User, Mail, Phone, MapPin, BookOpen, Users, GraduationCap, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Topic {
  id: string;
  name: string;
  description?: string;
}

interface Stage {
  id: string;
  name: string;
  description?: string;
  topics: Topic[];
}

interface Teacher {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  topics?: {
    topic_id: string;
    topic_name: string;
    class_id: string;
    class_name: string;
  }[];
}

interface FormData {
  name: string;
  email: string;
  password: string;
  phone: string;
  address: string;
  topicIds: string[];
}

const API_BASE = 'https://scholar-track-pulse.onrender.com/api';

export function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    phone: '',
    address: '',
    topicIds: []
  });
  const [availableTopics, setAvailableTopics] = useState<Stage[]>([]);

  // Toast function for notifications

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/teachers`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setTeachers(data);
    } catch (error) {
      console.error('Error fetching teachers:', error);
      toast.error('Failed to fetch teachers. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Update the fetchAvailableTopics function to set both states correctly
  const fetchAvailableTopics = async () => {
    try {
      const response = await fetch(`${API_BASE}/teachers/available-topics`, {
        headers: getAuthHeaders()
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setAvailableTopics(data);
      
      // Transform flat topics array into grouped stages structure
      const groupedByClass = data.reduce((acc: any, topic: any) => {
        const className = topic.class_name || 'General';
        if (!acc[className]) {
          acc[className] = {
            id: className.toLowerCase().replace(/\s+/g, '_'),
            name: className,
            topics: []
          };
        }
        acc[className].topics.push({
          id: topic.id,
          name: topic.name,
          description: topic.description
        });
        return acc;
      }, {});
      
      const stagesArray: Stage[] = Object.values(groupedByClass);
      setStages(stagesArray);
    } catch (error) {
      console.error('Error fetching available topics:', error);
      toast.error('Failed to fetch available topics.');
    }
  };

  const createTeacher = async (teacherData: FormData) => {
    const response = await fetch(`${API_BASE}/teachers`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(teacherData)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to create teacher');
    }
    
    return response.json();
  };

  const deleteTeacher = async (id: string) => {
    const response = await fetch(`${API_BASE}/teachers/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to delete teacher');
    }
    
    return response.json();
  };

  useEffect(() => {
    fetchTeachers();
    fetchAvailableTopics();
  }, []);

  const filteredTeachers = teachers.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    teacher.topics?.some(topic => 
      topic.topic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      topic.class_name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      phone: '',
      address: '',
      topicIds: []
    });
  };

  const handleAddSubmit = async () => {
    try {
      await createTeacher(formData);
      
      toast.success('Teacher added successfully!');
      
      resetForm();
      setIsAddDialogOpen(false);
      fetchTeachers();
    } catch (error) {
      console.error('Error adding teacher:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to add teacher. Please try again.');
    }
  };

  const handleEditSubmit = async () => {
    if (!selectedTeacher) return;
    
    try {
      setLoading(true);
      
      // Don't include password in edit request unless it's being changed
      const updateData: {
        name: string;
        email: string;
        phone: string;
        address: string;
        topicIds: string[];
        password?: string;
      } = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        topicIds: formData.topicIds
      };
      
      // Only include password if it's not empty (user wants to change it)
      if (formData.password.trim()) {
        updateData.password = formData.password;
      }
      
      const response = await fetch(`${API_BASE}/teachers/${selectedTeacher.id}`, {
        method: 'PUT',
        headers: getAuthHeaders(),
        body: JSON.stringify(updateData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update teacher');
      }
      
      toast.success('Teacher updated successfully!');
      setIsEditDialogOpen(false);
      resetForm();
      fetchTeachers();
    } catch (error) {
      console.error('Teacher update error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to update teacher');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (teacherId: string) => {
    if (!confirm('Are you sure you want to delete this teacher? This will also delete their user account.')) {
      return;
    }

    try {
      await deleteTeacher(teacherId);
      
      toast.success('Teacher deleted successfully!');
      
      fetchTeachers();
    } catch (error) {
      console.error('Error deleting teacher:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete teacher. Please try again.');
    }
  };

  const handleEdit = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    const topicIds = teacher.topics?.map(t => t.topic_id) || [];
    setFormData({
      name: teacher.name,
      email: teacher.email || '',
      password: '', 
      phone: teacher.phone || '',
      address: teacher.address || '',
      topicIds: topicIds
    });
    setIsEditDialogOpen(true);
  };

  const handleView = (teacher: Teacher) => {
    setSelectedTeacher(teacher);
    setIsViewDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Teachers</h2>
          <p className="text-muted-foreground">
            Manage teacher accounts and assignments
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="mr-2 h-4 w-4" />
              Add Teacher
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Teacher</DialogTitle>
              <DialogDescription>
                Create a new teacher account with login credentials
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="add-name">Full Name *</Label>
                <Input
                  id="add-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter teacher's full name"
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
                  placeholder="teacher@school.com"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="add-password">Password *</Label>
                <Input
                  id="add-password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter secure password"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Topic Assignments</Label>
                <div className="max-h-60 overflow-y-auto border rounded-md p-4">
                  {stages.map((stage) => (
                    <div key={stage.id} className="mb-4">
                      <h4 className="font-medium text-sm text-gray-700 mb-2">
                        {stage.name}
                      </h4>
                      <div className="space-y-2">
                        {stage.topics && stage.topics.map((topic) => (
                          <div key={topic.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`add-topic-${topic.id}`}
                              checked={formData.topicIds.includes(topic.id)}
                              onChange={(e) => {
                                const topicIds = e.target.checked
                                  ? [...formData.topicIds, topic.id]
                                  : formData.topicIds.filter(id => id !== topic.id);
                                setFormData(prev => ({ ...prev, topicIds }));
                              }}
                              className="w-4 h-4 text-blue-600"
                            />
                            <label
                              htmlFor={`add-topic-${topic.id}`}
                              className="text-sm text-gray-600"
                            >
                              {topic.name}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
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

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleAddSubmit}
                  disabled={!formData.name || !formData.email || !formData.password}
                >
                  Add Teacher
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{teachers.length}</p>
                <p className="text-sm text-gray-600">Total Faculty</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <User className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {teachers.filter(t => t.email).length}
                </p>
                <p className="text-sm text-gray-600">With Login Access</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">
                  {teachers.reduce((total, teacher) => total + (teacher.topics?.length || 0), 0)}
                </p>
                <p className="text-sm text-gray-600">Topic Assignments</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{availableTopics.length}</p>
                <p className="text-sm text-gray-600">Medical Stages</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-bold text-gray-900">Medical College Faculty Management</CardTitle>
              <p className="text-gray-600 mt-1">Manage teachers and their topic assignments across medical stages</p>
            </div>
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Add Teacher
            </Button>
          </div>
          
          <div className="flex items-center space-x-4 mt-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search teachers by name, email, or assigned topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search teachers by name, email, or topics..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Teacher</TableHead>
                  <TableHead>Topics</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Account Status</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="w-[70px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTeachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarFallback>
                            {teacher.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{teacher.name}</div>
                          {teacher.email && (
                            <div className="text-sm text-gray-500">{teacher.email}</div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {teacher.topics && teacher.topics.length > 0 ? (
                          teacher.topics.slice(0, 2).map(topic => (
                            <Badge key={topic.topic_id} variant="secondary" className="mr-1">
                              {topic.topic_name}
                            </Badge>
                          ))
                        ) : (
                          <span className="text-gray-400">No topics assigned</span>
                        )}
                        {teacher.topics && teacher.topics.length > 2 && (
                          <span className="text-xs text-gray-500">
                            +{teacher.topics.length - 2} more
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {teacher.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Phone className="h-3 w-3 mr-1" />
                            {teacher.phone}
                          </div>
                        )}
                        {teacher.address && (
                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="h-3 w-3 mr-1" />
                            {teacher.address}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {teacher.user_id ? (
                        <Badge className="bg-green-100 text-green-800">Active Account</Badge>
                      ) : (
                        <Badge variant="outline">No Account</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {new Date(teacher.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(teacher)}>
                            <User className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(teacher)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Teacher
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDelete(teacher.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Teacher
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit Teacher Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
            <DialogDescription>
              Update teacher information (password change requires separate action)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter teacher's full name"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email Address *</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="teacher@school.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Topic Assignments</Label>
              <div className="max-h-60 overflow-y-auto border rounded-md p-4">
                {availableTopics.map((stage) => (
                  <div key={stage.id} className="mb-4">
                    <h4 className="font-medium text-sm text-gray-700 mb-2">
                      {stage.name}
                    </h4>
                    <div className="space-y-2">
                      {stage.topics && stage.topics.map((topic) => (
                        <div key={topic.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`edit-topic-${topic.id}`}
                            checked={formData.topicIds.includes(topic.id)} // Fixed to use formData instead of editFormData
                            onChange={(e) => {
                              const topicIds = e.target.checked
                                ? [...formData.topicIds, topic.id]
                                : formData.topicIds.filter(id => id !== topic.id);
                              setFormData(prev => ({ ...prev, topicIds })); // Fixed to update formData
                            }}
                            className="w-4 h-4 text-blue-600"
                          />
                          <label
                            htmlFor={`edit-topic-${topic.id}`}
                            className="text-sm text-gray-600"
                          >
                            {topic.name}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-phone">Phone Number</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="Enter phone number"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-address">Address</Label>
              <Input
                id="edit-address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter address"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleEditSubmit}
                disabled={!formData.name || !formData.email}
              >
                Update Teacher
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Teacher Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          {selectedTeacher && (
            <>
              <DialogHeader>
                <DialogTitle>Teacher Details</DialogTitle>
                <DialogDescription>
                  Complete information for {selectedTeacher.name}
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-6">
                {/* Teacher Header */}
                <div className="flex items-center gap-4">
                  <Avatar className="h-20 w-20">
                    <AvatarFallback className="text-2xl">
                      {selectedTeacher.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold">{selectedTeacher.name}</h3>
                    {selectedTeacher.topics && selectedTeacher.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedTeacher.topics.map(topic => (
                          <Badge key={topic.topic_id} variant="secondary" className="text-xs">
                            {topic.topic_name}
                          </Badge>
                        ))}
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      {selectedTeacher.user_id ? (
                        <Badge className="bg-green-100 text-green-800">
                          <User className="h-3 w-3 mr-1" />
                          Has Login Account
                        </Badge>
                      ) : (
                        <Badge variant="outline">
                          No Login Account
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Contact Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {selectedTeacher.email && (
                        <div className="flex items-center space-x-2">
                          <Mail className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{selectedTeacher.email}</span>
                        </div>
                      )}
                      {selectedTeacher.phone && (
                        <div className="flex items-center space-x-2">
                          <Phone className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{selectedTeacher.phone}</span>
                        </div>
                      )}
                      {selectedTeacher.address && (
                        <div className="flex items-center space-x-2">
                          <MapPin className="h-4 w-4 text-gray-500" />
                          <span className="text-sm">{selectedTeacher.address}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Account Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Account Status:</span>
                          <span>{selectedTeacher.user_id ? 'Active' : 'No Account'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Joined:</span>
                          <span>{new Date(selectedTeacher.created_at).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Last Updated:</span>
                          <span>{new Date(selectedTeacher.updated_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
                    Close
                  </Button>
                  <Button onClick={() => {
                    setIsViewDialogOpen(false);
                    handleEdit(selectedTeacher);
                  }}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit Teacher
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

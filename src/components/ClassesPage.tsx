import { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { 
  School, 
  Plus, 
  Search, 
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Users,
  BookOpen,
  GraduationCap,
  Loader2,
  AlertCircle
} from "lucide-react";

import { useClassesManagement, ClassData, Topic } from '@/hooks/useClassesManagement';
import { AddClassDialog } from '@/components/dialogs/AddClassDialog';
import { EditClassDialog } from '@/components/dialogs/EditClassDialog';
import { ClassDetailsDialog } from '@/components/dialogs/ClassDetailsDialog';

export function ClassesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState("all");
  
  // Dialog states
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);

  const {
    classes,
    loading,
    error,
    stats,
    createClass,
    updateClass,
    deleteClass,
    refetchClasses,
    isCreatingClass,
    isUpdatingClass
  } = useClassesManagement();

  console.log('ClassesPage: Hook state:', {
    classesCount: classes?.length,
    loading,
    error,
    stats,
    isCreatingClass,
    isUpdatingClass,
    showAddDialog,
    showEditDialog,
    showDetailsDialog
  });

  // Filter classes based on search and teacher
  const getFilteredClasses = () => {
    if (!classes || classes.length === 0) return [];
    
    let filtered = classes || [];
    
    // Apply search filter
    if (searchTerm) {
      const lowercaseQuery = searchTerm.toLowerCase();
      filtered = filtered.filter((cls: ClassData) => 
        cls.name.toLowerCase().includes(lowercaseQuery) ||
        cls.section.toLowerCase().includes(lowercaseQuery) ||
        cls.teacher_name?.toLowerCase().includes(lowercaseQuery)
      );
    }
    
    // Apply teacher filter
    if (selectedTeacher !== "all") {
      filtered = filtered.filter((cls: ClassData) => cls.teacher_id === selectedTeacher);
    }
    
    return filtered;
  };

  const filteredClasses = getFilteredClasses();

  // Handle class deletion with confirmation
  const handleDeleteClass = async (classId: string, className: string) => {
    console.log('ClassesPage: Delete requested for class:', classId, className);
    
    const confirmed = window.confirm(
      `Are you sure you want to delete "${className}"?\n\nThis action cannot be undone and will also delete all topics in this class.`
    );
    
    if (confirmed) {
      try {
        console.log('ClassesPage: User confirmed deletion, proceeding...');
        await deleteClass(classId);
        console.log('ClassesPage: Class deleted successfully');
        
        // Show success message (you could use a toast here)
        alert('Class deleted successfully!');
      } catch (error) {
        console.error('ClassesPage: Class deletion failed:', error);
        alert('Failed to delete class. Please try again.');
      }
    } else {
      console.log('ClassesPage: User cancelled deletion');
    }
  };

  // Get unique teachers for filter
  const getUniqueTeachers = () => {
    if (!classes || classes.length === 0) return [];
    
    const teachersMap = new Map();
    classes.forEach((cls: ClassData) => {
      if (cls.teacher_id && cls.teacher_name) {
        teachersMap.set(cls.teacher_id, cls.teacher_name);
      }
    });
    
    return Array.from(teachersMap.entries()).map(([id, name]) => ({ id, name }));
  };

  const uniqueTeachers = getUniqueTeachers();

  const getTopicsStatusSummary = (topics: Topic[]) => {
    const planned = topics.filter(t => t.status === 'planned').length;
    const inProgress = topics.filter(t => t.status === 'in_progress').length;
    const completed = topics.filter(t => t.status === 'completed').length;
    
    return { planned, inProgress, completed };
  };

  if (loading && !classes.length) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading classes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <AlertCircle className="h-8 w-8 text-red-500 mr-2" />
        <span className="text-red-600">Error: {error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <School className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Medical College Management</h1>
            <p className="text-gray-600">Manage medical stages, topics, and curriculum</p>
          </div>
        </div>

        <Button className="gap-2" onClick={() => {
          console.log('ClassesPage: Add Medical Stage button clicked');
          setShowAddDialog(true);
        }}>
          <Plus className="h-4 w-4" />
          Add Medical Stage
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <School className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalClasses}</p>
                <p className="text-sm text-gray-600">Medical Stages</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                <p className="text-sm text-gray-600">Medical Students</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.totalTopics}</p>
                <p className="text-sm text-gray-600">Medical Topics</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold text-gray-900">{stats.averageStudentsPerClass}</p>
                <p className="text-sm text-gray-600">Avg Students/Class</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search medical stages by name, section, or faculty..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by faculty" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Faculty</SelectItem>
                {uniqueTeachers.map((teacher: any) => (
                  <SelectItem key={teacher.id} value={teacher.id}>
                    {teacher.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Classes Table */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Stages ({filteredClasses.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredClasses.length === 0 ? (
            <div className="text-center py-8">
              <School className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No medical stages found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || selectedTeacher !== "all" 
                  ? "Try adjusting your search criteria or filters."
                  : "Get started by creating your first medical stage."
                }
              </p>
              {!searchTerm && selectedTeacher === "all" && (
                <Button onClick={() => setShowAddDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Medical Stage
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Medical Stage</TableHead>
                  <TableHead>Faculty</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Topics</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClasses.map((classData: ClassData) => {
                  const topicsStatus = getTopicsStatusSummary(classData.topics || []);
                  return (
                    <TableRow key={classData.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-900">
                            {classData.name} - {classData.section}
                          </div>
                          {classData.description && (
                            <div className="text-sm text-gray-600">
                              {classData.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {classData.teacher_name || 'Not assigned'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="h-4 w-4 text-gray-400" />
                          <span>{classData.student_count || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4 text-gray-400" />
                          <span>{classData.total_topics || 0}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {classData.total_topics > 0 ? (
                            <div className="flex gap-1 text-xs">
                              {topicsStatus.completed > 0 && (
                                <Badge variant="outline" className="text-green-600 px-1 py-0">
                                  {topicsStatus.completed} done
                                </Badge>
                              )}
                              {topicsStatus.inProgress > 0 && (
                                <Badge variant="outline" className="text-blue-600 px-1 py-0">
                                  {topicsStatus.inProgress} active
                                </Badge>
                              )}
                              {topicsStatus.planned > 0 && (
                                <Badge variant="outline" className="text-gray-600 px-1 py-0">
                                  {topicsStatus.planned} planned
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-sm text-gray-500">No topics</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => {
                              setSelectedClass(classData);
                              setShowDetailsDialog(true);
                            }}>
                              <Eye className="mr-2 h-4 w-4" />
                              View Stage Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              setSelectedClass(classData);
                              setShowEditDialog(true);
                            }}>
                              <Edit className="mr-2 h-4 w-4" />
                              Edit Medical Stage
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDeleteClass(classData.id, `${classData.name} - ${classData.section}`)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Medical Stage
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <AddClassDialog 
        isOpen={showAddDialog}
        onClose={() => {
          console.log('ClassesPage: Closing Add Class dialog');
          setShowAddDialog(false);
        }}
        onSubmit={createClass}
        isLoading={isCreatingClass}
      />
      <EditClassDialog 
        isOpen={showEditDialog}
        onClose={() => setShowEditDialog(false)}
        classData={selectedClass}
        onSubmit={(data) => selectedClass ? updateClass(selectedClass.id, data) : Promise.resolve()}
        isLoading={isUpdatingClass}
      />
      <ClassDetailsDialog 
        isOpen={showDetailsDialog}
        onClose={() => setShowDetailsDialog(false)}
        classData={selectedClass}
        onRefresh={refetchClasses}
      />
    </div>
  );
}

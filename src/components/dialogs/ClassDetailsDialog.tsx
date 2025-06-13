import { useState } from 'react';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  School, 
  Users, 
  BookOpen, 
  Calendar,
  User,
  Plus,
  Search,
  CheckCircle,
  Clock,
  PlayCircle
} from "lucide-react";
import { ClassData, Topic } from '@/hooks/useClassesManagement';
import { TopicsList } from './TopicsList';

interface ClassDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classData: ClassData | null;
  onRefresh?: () => void;
}

export function ClassDetailsDialog({ isOpen, onClose, classData, onRefresh }: ClassDetailsDialogProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [triggerAddTopic, setTriggerAddTopic] = useState(false);

  if (!classData) return null;

  const getTopicsStatusSummary = (topics: Topic[]) => {
    const planned = topics.filter(t => t.status === 'planned').length;
    const inProgress = topics.filter(t => t.status === 'in_progress').length;
    const completed = topics.filter(t => t.status === 'completed').length;
    
    return { planned, inProgress, completed };
  };

  const filteredTopics = classData.topics?.filter(topic =>
    topic.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    topic.description.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const topicsStatus = getTopicsStatusSummary(classData.topics || []);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <School className="h-6 w-6 text-blue-600" />
            {classData.name} - {classData.section}
          </DialogTitle>
          <DialogDescription>
            Class details and topics management
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Class Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Class Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <School className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Class:</span>
                    <span>{classData.name} - {classData.section}</span>
                  </div>
                  
                  {classData.description && (
                    <div className="flex items-start gap-2">
                      <BookOpen className="h-4 w-4 text-gray-500 mt-0.5" />
                      <span className="font-medium">Description:</span>
                      <span className="text-gray-600">{classData.description}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Teacher:</span>
                    <span>{classData.teacher_name || 'Not assigned'}</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Students:</span>
                    <span>{classData.student_count} / {classData.capacity}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <BookOpen className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Topics:</span>
                    <span>{classData.total_topics}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <span className="font-medium">Created:</span>
                    <span>{new Date(classData.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Topics Statistics */}
          {classData.topics && classData.topics.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="text-xl font-bold text-gray-900">{topicsStatus.completed}</p>
                      <p className="text-sm text-gray-600">Completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <PlayCircle className="h-6 w-6 text-blue-600" />
                    <div>
                      <p className="text-xl font-bold text-gray-900">{topicsStatus.inProgress}</p>
                      <p className="text-sm text-gray-600">In Progress</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2">
                    <Clock className="h-6 w-6 text-gray-600" />
                    <div>
                      <p className="text-xl font-bold text-gray-900">{topicsStatus.planned}</p>
                      <p className="text-sm text-gray-600">Planned</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Topics Section */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Topics ({filteredTopics.length})</CardTitle>
                <Button size="sm" className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Topic
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Topics */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search topics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Topics List */}
              {(() => {
                const hasTopics = filteredTopics.length > 0;
                const isEmpty = classData.topics?.length === 0;
                console.log('🎯 ClassDetailsDialog: Topics state check:', {
                  'classData.topics?.length': classData.topics?.length,
                  'filteredTopics.length': filteredTopics.length,
                  'hasTopics': hasTopics,
                  'isEmpty': isEmpty,
                  'searchTerm': searchTerm,
                  'willShowEmptyState': !hasTopics,
                  'triggerAddTopic': triggerAddTopic
                });
                return null;
              })()}
              
              {filteredTopics.length === 0 ? (
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {classData.topics?.length === 0 ? 'No topics yet' : 'No topics found'}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {classData.topics?.length === 0 
                      ? 'Start by adding your first topic to this class.'
                      : 'Try adjusting your search terms.'
                    }
                  </p>
                  {classData.topics?.length === 0 && (
                    <Button 
                      className="gap-2"
                      onClick={() => {
                        console.log('🎯 ClassDetailsDialog: Add First Topic clicked');
                        console.log('🎯 ClassDetailsDialog: Current triggerAddTopic state:', triggerAddTopic);
                        console.log('🎯 ClassDetailsDialog: Setting triggerAddTopic to true...');
                        setTriggerAddTopic(true);
                        console.log('🎯 ClassDetailsDialog: triggerAddTopic set to true');
                      }}
                    >
                      <Plus className="h-4 w-4" />
                      Add First Topic
                    </Button>
                  )}
                </div>
              ) : null}
              
              {/* Always render TopicsList so it can receive triggerAdd prop */}
              <TopicsList 
                topics={filteredTopics} 
                classId={classData.id}
                onTopicUpdate={() => {
                  console.log('🎯 ClassDetailsDialog: Topic updated, calling onRefresh');
                  onRefresh?.();
                }}
                triggerAdd={triggerAddTopic}
                onTriggerAddReset={() => {
                  console.log('🎯 ClassDetailsDialog: onTriggerAddReset called, setting triggerAddTopic to false');
                  setTriggerAddTopic(false);
                }}
              />
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

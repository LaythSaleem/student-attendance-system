import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { 
  CheckCircle, 
  Clock, 
  PlayCircle, 
  Edit, 
  Trash2, 
  MoreVertical,
  Plus,
  Save,
  Loader2,
  GripVertical
} from "lucide-react";
import { toast } from 'sonner';
import { useClassesManagement, type Topic, type TopicFormData } from '@/hooks/useClassesManagement';

interface TopicsListProps {
  topics: Topic[];
  classId: string;
  onTopicUpdate?: () => void;
  triggerAdd?: boolean;
  onTriggerAddReset?: () => void;
}

interface AddTopicDialogProps {
  isOpen: boolean;
  onClose: () => void;
  classId: string;
  onSubmit: (topicData: TopicFormData) => Promise<void>;
  isLoading: boolean;
}

interface EditTopicDialogProps {
  isOpen: boolean;
  onClose: () => void;
  topic: Topic | null;
  onSubmit: (topicData: TopicFormData) => Promise<void>;
  isLoading: boolean;
}

function AddTopicDialog({ isOpen, onClose, classId: _classId, onSubmit, isLoading }: AddTopicDialogProps) {
  const [formData, setFormData] = useState<TopicFormData>({
    name: '',
    description: '',
    order_index: 0,
    status: 'planned'
  });

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      order_index: 0,
      status: 'planned'
    });
  };

  const handleInputChange = (field: keyof TopicFormData, value: string | number) => {
    setFormData((prev: TopicFormData) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    console.log('🎯 AddTopicDialog: handleSubmit called');
    console.log('🎯 AddTopicDialog: formData:', formData);
    
    if (!formData.name.trim()) {
      console.error('❌ AddTopicDialog: Topic name is required');
      toast.error('Topic name is required');
      return;
    }
    
    try {
      console.log('🚀 AddTopicDialog: Calling onSubmit...');
      await onSubmit(formData);
      console.log('✅ AddTopicDialog: onSubmit successful');
      resetForm();
    } catch (error) {
      console.error('❌ AddTopicDialog: Topic creation failed:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add New Topic</DialogTitle>
          <DialogDescription>
            Create a new topic for this class.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="topic-name">Topic Name *</Label>
            <Input
              id="topic-name"
              placeholder="e.g., Introduction to Algebra"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="topic-description">Description</Label>
            <Textarea
              id="topic-description"
              placeholder="Optional topic description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="topic-status">Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="topic-order">Order</Label>
              <Input
                id="topic-order"
                type="number"
                min="0"
                value={formData.order_index}
                onChange={(e) => handleInputChange('order_index', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !formData.name.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Create Topic
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditTopicDialog({ isOpen, onClose, topic, onSubmit, isLoading }: EditTopicDialogProps) {
  const [formData, setFormData] = useState<TopicFormData>({
    name: '',
    description: '',
    order_index: 0,
    status: 'planned'
  });

  React.useEffect(() => {
    if (topic) {
      setFormData({
        name: topic.name || '',
        description: topic.description || '',
        order_index: topic.order_index || 0,
        status: topic.status || 'planned'
      });
    }
  }, [topic]);

  const handleInputChange = (field: keyof TopicFormData, value: string | number) => {
    setFormData((prev: TopicFormData) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) return;

    try {
      await onSubmit(formData);
    } catch (error) {
      // Error handled by parent
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Topic</DialogTitle>
          <DialogDescription>
            Update topic information and status.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-topic-name">Topic Name *</Label>
            <Input
              id="edit-topic-name"
              placeholder="e.g., Introduction to Algebra"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="edit-topic-description">Description</Label>
            <Textarea
              id="edit-topic-description"
              placeholder="Optional topic description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-topic-status">Status</Label>
              <Select value={formData.status} onValueChange={(value: any) => handleInputChange('status', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-topic-order">Order</Label>
              <Input
                id="edit-topic-order"
                type="number"
                min="0"
                value={formData.order_index}
                onChange={(e) => handleInputChange('order_index', parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading || !formData.name.trim()}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Update Topic
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function TopicsList({ topics, classId, onTopicUpdate, triggerAdd, onTriggerAddReset }: TopicsListProps) {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);

  // Debug logging for props
  React.useEffect(() => {
    console.log('🎯 TopicsList: Component mounted/updated');
    console.log('🎯 TopicsList: Props received:', {
      topics: topics?.length,
      classId,
      triggerAdd,
      onTriggerAddReset: !!onTriggerAddReset,
      onTopicUpdate: !!onTopicUpdate
    });
  });

  // Debug logging for dialog state
  React.useEffect(() => {
    console.log('🎯 TopicsList: Dialog state changed - isAddDialogOpen:', isAddDialogOpen);
  }, [isAddDialogOpen]);

  // Handle external trigger to open add dialog
  React.useEffect(() => {
    console.log('🎯 TopicsList: useEffect triggered - triggerAdd:', triggerAdd);
    if (triggerAdd) {
      console.log('🎯 TopicsList: triggerAdd is true, opening dialog...');
      setIsAddDialogOpen(true);
      console.log('🎯 TopicsList: setIsAddDialogOpen(true) called');
      console.log('🎯 TopicsList: Calling onTriggerAddReset...');
      onTriggerAddReset?.();
      console.log('🎯 TopicsList: onTriggerAddReset called');
    }
  }, [triggerAdd, onTriggerAddReset]);

  const {
    createTopic,
    updateTopic,
    deleteTopic,
    isCreatingTopic,
    isUpdatingTopic
  } = useClassesManagement();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planned':
        return <Badge variant="outline" className="text-gray-600"><Clock className="h-3 w-3 mr-1" />Planned</Badge>;
      case 'in_progress':
        return <Badge variant="outline" className="text-blue-600"><PlayCircle className="h-3 w-3 mr-1" />In Progress</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-600"><CheckCircle className="h-3 w-3 mr-1" />Completed</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAddTopic = async (topicData: TopicFormData) => {
    console.log('🎯 TopicsList: handleAddTopic called with data:', topicData);
    console.log('🎯 TopicsList: classId:', classId);
    
    try {
      console.log('🚀 TopicsList: Calling createTopic...');
      await createTopic(classId, topicData);
      console.log('✅ TopicsList: createTopic successful');
      
      toast.success('Topic created successfully!');
      setIsAddDialogOpen(false);
      
      console.log('🔄 TopicsList: Calling onTopicUpdate...');
      onTopicUpdate?.();
      console.log('✅ TopicsList: onTopicUpdate called');
    } catch (error) {
      console.error('❌ TopicsList: Error creating topic:', error);
      toast.error('Failed to create topic. Please try again.');
    }
  };

  const handleEditTopic = async (topicData: TopicFormData) => {
    if (!selectedTopic) return;
    
    try {
      await updateTopic(selectedTopic.id, topicData);
      toast.success('Topic updated successfully!');
      setIsEditDialogOpen(false);
      setSelectedTopic(null);
      onTopicUpdate?.();
    } catch (error) {
      console.error('Error updating topic:', error);
      toast.error('Failed to update topic. Please try again.');
    }
  };

  const handleDeleteTopic = async (topicId: string, topicName: string) => {
    if (window.confirm(`Are you sure you want to delete topic "${topicName}"? This action cannot be undone.`)) {
      try {
        await deleteTopic(topicId);
        toast.success('Topic deleted successfully!');
        onTopicUpdate?.();
      } catch (error) {
        console.error('Error deleting topic:', error);
        toast.error('Failed to delete topic. Please try again.');
      }
    }
  };

  const sortedTopics = [...topics].sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="space-y-4">
      {/* Only show topics UI when there are topics to display */}
      {sortedTopics.length > 0 && (
        <>
          {/* Add Topic Button */}
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setIsAddDialogOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Topic
            </Button>
          </div>

          {/* Topics List */}
          <div className="space-y-3">
            {sortedTopics.map((topic, index) => (
              <Card key={topic.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <div className="flex items-center mt-1">
                        <GripVertical className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-500 ml-1">#{index + 1}</span>
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium text-gray-900">{topic.name}</h4>
                          {getStatusBadge(topic.status)}
                        </div>
                        
                        {topic.description && (
                          <p className="text-sm text-gray-600 mb-2">{topic.description}</p>
                        )}
                        
                        <div className="text-xs text-gray-500">
                          Created: {new Date(topic.created_at).toLocaleDateString()}
                          {topic.updated_at !== topic.created_at && (
                            <span className="ml-2">
                              • Updated: {new Date(topic.updated_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                          onClick={() => {
                            setSelectedTopic(topic);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Topic
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          className="text-red-600"
                          onClick={() => handleDeleteTopic(topic.id, topic.name)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Topic
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {/* Add Topic Dialog - Always rendered so triggerAdd can open it */}
      <AddTopicDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        classId={classId}
        onSubmit={handleAddTopic}
        isLoading={isCreatingTopic}
      />

      {/* Edit Topic Dialog */}
      <EditTopicDialog
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false);
          setSelectedTopic(null);
        }}
        topic={selectedTopic}
        onSubmit={handleEditTopic}
        isLoading={isUpdatingTopic}
      />
    </div>
  );
}

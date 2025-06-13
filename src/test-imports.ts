// Test file to check imports and types
import { useClassesManagement, ClassData, Topic } from './hooks/useClassesManagement';

// Test that the hook import works
console.log('Hook import successful:', typeof useClassesManagement);

// Test that types are properly available (TypeScript compilation check)
const testClass: ClassData = {
  id: 'test',
  name: 'Test Class',
  section: 'A',
  description: 'Test Description',
  teacher_id: 'teacher1',
  teacher_name: 'Test Teacher',
  academic_year_id: 'year1',
  capacity: 30,
  total_students: 0,
  student_count: 0,
  total_topics: 0,
  topics: [],
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

const testTopic: Topic = {
  id: 'topic1',
  name: 'Test Topic',
  description: 'Test Topic Description',
  class_id: 'test',
  order_index: 1,
  status: 'planned',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

console.log('Types compilation test passed:', {
  class: testClass.name,
  topic: testTopic.name
});

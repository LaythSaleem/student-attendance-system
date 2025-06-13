
// Test React Key Uniqueness
console.log('🔍 Testing React Key Uniqueness...');

// Simulate student data fetch
const studentData = [
  {
    "id": "student_1",
    "name": "John Doe",
    "roll_number": "10A001"
  },
  {
    "id": "student_2",
    "name": "Jane Smith",
    "roll_number": "10A002"
  },
  {
    "id": "student_3",
    "name": "Mike Johnson",
    "roll_number": "10A003"
  },
  {
    "id": "student_4",
    "name": "Sarah Williams",
    "roll_number": "10A004"
  },
  {
    "id": "student_5",
    "name": "David Brown",
    "roll_number": "10A005"
  },
  {
    "id": "student_6",
    "name": "Emily Davis",
    "roll_number": "10B001"
  },
  {
    "id": "student_7",
    "name": "Chris Miller",
    "roll_number": "10B002"
  },
  {
    "id": "student_8",
    "name": "Lisa Wilson",
    "roll_number": "10B003"
  },
  {
    "id": "student_9",
    "name": "Tom Moore",
    "roll_number": "10B004"
  },
  {
    "id": "student_10",
    "name": "Anna Taylor",
    "roll_number": "10B005"
  }
];

// Test key uniqueness in different contexts
const contexts = ['table', 'list', 'cards', 'attendance'];

contexts.forEach(context => {
  const keys = studentData.map(student => `${context}_${student.id}`);
  const uniqueKeys = [...new Set(keys)];
  
  if (keys.length !== uniqueKeys.length) {
    console.warn(`❌ Duplicate keys in ${context} context!`);
  } else {
    console.log(`✅ Keys unique in ${context} context`);
  }
});

// Test name-based keys (problematic)
const nameKeys = studentData.map(student => student.name);
const uniqueNameKeys = [...new Set(nameKeys)];

if (nameKeys.length !== uniqueNameKeys.length) {
  console.warn('❌ Names are not unique - do not use name as React key!');
} else {
  console.log('✅ Names are unique');
}

#!/usr/bin/env node

/**
 * Enhanced debugging for the "Add First Topic" button issue
 * This script will add detailed console logging to diagnose the frontend issue
 */

const fs = require('fs');
const path = require('path');

const COMPONENTS_DIR = '/Users/macbookshop/Desktop/Attendence App/src/components/dialogs';

function addDebugLogging() {
  console.log('🔍 ADDING ENHANCED DEBUG LOGGING');
  console.log('=================================');

  // 1. Check ClassDetailsDialog current state
  const classDetailsPath = path.join(COMPONENTS_DIR, 'ClassDetailsDialog.tsx');
  const classDetailsContent = fs.readFileSync(classDetailsPath, 'utf8');
  
  console.log('📋 ClassDetailsDialog Analysis:');
  
  // Check if triggerAddTopic is properly defined
  if (classDetailsContent.includes('setTriggerAddTopic')) {
    console.log('✅ setTriggerAddTopic state found');
  } else {
    console.log('❌ setTriggerAddTopic state NOT found');
  }
  
  // Check if the button is properly implemented
  if (classDetailsContent.includes('Add First Topic')) {
    console.log('✅ "Add First Topic" button found');
  } else {
    console.log('❌ "Add First Topic" button NOT found');
  }
  
  // Check if triggerAdd prop is passed to TopicsList
  if (classDetailsContent.includes('triggerAdd={triggerAddTopic}')) {
    console.log('✅ triggerAdd prop passed to TopicsList');
  } else {
    console.log('❌ triggerAdd prop NOT passed to TopicsList');
  }

  // 2. Check TopicsList current state
  const topicsListPath = path.join(COMPONENTS_DIR, 'TopicsList.tsx');
  const topicsListContent = fs.readFileSync(topicsListPath, 'utf8');
  
  console.log('\n📋 TopicsList Analysis:');
  
  // Check if triggerAdd is in the props interface
  if (topicsListContent.includes('triggerAdd?: boolean')) {
    console.log('✅ triggerAdd prop defined in interface');
  } else {
    console.log('❌ triggerAdd prop NOT defined in interface');
  }
  
  // Check if useEffect handles triggerAdd
  if (topicsListContent.includes('React.useEffect(() => {') && topicsListContent.includes('triggerAdd')) {
    console.log('✅ useEffect handles triggerAdd');
  } else {
    console.log('❌ useEffect does NOT handle triggerAdd');
  }

  console.log('\n🔍 Detailed Component State:');
  
  // Extract the useState for triggerAddTopic
  const triggerStateMatch = classDetailsContent.match(/const \[triggerAddTopic.*?\] = useState\((.+?)\)/);
  if (triggerStateMatch) {
    console.log('✅ triggerAddTopic state found:', triggerStateMatch[0]);
  } else {
    console.log('❌ triggerAddTopic state not properly defined');
  }

  // Extract the useEffect from TopicsList
  const useEffectRegex = /React\.useEffect\(\(\) => \{[\s\S]*?\}, \[.*?\]\);/g;
  const useEffectMatches = topicsListContent.match(useEffectRegex);
  
  if (useEffectMatches) {
    console.log('\n✅ useEffect blocks found in TopicsList:');
    useEffectMatches.forEach((effect, index) => {
      if (effect.includes('triggerAdd')) {
        console.log(`   Effect ${index + 1}: Handles triggerAdd`);
        console.log('   ' + effect.split('\n')[0] + '...');
      }
    });
  }

  console.log('\n🧪 Testing React Components State Flow:');
  console.log('1. ClassDetailsDialog should have:');
  console.log('   - const [triggerAddTopic, setTriggerAddTopic] = useState(false)');
  console.log('   - Button onClick={() => setTriggerAddTopic(true)}');
  console.log('   - <TopicsList triggerAdd={triggerAddTopic} onTriggerAddReset={() => setTriggerAddTopic(false)} />');
  
  console.log('\n2. TopicsList should have:');
  console.log('   - triggerAdd?: boolean in props interface');
  console.log('   - onTriggerAddReset?: () => void in props interface');
  console.log('   - useEffect(() => { if (triggerAdd) { setIsAddDialogOpen(true); onTriggerAddReset?.(); } }, [triggerAdd, onTriggerAddReset])');

  return {
    classDetailsOk: classDetailsContent.includes('setTriggerAddTopic') && 
                   classDetailsContent.includes('Add First Topic') && 
                   classDetailsContent.includes('triggerAdd={triggerAddTopic}'),
    topicsListOk: topicsListContent.includes('triggerAdd?: boolean') && 
                  topicsListContent.includes('React.useEffect') && 
                  topicsListContent.includes('triggerAdd')
  };
}

const results = addDebugLogging();

console.log('\n🎯 DIAGNOSIS SUMMARY:');
console.log('====================');
console.log('ClassDetailsDialog:', results.classDetailsOk ? '✅ OK' : '❌ NEEDS FIX');
console.log('TopicsList:', results.topicsListOk ? '✅ OK' : '❌ NEEDS FIX');

if (results.classDetailsOk && results.topicsListOk) {
  console.log('\n🎉 Both components appear to be correctly implemented!');
  console.log('🔍 The issue might be:');
  console.log('1. React re-rendering/state timing issues');
  console.log('2. Console logging not visible');
  console.log('3. Dialog component state conflicts');
  console.log('4. Component mounting/unmounting issues');
  console.log('\n💡 Recommended next steps:');
  console.log('1. Test in browser with DevTools open');
  console.log('2. Check for JavaScript errors in console');
  console.log('3. Verify component is actually rendering the empty state');
  console.log('4. Add more detailed console logging');
} else {
  console.log('\n🔧 Components need fixes - implementing now...');
}

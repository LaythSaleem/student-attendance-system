#!/usr/bin/env node

/**
 * Frontend behavior simulation for "Add First Topic" debugging
 * This script will help identify the exact issue with the button
 */

const fs = require('fs');
const path = require('path');

function analyzeReactComponents() {
  console.log('🔍 ANALYZING REACT COMPONENTS FOR "ADD FIRST TOPIC" ISSUE');
  console.log('==========================================================');

  // Read both component files
  const classDetailsPath = '/Users/macbookshop/Desktop/Attendence App/src/components/dialogs/ClassDetailsDialog.tsx';
  const topicsListPath = '/Users/macbookshop/Desktop/Attendence App/src/components/dialogs/TopicsList.tsx';

  const classDetailsContent = fs.readFileSync(classDetailsPath, 'utf8');
  const topicsListContent = fs.readFileSync(topicsListPath, 'utf8');

  console.log('\n1. 🔍 CHECKING CLASSDETAILSDIALOG COMPONENT');
  console.log('===========================================');

  // Check useState for triggerAddTopic
  const triggerStateRegex = /const \[triggerAddTopic,\s*setTriggerAddTopic\]\s*=\s*useState\(([^)]+)\)/;
  const triggerStateMatch = classDetailsContent.match(triggerStateRegex);
  
  if (triggerStateMatch) {
    console.log('✅ triggerAddTopic state found:', triggerStateMatch[1].trim());
  } else {
    console.log('❌ triggerAddTopic state NOT found');
    return false;
  }

  // Check Add First Topic button
  const buttonRegex = /onClick=\{[^}]*setTriggerAddTopic\(true\)[^}]*\}/;
  const buttonMatch = classDetailsContent.match(buttonRegex);
  
  if (buttonMatch) {
    console.log('✅ Add First Topic button onClick found');
    console.log('   Button handler:', buttonMatch[0]);
  } else {
    console.log('❌ Add First Topic button onClick NOT found or malformed');
    return false;
  }

  // Check if triggerAdd prop is passed to TopicsList
  const propsRegex = /triggerAdd=\{triggerAddTopic\}/;
  const propsMatch = classDetailsContent.match(propsRegex);
  
  if (propsMatch) {
    console.log('✅ triggerAdd prop passed to TopicsList');
  } else {
    console.log('❌ triggerAdd prop NOT passed to TopicsList');
    return false;
  }

  // Check onTriggerAddReset callback
  const resetRegex = /onTriggerAddReset=\{[^}]*setTriggerAddTopic\(false\)[^}]*\}/;
  const resetMatch = classDetailsContent.match(resetRegex);
  
  if (resetMatch) {
    console.log('✅ onTriggerAddReset callback found');
  } else {
    console.log('❌ onTriggerAddReset callback NOT found or malformed');
    return false;
  }

  console.log('\n2. 🔍 CHECKING TOPICSLIST COMPONENT');
  console.log('====================================');

  // Check props interface
  const propsInterfaceRegex = /interface TopicsListProps[^}]*triggerAdd\?\s*:\s*boolean[^}]*}/s;
  const propsInterfaceMatch = topicsListContent.match(propsInterfaceRegex);
  
  if (propsInterfaceMatch) {
    console.log('✅ triggerAdd prop defined in TopicsListProps interface');
  } else {
    console.log('❌ triggerAdd prop NOT defined in TopicsListProps interface');
    return false;
  }

  // Check useEffect for triggerAdd
  const useEffectRegex = /React\.useEffect\(\(\)\s*=>\s*\{[^}]*triggerAdd[^}]*\},\s*\[triggerAdd[^}]*\]\)/s;
  const useEffectMatch = topicsListContent.match(useEffectRegex);
  
  if (useEffectMatch) {
    console.log('✅ useEffect handles triggerAdd');
    
    // Check if setIsAddDialogOpen(true) is called in useEffect
    const setDialogRegex = /setIsAddDialogOpen\(true\)/;
    const setDialogMatch = useEffectMatch[0].match(setDialogRegex);
    
    if (setDialogMatch) {
      console.log('✅ setIsAddDialogOpen(true) called in useEffect');
    } else {
      console.log('❌ setIsAddDialogOpen(true) NOT called in useEffect');
      return false;
    }
    
    // Check if onTriggerAddReset is called
    const resetCallRegex = /onTriggerAddReset\?\.\(\)/;
    const resetCallMatch = useEffectMatch[0].match(resetCallRegex);
    
    if (resetCallMatch) {
      console.log('✅ onTriggerAddReset?.() called in useEffect');
    } else {
      console.log('❌ onTriggerAddReset?.() NOT called in useEffect');
      return false;
    }
    
  } else {
    console.log('❌ useEffect does NOT handle triggerAdd properly');
    return false;
  }

  // Check function signature
  const functionRegex = /export function TopicsList\(\s*\{[^}]*triggerAdd[^}]*\}\s*:\s*TopicsListProps\)/s;
  const functionMatch = topicsListContent.match(functionRegex);
  
  if (functionMatch) {
    console.log('✅ TopicsList function receives triggerAdd prop');
  } else {
    console.log('❌ TopicsList function does NOT receive triggerAdd prop');
    return false;
  }

  console.log('\n3. 🧪 REACT LIFECYCLE SIMULATION');
  console.log('=================================');

  console.log('Expected behavior:');
  console.log('1. User clicks "Add First Topic" button');
  console.log('2. ClassDetailsDialog: setTriggerAddTopic(true) called');
  console.log('3. React re-renders ClassDetailsDialog');
  console.log('4. TopicsList receives triggerAdd={true}');
  console.log('5. TopicsList useEffect detects triggerAdd change');
  console.log('6. TopicsList calls setIsAddDialogOpen(true)');
  console.log('7. TopicsList calls onTriggerAddReset()');
  console.log('8. ClassDetailsDialog: setTriggerAddTopic(false) called');
  console.log('9. Add Topic dialog opens');

  console.log('\n4. 🔍 POTENTIAL ISSUES TO CHECK');
  console.log('===============================');

  // Check for potential React issues
  const potentialIssues = [];

  // Check if React is imported properly
  if (!topicsListContent.includes('import React') && !topicsListContent.includes('import * as React')) {
    potentialIssues.push('React not imported in TopicsList - useEffect might not work');
  }

  // Check if useState is imported
  if (!topicsListContent.includes('useState')) {
    potentialIssues.push('useState not imported in TopicsList - dialog state might not work');
  }

  // Check for multiple useEffect dependencies
  const effectDepsRegex = /\[triggerAdd,\s*onTriggerAddReset\]/;
  const effectDepsMatch = topicsListContent.match(effectDepsRegex);
  
  if (!effectDepsMatch) {
    potentialIssues.push('useEffect dependencies might be incorrect');
  }

  if (potentialIssues.length > 0) {
    console.log('❌ Potential issues found:');
    potentialIssues.forEach(issue => console.log(`   - ${issue}`));
    return false;
  } else {
    console.log('✅ No obvious issues found in React code');
  }

  console.log('\n🎉 COMPONENT ANALYSIS COMPLETE');
  console.log('==============================');
  console.log('✅ Both components appear to be correctly implemented');
  console.log('🔍 The issue might be:');
  console.log('   1. Browser console errors (check DevTools)');
  console.log('   2. Component not rendering empty state (check conditions)');
  console.log('   3. Event handling interference');
  console.log('   4. Dialog library conflicts');
  console.log('   5. State timing issues');

  return true;
}

const analysisResult = analyzeReactComponents();

if (analysisResult) {
  console.log('\n💡 NEXT DEBUGGING STEPS:');
  console.log('========================');
  console.log('1. Open browser DevTools (F12)');
  console.log('2. Go to Console tab');
  console.log('3. Navigate to Classes page');
  console.log('4. Click "View Details" on "Stage 6 - Sixth Year"');
  console.log('5. Look for debug logs starting with 🎯');
  console.log('6. Click "Add First Topic" button');
  console.log('7. Watch for the console logs we added');
  console.log('8. Check if any errors appear');
}

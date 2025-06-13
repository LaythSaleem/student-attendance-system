# 🏥 How to Access the Medical College System

## 🚀 **Quick Start Guide**

### **Step 1: Start the Application**
Run this command in your terminal:

```bash
cd "/Users/macbookshop/Desktop/Attendence App"
npm run dev:full
```

Or use the VS Code task:
- Press `Cmd+Shift+P`
- Type "Tasks: Run Task"
- Select "Start Full Stack Development"

### **Step 2: Access the Web Application**
Open your web browser and go to:
**http://localhost:8080**

### **Step 3: Login**
Use these credentials:
- **Email**: admin@school.com
- **Password**: admin123

---

## 🏥 **Navigating the Medical College System**

### **1. View Medical Stages**
After login:
1. Click on **"Classes"** in the sidebar
2. You'll see all 7 medical stages:
   - Stage 1 - First Year
   - Stage 2 - Second Year
   - Stage 3 - Third Year
   - Stage 4 - Fourth Year
   - Stage 5 - Fifth Year
   - Stage 6 - Sixth Year
   - Graduation - Final Year

### **2. View Stage Details & Topics**
For any medical stage:
1. Click the **"⋮"** (three dots) menu
2. Select **"View Details"**
3. You'll see:
   - Stage information
   - List of medical topics for that stage
   - Topic status (Planned, In Progress, Completed)

### **3. Manage Topics**
In the stage details:
- **Add Topic**: Click "Add Topic" button
- **Edit Topic**: Click "⋮" → "Edit Topic" on any topic
- **Delete Topic**: Click "⋮" → "Delete Topic" on any topic
- **Change Status**: Edit topic to change from Planned → In Progress → Completed

---

## 📚 **Medical Stages Overview**

### **Stage 1 - First Year** (Foundation)
- Human Anatomy
- Human Physiology
- Medical Biochemistry
- Medical Histology
- Medical Ethics
- Communication Skills
- Introduction to Clinical Medicine
- Basic Life Support (BLS)

### **Stage 2 - Second Year** (Basic Sciences)
- Pathology
- Pharmacology
- Microbiology
- Immunology
- Medical Genetics
- Epidemiology
- Biostatistics
- Research Methodology

### **Stage 3 - Third Year** (Clinical Foundation)
- Internal Medicine
- Surgery
- Pediatrics
- Obstetrics & Gynecology
- Psychiatry
- Dermatology
- Ophthalmology
- ENT (Otolaryngology)

### **Stage 4 - Fourth Year** (Advanced Clinical)
- Advanced Internal Medicine
- Advanced Surgery
- Emergency Medicine
- Radiology
- Anesthesiology
- Orthopedics
- Neurology
- Cardiology

### **Stage 5 - Fifth Year** (Specialized Training)
- Clinical Rotations
- Intensive Care Medicine
- Oncology
- Endocrinology
- Nephrology
- Gastroenterology
- Pulmonology
- Infectious Diseases

### **Stage 6 - Sixth Year** (Pre-Graduation)
- Advanced Clinical Rotations
- Medical Research Project
- Community Medicine
- Medical Administration
- Quality Assurance
- Patient Safety
- Medical Jurisprudence
- Preparation for Medical Licensing

### **Graduation - Final Year** (Degree Completion)
- Comprehensive Medical Examination
- Clinical Skills Assessment
- Medical Thesis Defense
- Professional Ethics Review
- Medical License Preparation
- Residency Application Process
- Career Planning
- Medical Oath Ceremony

---

## 👥 **Student Management**

### **Add Medical Students**
1. Go to **"Students"** section
2. Click **"Add Student"**
3. Fill in student details
4. Assign to appropriate medical stage

### **Enroll Students in Stages**
1. Go to student profile
2. Enroll in specific medical stage
3. Track progress through topics

---

## 👨‍🏫 **Faculty Management**

### **Assign Professors**
1. Go to **"Classes"** section
2. Edit any medical stage
3. Assign specific medical faculty
4. Update teacher information

---

## 📊 **Track Progress**

### **Monitor Topic Completion**
- View topic status for each stage
- Track student progress through curriculum
- Generate completion reports

### **Generate Reports**
- Student attendance per topic
- Stage completion rates
- Overall medical program progress

---

## 🛠 **Troubleshooting**

### **If the application doesn't start:**
1. Check if ports are available:
   ```bash
   lsof -i :3001  # Backend port
   lsof -i :8080  # Frontend port
   ```

2. Kill existing processes if needed:
   ```bash
   kill -9 <PID>
   ```

3. Restart the application:
   ```bash
   npm run dev:full
   ```

### **If you can't login:**
- Verify credentials: admin@school.com / admin123
- Check browser console for errors
- Ensure backend is running on port 3001

### **If stages don't appear:**
- Verify the medical college setup ran successfully
- Check browser console for API errors
- Refresh the page

---

## 🔧 **Advanced Operations**

### **Reset Medical College Data**
To reset or recreate the medical college system:
```bash
cd "/Users/macbookshop/Desktop/Attendence App"
node setup-medical-college.cjs
```

### **Verify System Status**
To check if everything is working:
```bash
cd "/Users/macbookshop/Desktop/Attendence App"
node verify-medical-college.js
```

### **Database Access**
To directly access the database:
```bash
cd "/Users/macbookshop/Desktop/Attendence App"
sqlite3 database.sqlite
```

---

## 📞 **Support URLs**

- **Frontend**: http://localhost:8080
- **Backend API**: http://localhost:3001/api
- **API Health Check**: http://localhost:3001/api/health

---

## 🎯 **Common Tasks**

### **Daily Operations**
1. ✅ View medical stages and topics
2. ✅ Add new medical topics to stages
3. ✅ Update topic completion status
4. ✅ Enroll new medical students
5. ✅ Track student progress

### **Administrative Tasks**
1. ✅ Manage medical faculty assignments
2. ✅ Generate progress reports
3. ✅ Update curriculum topics
4. ✅ Monitor system health

**The Medical College System is ready for use!** 🏥🎓

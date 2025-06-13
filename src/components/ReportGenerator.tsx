import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { 
  FileText, 
  Calendar, 
  Users, 
  TrendingUp, 
  BarChart3,
  PieChart,
  Loader2,
  Eye,
  FileSpreadsheet
} from 'lucide-react';

const API_BASE = 'https://scholar-track-pulse.onrender.com/api';

interface ReportGeneratorProps {
  userRole: 'admin' | 'teacher';
  teacherId?: string;
}

interface ReportSummary {
  [key: string]: any;
}

interface ReportData {
  summary: ReportSummary;
  data: any[];
}

const ReportGenerator: React.FC<ReportGeneratorProps> = ({ userRole, teacherId }) => {
  const [classes, setClasses] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  
  // Filter states
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedStudent, setSelectedStudent] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchDropdownData();
    setDefaultDates();
  }, []);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('auth_token');
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  };

  const setDefaultDates = () => {
    const today = new Date();
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    setEndDate(today.toISOString().split('T')[0]);
    setStartDate(lastWeek.toISOString().split('T')[0]);
  };

  const fetchDropdownData = async () => {
    try {
      const [classesRes, studentsRes] = await Promise.all([
        fetch(`${API_BASE}/classes`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE}/students`, { headers: getAuthHeaders() })
      ]);

      if (classesRes.ok) {
        const classesData = await classesRes.json();
        setClasses(classesData);
      }

      if (studentsRes.ok) {
        const studentsData = await studentsRes.json();
        setStudents(studentsData);
      }
    } catch (error) {
      console.error('Error fetching dropdown data:', error);
      toast.error('Failed to load form data');
    }
  };

  const generateReport = async (reportType: string) => {
    setLoading(true);
    try {
      let url = `${API_BASE}/reports/${reportType}`;
      const params = new URLSearchParams();

      // Add filters based on report type
      switch (reportType) {
        case 'daily-attendance':
          if (endDate) params.append('date', endDate);
          break;
        case 'weekly-attendance':
          if (startDate) params.append('startDate', startDate);
          if (endDate) params.append('endDate', endDate);
          break;
        case 'monthly-attendance':
          params.append('month', reportMonth.toString());
          params.append('year', reportYear.toString());
          break;
        case 'class-performance':
          if (startDate) params.append('startDate', startDate);
          if (endDate) params.append('endDate', endDate);
          break;
      }

      // Add common filters
      if (selectedClass) params.append('classId', selectedClass);
      if (teacherId && userRole === 'teacher') params.append('teacherId', teacherId);

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setReportData(data);
      setShowPreview(true);
      
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const generateStudentReport = async () => {
    if (!selectedStudent) {
      toast.error('Please select a student');
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const url = `${API_BASE}/reports/student-attendance/${selectedStudent}?${params.toString()}`;
      
      const response = await fetch(url, {
        headers: getAuthHeaders()
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setReportData(data);
      setShowPreview(true);
      
      toast.success('Student report generated successfully');
    } catch (error) {
      console.error('Error generating student report:', error);
      toast.error('Failed to generate student report');
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async () => {
    if (!reportData) return;

    try {
      // Create CSV content from report data
      const csvContent = convertToCSV(reportData.data);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      link.setAttribute('href', url);
      link.setAttribute('download', `report-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Failed to export report');
    }
  };

  const convertToCSV = (data: any[]): string => {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          return typeof value === 'string' && value.includes(',') 
            ? `"${value}"` 
            : value || '';
        }).join(',')
      )
    ].join('\n');
    
    return csvContent;
  };

  const renderReportPreview = () => {
    if (!reportData) return null;

    const { summary, data } = reportData;

    return (
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-6xl max-h-[80vh] overflow-auto">
          <DialogHeader>
            <DialogTitle>Report Preview</DialogTitle>
            <DialogDescription>
              Generated on {new Date().toLocaleDateString()}
            </DialogDescription>
          </DialogHeader>
          
          {/* Summary Section */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            {Object.entries(summary).map(([key, value]) => {
              if (typeof value === 'object') return null;
              return (
                <Card key={key}>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">
                      {typeof value === 'number' && key.includes('percentage') ? `${value}%` : value}
                    </div>
                    <p className="text-sm text-muted-foreground capitalize">
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Data Table */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Report Data</CardTitle>
              <div className="flex gap-2">
                <Button onClick={exportReport} size="sm">
                  <FileSpreadsheet className="h-4 w-4 mr-2" />
                  Export CSV
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto max-h-96">
                <Table>
                  <TableHeader>
                    <TableRow>
                      {data.length > 0 && Object.keys(data[0]).map(key => (
                        <TableHead key={key} className="capitalize">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.slice(0, 100).map((row, index) => (
                      <TableRow key={index}>
                        {Object.values(row).map((value: any, cellIndex) => (
                          <TableCell key={cellIndex}>
                            {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : value || '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {data.length > 100 && (
                  <p className="text-sm text-muted-foreground text-center mt-4">
                    Showing first 100 rows of {data.length} total records
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Report Generator
          </CardTitle>
          <CardDescription>
            Generate comprehensive attendance and performance reports
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="quick-reports" className="space-y-6">
        {userRole === 'teacher' ? (
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="quick-reports">Quick Reports</TabsTrigger>
            <TabsTrigger value="custom-reports">Custom Reports</TabsTrigger>
            <TabsTrigger value="student-reports">Student Reports</TabsTrigger>
          </TabsList>
        ) : (
          <TabsList className="grid w-full grid-cols-1">
            <TabsTrigger value="quick-reports">Quick Reports</TabsTrigger>
          </TabsList>
        )}

        {/* Quick Reports */}
        <TabsContent value="quick-reports" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => generateReport('daily-attendance')}>
              <CardContent className="p-6 text-center">
                <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-600" />
                <h3 className="font-semibold">Daily Report</h3>
                <p className="text-sm text-muted-foreground">Today's attendance</p>
                {loading && <Loader2 className="h-4 w-4 animate-spin mx-auto mt-2" />}
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => generateReport('weekly-attendance')}>
              <CardContent className="p-6 text-center">
                <TrendingUp className="h-8 w-8 mx-auto mb-2 text-green-600" />
                <h3 className="font-semibold">Weekly Summary</h3>
                <p className="text-sm text-muted-foreground">Last 7 days</p>
                {loading && <Loader2 className="h-4 w-4 animate-spin mx-auto mt-2" />}
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => generateReport('monthly-attendance')}>
              <CardContent className="p-6 text-center">
                <PieChart className="h-8 w-8 mx-auto mb-2 text-purple-600" />
                <h3 className="font-semibold">Monthly Report</h3>
                <p className="text-sm text-muted-foreground">Current month</p>
                {loading && <Loader2 className="h-4 w-4 animate-spin mx-auto mt-2" />}
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" 
                  onClick={() => generateReport('class-performance')}>
              <CardContent className="p-6 text-center">
                <Users className="h-8 w-8 mx-auto mb-2 text-orange-600" />
                <h3 className="font-semibold">Class Performance</h3>
                <p className="text-sm text-muted-foreground">All classes</p>
                {loading && <Loader2 className="h-4 w-4 animate-spin mx-auto mt-2" />}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Custom Reports - Teacher Only */}
        {userRole === 'teacher' && (
          <TabsContent value="custom-reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Custom Report Parameters</CardTitle>
                <CardDescription>Configure your report settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Date Range</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Input 
                        type="date" 
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                      />
                      <Input 
                        type="date" 
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Class</Label>
                    <Select value={selectedClass} onValueChange={setSelectedClass}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select class" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">All Classes</SelectItem>
                        {classes.map((cls) => (
                          <SelectItem key={cls.id} value={cls.id}>
                            {cls.name} - {cls.section}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Month/Year (for monthly reports)</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={reportMonth.toString()} onValueChange={(value) => setReportMonth(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => (
                            <SelectItem key={i + 1} value={(i + 1).toString()}>
                              {new Date(2024, i).toLocaleString('default', { month: 'long' })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select value={reportYear.toString()} onValueChange={(value) => setReportYear(parseInt(value))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 5 }, (_, i) => (
                            <SelectItem key={2024 + i} value={(2024 + i).toString()}>
                              {2024 + i}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 pt-4">
                  <Button 
                    onClick={() => generateReport('daily-attendance')}
                    disabled={loading}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Daily Report
                  </Button>
                  <Button 
                    onClick={() => generateReport('weekly-attendance')}
                    disabled={loading}
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Weekly Report
                  </Button>
                  <Button 
                    onClick={() => generateReport('monthly-attendance')}
                    disabled={loading}
                  >
                    <Calendar className="h-4 w-4 mr-2" />
                    Monthly Report
                  </Button>
                  <Button 
                    onClick={() => generateReport('class-performance')}
                    disabled={loading}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Class Performance
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Student Reports - Teacher Only */}
        {userRole === 'teacher' && (
          <TabsContent value="student-reports" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Individual Student Report</CardTitle>
                <CardDescription>Generate detailed attendance report for a specific student</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Student</Label>
                    <Select value={selectedStudent} onValueChange={setSelectedStudent}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select student" />
                      </SelectTrigger>
                      <SelectContent>
                        {students.map((student) => (
                          <SelectItem key={student.id} value={student.id}>
                            {student.name} ({student.rollNumber})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>

                <Button 
                  onClick={generateStudentReport}
                  disabled={loading || !selectedStudent}
                  className="w-full"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Eye className="h-4 w-4 mr-2" />
                  )}
                  Generate Student Report
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {renderReportPreview()}
    </div>
  );
};

export default ReportGenerator;

import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { GraduationCap, Users, BookOpen, BarChart } from "lucide-react";

const LandingPage = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: <Users className="h-8 w-8 text-blue-600" />,
      title: "Student Management",
      description: "Comprehensive student record management and enrollment tracking"
    },
    {
      icon: <GraduationCap className="h-8 w-8 text-green-600" />,
      title: "Attendance Tracking",
      description: "Real-time attendance monitoring with detailed analytics"
    },
    {
      icon: <BookOpen className="h-8 w-8 text-purple-600" />,
      title: "Exam Management",
      description: "Schedule exams, manage results, and track academic progress"
    },
    {
      icon: <BarChart className="h-8 w-8 text-orange-600" />,
      title: "Advanced Reports",
      description: "Generate comprehensive reports and insights for better decision making"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Scholar Track Pulse</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/admin-login')}>
                Sign In
              </Button>
              <Button onClick={() => navigate('/admin-login')}>
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-gray-900 mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Scholar Track Pulse
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            The most comprehensive Student Attendance Management System designed for modern educational institutions. 
            Streamline your administrative processes and focus on what matters most - education.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="text-lg px-8 py-4" onClick={() => navigate('/admin-login')}>
              Start Free Trial
            </Button>
            <Button variant="outline" size="lg" className="text-lg px-8 py-4">
              Watch Demo
            </Button>
          </div>
        </div>

        {/* Role Selection Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-blue-200 bg-white rounded-lg p-6 shadow-lg">
            <div className="text-center pb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <Users className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Admin Portal</h3>
              <p className="text-gray-600">Complete administrative control and system management</p>
            </div>
            <div className="text-center">
              <Button 
                onClick={() => navigate('/admin-login')}
                className="w-full text-lg py-3"
                size="lg"
              >
                Admin Login
              </Button>
            </div>
          </div>

          <div className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-green-200 bg-white rounded-lg p-6 shadow-lg">
            <div className="text-center pb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <GraduationCap className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Teacher Portal</h3>
              <p className="text-gray-600">Manage classes, track attendance, and monitor progress</p>
            </div>
            <div className="text-center">
              <Button 
                onClick={() => navigate('/teacher-login')}
                variant="outline"
                className="w-full text-lg py-3"
                size="lg"
              >
                Teacher Login
              </Button>
            </div>
          </div>

          <div className="group hover:shadow-xl transition-all duration-300 border-2 hover:border-purple-200 bg-white rounded-lg p-6 shadow-lg">
            <div className="text-center pb-4">
              <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <BookOpen className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900">Student Portal</h3>
              <p className="text-gray-600">Access attendance records and academic information</p>
            </div>
            <div className="text-center">
              <Button 
                variant="secondary"
                className="w-full text-lg py-3"
                size="lg"
                disabled
              >
                Coming Soon
              </Button>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {features.map((feature, index) => (
            <div key={index} className="text-center p-6 rounded-xl bg-white/60 backdrop-blur-sm border border-gray-200 hover:bg-white hover:shadow-lg transition-all">
              <div className="flex justify-center mb-4">
                {feature.icon}
              </div>
              <h4 className="text-lg font-semibold text-gray-900 mb-2">{feature.title}</h4>
              <p className="text-sm text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Stats Section */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 border border-gray-200 shadow-lg">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">Trusted by Educational Institutions</h2>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-blue-600 mb-2">1,000+</div>
              <div className="text-gray-600">Schools Using</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-green-600 mb-2">500K+</div>
              <div className="text-gray-600">Students Managed</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-600 mb-2">25K+</div>
              <div className="text-gray-600">Teachers Active</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-orange-600 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-400">
            © 2025 Scholar Track Pulse. Powered by SQLite • Built with React & TypeScript
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;

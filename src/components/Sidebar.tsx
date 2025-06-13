import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { 
  LayoutDashboard,
  Users, 
  GraduationCap,
  School,
  FileText,
  BarChart3,
  User,
  LogOut,
  Menu,
  Shield,
  Download
} from "lucide-react"

interface User {
  id: string;
  email: string;
  role?: string;
}

interface NavItem {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
}

interface SidebarProps {
  user: User;
  currentPage: string;
  onPageChange: (page: string) => void;
  onSignOut: () => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

const navigation: NavItem[] = [
  { id: 'overview', name: 'Overview', icon: LayoutDashboard },
  { id: 'students', name: 'Students', icon: Users },
  { id: 'teachers', name: 'Teachers', icon: GraduationCap },
  { id: 'classes', name: 'Classes', icon: School },
  { id: 'attendance-reports', name: 'Attendance & Reports', icon: BarChart3 },
  { id: 'generate-reports', name: 'Generate Reports', icon: Download },
  { id: 'exams', name: 'Exam Management', icon: FileText },
  { id: 'user-management', name: 'User Management', icon: Shield },
];

export function Sidebar({ user, currentPage, onPageChange, onSignOut, isCollapsed = false, onToggleCollapse }: SidebarProps) {
  const getRoleColor = (role?: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800 border-red-200';
      case 'teacher': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'student': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className={cn(
      "bg-white border-r border-gray-200 flex flex-col transition-all duration-300",
      isCollapsed ? "w-20" : "w-64"
    )}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="lg:hidden"
            >
              <Menu className="h-4 w-4" />
            </Button>
          )}
          {!isCollapsed && (
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Scholar Track</h1>
              <p className="text-sm text-gray-500">Pulse Admin</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6">
        <div className="space-y-2">
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = currentPage === item.id;
            
            return (
              <Button
                key={item.id}
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "w-full justify-start gap-3 h-12",
                  isActive && "bg-blue-600 hover:bg-blue-700 text-white",
                  !isActive && "text-gray-700 hover:bg-gray-100",
                  isCollapsed && "px-3"
                )}
                onClick={() => onPageChange(item.id)}
              >
                <Icon className={cn("h-5 w-5", isCollapsed && "mx-auto")} />
                {!isCollapsed && <span className="font-medium">{item.name}</span>}
              </Button>
            );
          })}
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              className={cn(
                "w-full gap-3 h-12",
                isCollapsed ? "px-3" : "justify-start"
              )}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-blue-100 text-blue-600 font-semibold">
                  {user.email.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {!isCollapsed && (
                <div className="flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {user.email}
                  </p>
                  <Badge 
                    variant="outline" 
                    className={cn("text-xs mt-1", getRoleColor(user.role))}
                  >
                    {user.role?.toUpperCase()}
                  </Badge>
                </div>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onSignOut} className="text-red-600">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

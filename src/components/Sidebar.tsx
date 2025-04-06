
import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Rocket, 
  FileText, 
  Users, 
  Database, 
  Settings,
  ChevronLeft,
  ChevronRight,
  LayoutGrid,
  MessageSquare,
  Sparkles,
  MemoryStick,
  Image
} from 'lucide-react';

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  to: string;
  isCollapsed: boolean;
}

const SidebarItem = ({ icon, label, to, isCollapsed }: SidebarItemProps) => (
  <NavLink 
    to={to} 
    className={({ isActive }) => 
      `sidebar-item ${isActive ? 'active' : ''} ${isCollapsed ? 'justify-center' : ''}`
    }
  >
    {icon}
    {!isCollapsed && <span>{label}</span>}
  </NavLink>
);

const Sidebar = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const isDev = location.pathname.startsWith('/dashboard-dev');
  const baseUrl = isDev ? '/dashboard-dev' : '/dashboard';

  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <aside 
      className={`bg-sidebar h-screen transition-all duration-300 flex flex-col ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div className={`p-4 flex ${isCollapsed ? 'justify-center' : 'justify-between'} items-center border-b border-sidebar-border`}>
        {!isCollapsed && <span className="text-lg font-semibold text-white">Pilot {isDev && "(DEV)"}</span>}
        <button 
          onClick={toggleSidebar} 
          className="p-1 rounded-md hover:bg-sidebar-accent transition-colors"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>
      
      <nav className="flex-1 p-3 space-y-2">
        <SidebarItem 
          icon={<Rocket size={20} />} 
          label="Pilot" 
          to={`${baseUrl}/pilot`} 
          isCollapsed={isCollapsed} 
        />
        <SidebarItem 
          icon={<Users size={20} />} 
          label="Agents" 
          to={`${baseUrl}/agents`} 
          isCollapsed={isCollapsed} 
        />
        <SidebarItem 
          icon={<LayoutGrid size={20} />} 
          label="Apps" 
          to={`${baseUrl}/apps`} 
          isCollapsed={isCollapsed} 
        />
        <SidebarItem 
          icon={<FileText size={20} />} 
          label="Builder" 
          to={`${baseUrl}/builder`} 
          isCollapsed={isCollapsed} 
        />
        <SidebarItem 
          icon={<Image size={20} />} 
          label="Images" 
          to={`${baseUrl}/images`} 
          isCollapsed={isCollapsed} 
        />
        <SidebarItem 
          icon={<MemoryStick size={20} />} 
          label="Memory" 
          to={`${baseUrl}/memory`} 
          isCollapsed={isCollapsed} 
        />
        <SidebarItem 
          icon={<MessageSquare size={20} />} 
          label="Chat" 
          to={`${baseUrl}/chat`} 
          isCollapsed={isCollapsed} 
        />
        <SidebarItem 
          icon={<Sparkles size={20} />} 
          label="Features" 
          to={`${baseUrl}/features`}
          isCollapsed={isCollapsed} 
        />
        <SidebarItem 
          icon={<Settings size={20} />} 
          label="Settings" 
          to={`${baseUrl}/settings`} 
          isCollapsed={isCollapsed} 
        />
      </nav>
      
      <div className="p-3 border-t border-sidebar-border">
        <div className={`text-xs text-muted-foreground ${isCollapsed ? 'text-center' : ''}`}>
          {!isCollapsed && 'AI Pilot Control'}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

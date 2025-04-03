
import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { 
  Home, 
  FileText, 
  Users, 
  ClipboardList, 
  Database, 
  Settings,
  ChevronLeft,
  ChevronRight
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
        {!isCollapsed && <span className="text-lg font-semibold text-white">Pilot</span>}
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
          icon={<Home size={20} />} 
          label="Dashboard" 
          to="/dashboard" 
          isCollapsed={isCollapsed} 
        />
        <SidebarItem 
          icon={<Users size={20} />} 
          label="Agents" 
          to="/dashboard/agents" 
          isCollapsed={isCollapsed} 
        />
        <SidebarItem 
          icon={<ClipboardList size={20} />} 
          label="Logs" 
          to="/dashboard/logs" 
          isCollapsed={isCollapsed} 
        />
        <SidebarItem 
          icon={<Database size={20} />} 
          label="Memory" 
          to="/dashboard/memory" 
          isCollapsed={isCollapsed} 
        />
        <SidebarItem 
          icon={<Settings size={20} />} 
          label="Settings" 
          to="/dashboard/settings" 
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

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useLocation, Link } from "react-router-dom";
import { agents } from "@/data/agents";
import { LEADER_EMAIL } from "@/lib/supabaseClient";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

export default function Sidebar({ className }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();
  const isLeader = user?.email === LEADER_EMAIL;

  return (
    <div className={cn("pb-12", className)}>
      <div className="space-y-4 py-4">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Dashboard
          </h2>
          <div className="space-y-1">
            <Button
              variant={location.pathname === "/dashboard" ? "default" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link to="/dashboard">Overview</Link>
            </Button>
            <Button
              variant={location.pathname === "/apps" ? "default" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link to="/apps">Apps</Link>
            </Button>
            <Button
              variant={location.pathname === "/memory" ? "default" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link to="/memory">Memory</Link>
            </Button>
            <Button
              variant={location.pathname === "/image-upload" ? "default" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link to="/image-upload">Image Upload</Link>
            </Button>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Builder
          </h2>
          <div className="space-y-1">
            <Button
              variant={location.pathname === "/builder" ? "default" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link to="/builder">App Builder</Link>
            </Button>
            <Button
              variant={location.pathname === "/chat" ? "default" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link to="/chat">Chat Builder</Link>
            </Button>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            AI Agents
          </h2>
          <div className="space-y-1">
            <ScrollArea className="h-[300px]">
              <div className="space-y-1">
                {agents.map((agent) => (
                  <Button
                    key={agent.id}
                    variant={
                      location.pathname === `/${agent.id}`
                        ? "default"
                        : "ghost"
                    }
                    className="w-full justify-start"
                    asChild
                  >
                    <Link to={`/${agent.id}`}>{agent.name}</Link>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Settings
          </h2>
          <div className="space-y-1">
            <Button
              variant={location.pathname === "/project" ? "default" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link to="/project">Project</Link>
            </Button>
            <Button
              variant={location.pathname === "/settings/api-keys" ? "default" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link to="/settings/api-keys">API Keys</Link>
            </Button>
            {isLeader && (
              <Button
                variant={location.pathname === "/settings/api" ? "default" : "ghost"}
                className="w-full justify-start"
                asChild
              >
                <Link to="/settings/api">API Settings</Link>
              </Button>
            )}
            <Button
              variant={location.pathname === "/settings/budget" ? "default" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link to="/settings/budget">Budget</Link>
            </Button>
            <Button
              variant={location.pathname === "/settings/developer" ? "default" : "ghost"}
              className="w-full justify-start"
              asChild
            >
              <Link to="/settings/developer">Developer</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

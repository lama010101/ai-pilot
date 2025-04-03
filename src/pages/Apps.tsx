
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Plus, FileText, ArrowRight } from "lucide-react";
import { AppSpecDB } from "@/lib/supabaseTypes";
import { getAppSpecs, createAppSpec } from "@/lib/supabaseService";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const Apps = () => {
  const [appSpecs, setAppSpecs] = useState<AppSpecDB[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newApp, setNewApp] = useState({
    name: "",
    description: "",
    content: ""
  });
  const navigate = useNavigate();

  const fetchApps = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await getAppSpecs();
      if (error) throw error;

      if (data) {
        setAppSpecs(data);
      }
    } catch (error) {
      console.error("Error fetching app specs:", error);
      toast.error("Failed to fetch app specifications");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, []);

  const handleCreateApp = async () => {
    try {
      if (!newApp.name.trim()) {
        toast.error("App name is required");
        return;
      }

      const { data, error } = await createAppSpec({
        name: newApp.name,
        description: newApp.description,
        content: newApp.content,
        status: 'draft',
        author_id: 'leader' // Using a fixed author for now
      });

      if (error) throw error;

      setDialogOpen(false);
      setNewApp({ name: "", description: "", content: "" });
      
      if (data) {
        toast.success("App specification created successfully");
        setAppSpecs([data, ...appSpecs]);
      }
    } catch (error) {
      console.error("Error creating app spec:", error);
      toast.error("Failed to create app specification");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'in_progress': return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-50 text-green-800 border-green-200';
      case 'deployed': return 'bg-purple-50 text-purple-800 border-purple-200';
      default: return 'bg-gray-50 text-gray-800 border-gray-200';
    }
  };

  const renderAppCard = (app: AppSpecDB) => {
    // Calculate a fake mission compliance score for UI
    const complianceScore = app.id.charCodeAt(0) % 30 + 70; // Random score between 70-100
    
    return (
      <Card key={app.id} className="h-full flex flex-col">
        <CardHeader>
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl">{app.name}</CardTitle>
            <Badge variant="outline" className={getStatusColor(app.status)}>
              {app.status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </Badge>
          </div>
          <CardDescription>{app.description}</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-sm font-medium">Mission Compliance</span>
                <span className="text-sm font-medium">{complianceScore}%</span>
              </div>
              <Progress value={complianceScore} indicatorClassName={`${complianceScore > 80 ? 'bg-green-500' : 'bg-amber-500'}`} />
            </div>
            <div className="text-sm text-muted-foreground">
              <p>Created: {new Date(app.created_at).toLocaleDateString()}</p>
              <p>Tasks: {Math.floor(Math.random() * 5) + 1}</p>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="ghost" className="w-full justify-between" onClick={() => navigate(`/dashboard/apps/${app.id}`)}>
            View Details <ArrowRight size={16} />
          </Button>
        </CardFooter>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Apps</h1>
          <p className="text-muted-foreground mt-1">
            Manage and monitor AI-generated applications
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New App
        </Button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : appSpecs.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {appSpecs.map(renderAppCard)}
        </div>
      ) : (
        <Card className="w-full py-16">
          <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
            <FileText size={48} className="text-muted-foreground" />
            <div>
              <h3 className="text-lg font-semibold">No Apps Yet</h3>
              <p className="text-muted-foreground">
                Create your first app specification to begin
              </p>
              <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" /> Create App
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create New App</DialogTitle>
            <DialogDescription>
              Define a new application specification for AI agents to build
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="app-name">App Name</Label>
              <Input
                id="app-name"
                value={newApp.name}
                onChange={(e) => setNewApp({...newApp, name: e.target.value})}
                placeholder="E.g., Zap, TaskMaster, etc."
              />
            </div>
            <div>
              <Label htmlFor="app-description">Short Description</Label>
              <Input
                id="app-description"
                value={newApp.description}
                onChange={(e) => setNewApp({...newApp, description: e.target.value})}
                placeholder="A brief description of the app"
              />
            </div>
            <div>
              <Label htmlFor="app-spec">Specification (Optional)</Label>
              <Textarea
                id="app-spec"
                value={newApp.content}
                onChange={(e) => setNewApp({...newApp, content: e.target.value})}
                placeholder="Initial specification details or leave blank for AI to generate"
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateApp}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Apps;

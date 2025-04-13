
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProjectSelectorProps {
  selectedProject: string;
  onProjectChange: (projectId: string) => void;
}

const ProjectSelector = ({ selectedProject, onProjectChange }: ProjectSelectorProps) => {
  // In a real implementation, we would fetch projects from the database
  const projects = [
    { id: 'guess-history', name: 'Guess History' },
    { id: 'zap', name: 'Zap App Builder' },
    { id: 'pilot', name: 'Pilot System' }
  ];

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium">Project</label>
      <Select 
        value={selectedProject} 
        onValueChange={onProjectChange}
      >
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select project" />
        </SelectTrigger>
        <SelectContent>
          {projects.map(project => (
            <SelectItem key={project.id} value={project.id}>
              {project.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

export default ProjectSelector;

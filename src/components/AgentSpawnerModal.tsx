import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Form, 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AGENT_ROLES, ZAP_SPEC_TEMPLATE } from "@/lib/supabaseTypes";
import { createAgent, createActivityLog, createAgentTask, generateAgentFromSpec } from "@/lib/supabaseService";
import { toast } from "sonner";

const formSchema = z.object({
  name: z.string().min(2, { message: "Name must be at least 2 characters." }),
  role: z.string().min(1, { message: "Please select a role." }),
  is_ephemeral: z.boolean().default(false),
  phase: z.number().int().min(1).max(10).default(1),
  spec: z.string().optional(),
});

interface AgentSpawnerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const AgentSpawnerModal = ({ open, onOpenChange, onSuccess }: AgentSpawnerModalProps) => {
  const [fromSpec, setFromSpec] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      role: "Writer",
      is_ephemeral: false,
      phase: 1,
      spec: "",
    },
  });
  
  const handleSpecToggle = (checked: boolean) => {
    setFromSpec(checked);
    if (checked) {
      form.setValue("spec", "");
    } else {
      form.setValue("spec", undefined);
    }
  };
  
  const handleUseZapTemplate = () => {
    form.setValue("spec", ZAP_SPEC_TEMPLATE);
  };
  
  const handleGenerateFromSpec = async () => {
    const spec = form.getValues("spec");
    if (!spec) {
      toast.error("Please enter a specification first");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await generateAgentFromSpec(spec);
      
      if (response.data) {
        form.setValue("name", response.data.name);
        form.setValue("role", response.data.role);
        form.setValue("is_ephemeral", response.data.is_ephemeral);
        form.setValue("phase", response.data.phase);
        toast.success("Agent configuration generated from spec");
      }
    } catch (error) {
      console.error("Error generating agent from spec:", error);
      toast.error("Failed to generate agent configuration");
    } finally {
      setIsLoading(false);
    }
  };
  
  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    setIsLoading(true);
    
    try {
      const { data: agent, error } = await createAgent({
        name: values.name,
        role: values.role,
        is_ephemeral: values.is_ephemeral,
        phase: values.phase,
      });
      
      if (error) throw error;
      
      if (agent) {
        await createActivityLog({
          agent_id: agent.id,
          action: "agent_created",
          summary: `${agent.name} (${agent.role}) was created`,
          status: "success"
        });
        
        if (fromSpec && values.spec) {
          const initialTask = values.spec.includes("Zap") ? 
            "Write full spec for Zap based on mission" : 
            `Process the following specification: ${values.spec.substring(0, 30)}...`;
            
          await createAgentTask({
            agent_id: agent.id,
            command: initialTask,
            result: "Pending execution",
            confidence: 0.8,
            status: "processing"
          });
        }
        
        toast.success(`Agent ${agent.name} created successfully`);
        
        form.reset();
        onOpenChange(false);
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error("Error creating agent:", error);
      toast.error("Failed to create agent");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Agent</DialogTitle>
          <DialogDescription>
            Configure a new AI agent to join your system.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="flex items-center space-x-2 mb-4">
              <Switch 
                id="from-spec" 
                checked={fromSpec} 
                onCheckedChange={handleSpecToggle} 
              />
              <Label htmlFor="from-spec">Generate from Spec</Label>
            </div>
            
            {fromSpec && (
              <div className="space-y-2">
                <FormField
                  control={form.control}
                  name="spec"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specification</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter app or agent specification..." 
                          className="min-h-[120px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormDescription>
                        <span 
                          className="text-primary cursor-pointer hover:underline" 
                          onClick={handleUseZapTemplate}
                        >
                          Use Zap Template
                        </span>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleGenerateFromSpec}
                  disabled={isLoading || !form.getValues("spec")}
                  className="w-full"
                >
                  Generate Agent Configuration
                </Button>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Agent name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AGENT_ROLES.map(role => (
                          <SelectItem key={role} value={role}>
                            {role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="phase"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phase</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min={1} 
                        max={10} 
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value))} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="is_ephemeral"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-end space-x-3 space-y-0 rounded-md border p-3">
                    <FormControl>
                      <Switch 
                        checked={field.value} 
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Ephemeral</FormLabel>
                      <FormDescription>
                        Terminates after task completion
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Agent"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AgentSpawnerModal;

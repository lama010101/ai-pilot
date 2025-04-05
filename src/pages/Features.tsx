
import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Code, Wrench, Rocket, Clipboard, Filter } from 'lucide-react';
import { 
  Form, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormControl, 
  FormDescription, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

// Define the feature request schema
const featureRequestSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  target: z.enum(["dev", "prod"])
});

type FeatureRequest = z.infer<typeof featureRequestSchema> & {
  id?: string;
  created_by?: string;
  created_at?: string;
  status?: "pending" | "in-progress" | "completed" | "rejected";
};

// Mock data for now, will be replaced with Supabase data
const mockFeatureRequests: FeatureRequest[] = [
  {
    id: "1",
    title: "Advanced Build History",
    description: "Add the ability to compare builds and show diffs between versions",
    target: "dev",
    created_by: "user@example.com",
    created_at: "2025-04-01T12:00:00Z",
    status: "in-progress"
  },
  {
    id: "2",
    title: "AI Agent Explorer",
    description: "Create a visual representation of agent interactions and their data paths",
    target: "prod",
    created_by: "user@example.com",
    created_at: "2025-04-02T15:30:00Z",
    status: "pending"
  },
  {
    id: "3",
    title: "Custom Agent Tools",
    description: "Allow users to define custom tools that agents can use during execution",
    target: "prod",
    created_by: "admin@example.com",
    created_at: "2025-04-03T09:15:00Z",
    status: "completed"
  }
];

const Features = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isDev = location.pathname.includes('dashboard-dev');
  
  const [featureRequests, setFeatureRequests] = useState<FeatureRequest[]>(mockFeatureRequests);
  const [filter, setFilter] = useState({
    showOnlyMine: false,
    target: "all",
    status: "all"
  });
  
  // Initialize form with the feature request schema
  const form = useForm<FeatureRequest>({
    resolver: zodResolver(featureRequestSchema),
    defaultValues: {
      title: "",
      description: "",
      // Default target to the opposite of current dashboard
      target: isDev ? "prod" : "dev"
    }
  });
  
  const onSubmit = (values: FeatureRequest) => {
    console.log("Submitting feature request:", values);
    
    // Create a new feature request
    const newFeatureRequest: FeatureRequest = {
      ...values,
      id: Date.now().toString(),
      created_by: user?.email || "anonymous",
      created_at: new Date().toISOString(),
      status: "pending"
    };
    
    // Add to state (would save to Supabase in real implementation)
    setFeatureRequests(prev => [newFeatureRequest, ...prev]);
    
    // Reset the form
    form.reset();
    
    // TODO: Save to Supabase feature_requests table
  };
  
  // Filter feature requests based on current filters
  const filteredFeatureRequests = featureRequests.filter(feature => {
    if (filter.showOnlyMine && feature.created_by !== user?.email) {
      return false;
    }
    
    if (filter.target !== "all" && feature.target !== filter.target) {
      return false;
    }
    
    if (filter.status !== "all" && feature.status !== filter.status) {
      return false;
    }
    
    return true;
  });
  
  // Status badge color mapping
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>;
      case "in-progress":
        return <Badge variant="default">In Progress</Badge>;
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };
  
  return (
    <>
      <Helmet>
        <title>Feature Development | AI Pilot {isDev ? 'DEV' : ''}</title>
      </Helmet>
      
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Sparkles className="h-7 w-7 text-amber-500" />
            Feature Development
          </h1>
          <p className="text-muted-foreground mt-1">
            Request and track new features for the AI Pilot system
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Feature Requests</CardTitle>
                  <CardDescription>
                    Browse and filter requested features
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex items-center gap-1"
                  >
                    <Filter className="h-4 w-4" />
                    {filter.showOnlyMine ? "Showing mine" : "Showing all"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4 mb-4">
                  <div>
                    <Label htmlFor="target-filter">Target</Label>
                    <Select 
                      value={filter.target} 
                      onValueChange={(value) => setFilter(prev => ({ ...prev, target: value }))}
                    >
                      <SelectTrigger id="target-filter" className="w-[150px]">
                        <SelectValue placeholder="Filter by target" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All targets</SelectItem>
                        <SelectItem value="dev">Development</SelectItem>
                        <SelectItem value="prod">Production</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="status-filter">Status</Label>
                    <Select 
                      value={filter.status} 
                      onValueChange={(value) => setFilter(prev => ({ ...prev, status: value }))}
                    >
                      <SelectTrigger id="status-filter" className="w-[150px]">
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All statuses</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="in-progress">In Progress</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => setFilter(prev => ({ ...prev, showOnlyMine: !prev.showOnlyMine }))}
                      className="flex items-center gap-1"
                    >
                      {filter.showOnlyMine ? "Show all" : "Show only mine"}
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-4">
                  {filteredFeatureRequests.length > 0 ? (
                    filteredFeatureRequests.map(feature => (
                      <div 
                        key={feature.id} 
                        className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{feature.title}</h3>
                            <Badge variant={feature.target === "dev" ? "outline" : "default"}>
                              {feature.target === "dev" ? "Development" : "Production"}
                            </Badge>
                            {getStatusBadge(feature.status || 'pending')}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{feature.description}</p>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>By: {feature.created_by}</span>
                          <span>
                            {new Date(feature.created_at || '').toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      No feature requests match your filters.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card>
              <CardHeader>
                <CardTitle>Request a Feature</CardTitle>
                <CardDescription>
                  Submit a new feature request for the AI Pilot system
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Feature Title</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter a descriptive title" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Describe the feature and its benefits..." 
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="target"
                      render={({ field }) => (
                        <FormItem className="space-y-3">
                          <FormLabel>Target Environment</FormLabel>
                          <FormControl>
                            <RadioGroup
                              onValueChange={field.onChange}
                              defaultValue={field.value}
                              className="flex flex-col space-y-1"
                            >
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="dev" id="target-dev" />
                                <Label htmlFor="target-dev">Development</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="prod" id="target-prod" />
                                <Label htmlFor="target-prod">Production</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormDescription>
                            Where should this feature be implemented?
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button type="submit" className="w-full">
                      Submit Request
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
};

export default Features;


import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface PlaceholderPageProps {
  title?: string;
  description?: string;
}

const PlaceholderPage = ({ 
  title = "Coming Soon", 
  description = "This feature is currently in development and will be available in a future update." 
}: PlaceholderPageProps) => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        <p className="text-muted-foreground mt-1">
          {description}
        </p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Under Development</CardTitle>
          <CardDescription>
            This module is part of the AI Pilot roadmap
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 border-4 border-dashed rounded-full border-muted animate-spin-slow"></div>
          <p className="mt-6 text-center max-w-md">
            Our AI team is currently working on this feature. Check back soon for updates.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PlaceholderPage;

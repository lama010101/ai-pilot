
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface AgentSpecViewerProps {
  agentId: string;
  spec?: string;
}

const AgentSpecViewer: React.FC<AgentSpecViewerProps> = ({ agentId, spec }) => {
  // Default spec for Image Agent if none is provided
  const defaultImageAgentSpec = `
# Image Agent Specification

## Purpose
Extracts metadata from images using OCR + AI.

## Capabilities
- Process ZIP files containing images
- Extract text and metadata using OCR techniques
- Match event images with their description images
- Parse metadata such as title, description, date, location, etc.
- Detect AI-generated vs. real images
- Prepare images for the EventGuess game

## Processing Pipeline
1. Accept two ZIP folders (event images and description images)
2. Remove duplicates and optimize images
3. Match images from both ZIPs
4. Extract metadata using OCR
5. Present results for human review
6. Store approved images and metadata in the database

## Technical Details
- Uses OCR technology for text extraction
- Implements image compression and optimization
- Stores data in Supabase tables and storage
- Provides a visual interface for reviewing and approving images
  `;

  // Map agent IDs to default specs
  const agentSpecs: Record<string, string> = {
    'image-agent': defaultImageAgentSpec,
    // Add other agent specs as needed
  };

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Agent Specification
          <Badge variant="outline" className="ml-2">
            {agentId === 'image-agent' ? 'OCR & AI' : 'General'}
          </Badge>
        </CardTitle>
        <CardDescription>
          Detailed technical specification for this agent
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] rounded-md border p-4">
          <pre className="text-sm whitespace-pre-wrap">
            {spec || agentSpecs[agentId] || 'No specification available for this agent.'}
          </pre>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default AgentSpecViewer;

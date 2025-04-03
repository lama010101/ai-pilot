
import React from 'react';
import { Helmet } from 'react-helmet';

const Greeting: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center p-8 bg-card rounded-lg shadow-lg">
        <Helmet>
          <title>Hello, World! | AI Pilot</title>
        </Helmet>
        <h1 className="text-4xl font-bold text-pilot-400 mb-4">
          Hello, World! 🌍
        </h1>
        <p className="text-muted-foreground">
          Welcome to the AI Pilot Greeting App
        </p>
      </div>
    </div>
  );
};

export default Greeting;

import { AlertTriangle } from "lucide-react";
import { Button } from "./button";

interface ErrorStateProps {
  title?: string;
  description?: string;
  retry?: () => void;
}

export function ErrorState({ 
  title = "Something went wrong", 
  description = "An unexpected error occurred while loading this section.",
  retry
}: ErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border p-8 text-center">
      <AlertTriangle className="h-10 w-10 text-destructive mb-4" />
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-2 max-w-md">
        {description}
      </p>
      {retry && (
        <Button variant="outline" className="mt-6" onClick={retry}>
          Try Again
        </Button>
      )}
    </div>
  );
}

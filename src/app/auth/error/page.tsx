import { Suspense } from "react";
import { AuthErrorContent } from "./error-content";

export default function AuthErrorPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center p-4">
          <div className="w-full max-w-md animate-pulse">
            <div className="h-8 bg-muted rounded w-1/2 mb-4" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        </div>
      }
    >
      <AuthErrorContent />
    </Suspense>
  );
}

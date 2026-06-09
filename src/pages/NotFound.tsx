import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5">
      <div className="text-center">
        <h1 className="mb-2 text-5xl font-bold text-primary tracking-tight">404</h1>
        <p className="mb-5 text-base text-muted-foreground">This page isn't part of your Blueprint.</p>
        <a href="/" className="text-sm font-medium text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;

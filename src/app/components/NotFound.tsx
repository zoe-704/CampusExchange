import { Link } from "react-router";
import { Button } from "./ui/button";
import { Home } from "lucide-react";

export function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-[#0A1E3C] mb-4">404</h1>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8 max-w-md">
          Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
        </p>
        <Link to="/dashboard">
          <Button className="bg-[#0A1E3C] hover:bg-[#050F1E]">
            <Home size={20} className="mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}
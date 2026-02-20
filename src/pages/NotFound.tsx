import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: "var(--gradient-soft)" }}
    >
      {/* Decorative Orbs */}
      <div className="orb orb-1" aria-hidden="true" />
      <div className="orb orb-2" aria-hidden="true" />

      <div className="text-center relative z-10 animate-scale-in">
        {/* Error Code */}
        <h1 className="text-8xl md:text-9xl font-display font-bold mb-6">
          <span className="text-gradient">404</span>
        </h1>

        {/* Message */}
        <p className="text-xl md:text-2xl text-muted-foreground mb-8">
          Oops! This page doesn't exist.
        </p>

        {/* Return Button */}
        <a
          href="/"
          className="btn-primary inline-flex items-center gap-2"
        >
          <Home className="w-5 h-5" />
          Return Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;

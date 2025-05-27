import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-black/10 py-6">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-black/60 mb-4 md:mb-0">
            &copy; {currentYear} ParkD Inc. All rights reserved.
          </p>
          <div className="flex space-x-6">
            <Link to="/" className="text-xs text-black/60 hover:text-black transition-colors">
              Home
            </Link>
            <a href="#about" className="text-xs text-black/60 hover:text-black transition-colors">
              About
            </a>
            <a href="#terms" className="text-xs text-black/60 hover:text-black transition-colors">
              Terms
            </a>
            <a href="#privacy" className="text-xs text-black/60 hover:text-black transition-colors">
              Privacy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
} 
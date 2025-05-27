import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from '@/components/ui/button';
import { 
  User, 
  LogOut, 
  Menu, 
  X, 
  Car, 
  AreaChart, 
  Layers, 
  MapPin, 
  ParkingCircle, 
  Settings,
  LayoutDashboard
} from 'lucide-react';

export default function Navbar() {
  const { currentUser, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();
  
  // Don't show redundant auth options if already on these pages
  const isAuthPage = location.pathname === '/signin' || location.pathname === '/signup';

  // Active link checker
  const isActive = (path: string) => location.pathname === path;

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Failed to log out", error);
    }
  };

  const getUserInitials = () => {
    if (!currentUser?.email) return "U";
    return currentUser.email.charAt(0).toUpperCase();
  };

  // Manage routes configuration for consistency
  const managementRoutes = [
    { path: '/zone-management', name: 'Zone Management', icon: <Layers className="mr-2 h-4 w-4" /> },
    { path: '/parking-management', name: 'Spots Management', icon: <MapPin className="mr-2 h-4 w-4" /> },
    { path: '/parking-layout', name: 'Parking Layout', icon: <ParkingCircle className="mr-2 h-4 w-4" /> },
    { path: '/vehicle-entry-exit', name: 'Entry/Exit', icon: <Car className="mr-2 h-4 w-4" /> },
    { path: '/reports', name: 'Reports', icon: <AreaChart className="mr-2 h-4 w-4" /> },
  ];

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-black/10">
      <div className="container mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center space-x-3">
          <Link to="/" className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center shadow-lg">
              <ParkingCircle className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-display font-semibold text-black">
              Parkd
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link 
            to="/"
            className={`text-sm font-medium transition-colors duration-200 ${isActive('/') ? 'text-black' : 'text-black/70 hover:text-black'}`}
          >
            Home
          </Link>
          
          {currentUser && (
            <>
              <Link 
                to="/dashboard"
                className={`text-sm font-medium flex items-center transition-colors duration-200 ${isActive('/dashboard') ? 'text-black' : 'text-black/70 hover:text-black'}`}
              >
                <LayoutDashboard className="mr-1 h-4 w-4" />
                Dashboard
              </Link>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="ghost" 
                    className={`text-sm font-medium flex items-center transition-colors duration-200 px-3 ${
                      managementRoutes.some(route => isActive(route.path)) 
                        ? 'text-black' 
                        : 'text-black/70 hover:text-black'
                    }`}
                  >
                    <Settings className="mr-1 h-4 w-4" />
                    Management
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-white border-black/10 w-56">
                  <DropdownMenuLabel className="text-xs text-black/50">Parking Management</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    {managementRoutes.map((route, index) => (
                      <DropdownMenuItem 
                        key={route.path} 
                        asChild 
                        className={`mb-1 ${isActive(route.path) ? 'bg-black/5' : ''} focus:bg-black focus:text-white`}
                      >
                        <Link to={route.path} className="flex items-center cursor-pointer">
                          {route.icon}
                          <span>{index + 1}. {route.name}</span>
                        </Link>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          
          <Link 
            to="/help"
            className={`text-sm font-medium transition-colors duration-200 ${isActive('/help') ? 'text-black' : 'text-black/70 hover:text-black'}`}
          >
            Help
          </Link>
        </nav>

        {/* Mobile menu button */}
        <div className="md:hidden">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="text-black"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>

        {/* Auth Buttons / User Menu - Desktop */}
        <div className="hidden md:flex items-center space-x-2">
          {currentUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full">
                  <Avatar>
                    <AvatarFallback className="bg-black text-white">{getUserInitials()}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white border-black/10 w-48">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="focus:bg-black focus:text-white">
                  <Link to="/dashboard" className="flex items-center cursor-pointer">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>Dashboard</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="flex items-center cursor-pointer focus:bg-black focus:text-white">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            !isAuthPage && (
              <>
                <Button 
                  variant="ghost" 
                  size="sm"
                  className="text-sm font-medium transition-all duration-200 hover:bg-black/5 text-black"
                  asChild
                >
                  <Link to="/signin">Sign In</Link>
                </Button>
                <Button 
                  size="sm"
                  className="text-sm font-medium bg-black hover:bg-black/90 transition-all duration-200 shadow-lg border-0 text-white"
                  asChild
                >
                  <Link to="/signup">Sign Up</Link>
                </Button>
              </>
            )
          )}
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-black/10">
          <div className="container mx-auto px-6 py-4 space-y-4">
            <Link 
              to="/"
              className={`block text-sm font-medium ${isActive('/') ? 'text-black' : 'text-black/70 hover:text-black'} transition-colors duration-200`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            
            {/* Auth options - Mobile */}
            {currentUser ? (
              <div className="pt-4 space-y-4 border-t border-black/10">
                <Link 
                  to="/dashboard" 
                  className={`flex items-center text-sm font-medium ${isActive('/dashboard') ? 'text-black' : 'text-black/70 hover:text-black'} transition-colors duration-200`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  Dashboard
                </Link>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    Management
                  </div>
                  <div className="pl-6 space-y-3 flex flex-col">
                    {managementRoutes.map((route, index) => (
                      <Link 
                        key={route.path}
                        to={route.path} 
                        className={`block text-sm ${isActive(route.path) ? 'text-black font-medium' : 'text-black/70 hover:text-black'} transition-colors duration-200`}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <span className="flex items-center">
                          {route.icon}
                          <span>{index + 1}. {route.name}</span>
                        </span>
                      </Link>
                    ))}
                  </div>
                </div>
                
                <Link 
                  to="/help"
                  className={`block text-sm font-medium ${isActive('/help') ? 'text-black' : 'text-black/70 hover:text-black'} transition-colors duration-200`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Help
                </Link>
                
                <button 
                  onClick={() => {
                    handleLogout();
                    setMobileMenuOpen(false);
                  }}
                  className="flex items-center text-sm font-medium text-black/70 hover:text-black transition-colors duration-200 mt-4"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign out
                </button>
              </div>
            ) : (
              !isAuthPage && (
                <div className="pt-4 flex flex-col space-y-2 border-t border-black/10">
                  <Link 
                    to="/help"
                    className={`block text-sm font-medium ${isActive('/help') ? 'text-black' : 'text-black/70 hover:text-black'} transition-colors duration-200`}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Help
                  </Link>
                  
                  <Link 
                    to="/signin"
                    className="block text-sm font-medium text-black/70 hover:text-black transition-colors duration-200"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign In
                  </Link>
                  <Link 
                    to="/signup"
                    className="block text-sm font-medium bg-black text-white px-4 py-2 rounded text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )
            )}
          </div>
        </div>
      )}
    </header>
  );
} 
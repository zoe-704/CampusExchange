import { Link, Outlet, useLocation, useNavigate } from "react-router";
import { Logo } from "./Logo";
import { Bell, Home, Search, PlusCircle, Package, Heart, MessageCircle, User, Menu, LogOut } from "lucide-react";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { useAuth } from "@/app/lib/auth";

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { profile, signOut, unreadMessageCount: unreadCount } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const navItems = [
    { to: "/dashboard", icon: Home, label: "Dashboard" },
    { to: "/browse", icon: Search, label: "Browse" },
    { to: "/create", icon: PlusCircle, label: "Post Item" },
    { to: "/my-listings", icon: Package, label: "My Listings" },
    { to: "/saved", icon: Heart, label: "Saved" },
    { to: "/messages", icon: MessageCircle, label: "Messages", badge: unreadCount },
    { to: "/profile", icon: User, label: "Profile" },
  ];

  const isActive = (path: string) => location.pathname === path;

  if (!profile) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/dashboard" className="flex items-center space-x-3">
              <Logo size={40} />
              <div>
                <h1 className="font-bold text-[#0A1E3C] text-lg">Campus Exchange</h1>
                <p className="text-xs text-gray-500">Menlo School</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.slice(0, 5).map((item) => {
                const Icon = item.icon;
                const active = isActive(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                      active
                        ? "bg-[#E8D5A1]/30 text-[#0A1E3C]"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <Icon size={18} />
                    <span className="text-sm font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge className="bg-[#D4AF37] text-[#0A1E3C] hover:bg-[#D4AF37]">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Right Side Icons */}
            <div className="flex items-center space-x-3">
              <Link to="/messages" className="relative p-2 text-gray-600 hover:text-[#0A1E3C] hidden md:block">
                <MessageCircle size={20} />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
                )}
              </Link>
              <Link to="/profile" className="relative p-2 text-gray-600 hover:text-[#0A1E3C] hidden md:block">
                <Bell size={20} />
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center space-x-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="w-8 h-8 bg-[#0A1E3C] rounded-full flex items-center justify-center text-white text-sm font-semibold">
                      {profile.full_name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-gray-700 hidden lg:block">{profile.full_name}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User size={16} className="mr-2" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleSignOut} className="text-red-600">
                    <LogOut size={16} className="mr-2" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Mobile Menu */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu size={24} />
                  </Button>
                </SheetTrigger>
                <SheetContent side="right" className="w-64">
                  <div className="flex flex-col space-y-4 mt-8">
                    {navItems.map((item) => {
                      const Icon = item.icon;
                      const active = isActive(item.to);
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                            active
                              ? "bg-[#E8D5A1]/30 text-[#0A1E3C]"
                              : "text-gray-600 hover:bg-gray-100"
                          }`}
                        >
                          <Icon size={20} />
                          <span className="font-medium">{item.label}</span>
                          {item.badge && (
                            <Badge className="ml-auto bg-[#D4AF37] text-[#0A1E3C] hover:bg-[#D4AF37]">
                              {item.badge}
                            </Badge>
                          )}
                        </Link>
                      );
                    })}
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-3 px-4 py-3 rounded-lg text-red-600 hover:bg-gray-100 transition-colors text-left"
                    >
                      <LogOut size={20} />
                      <span className="font-medium">Log out</span>
                    </button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Logo size={32} />
                <span className="font-bold text-[#0A1E3C]">Campus Exchange</span>
              </div>
              <p className="text-sm text-gray-600">
                A safe, verified marketplace for Menlo School students to exchange supplies.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Quick Links</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><Link to="/browse" className="hover:text-[#0A1E3C]">Browse Items</Link></li>
                <li><Link to="/create" className="hover:text-[#0A1E3C]">Post an Item</Link></li>
                <li><Link to="/my-listings" className="hover:text-[#0A1E3C]">My Listings</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Support</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#" className="hover:text-[#0A1E3C]">Help Center</a></li>
                <li><a href="#" className="hover:text-[#0A1E3C]">Safety Guidelines</a></li>
                <li><a href="#" className="hover:text-[#0A1E3C]">Report an Issue</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm text-gray-500">
            <p>&copy; 2026 Campus Exchange. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
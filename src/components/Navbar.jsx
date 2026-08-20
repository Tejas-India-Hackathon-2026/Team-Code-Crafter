import React, { useState } from 'react';
import {
  MapPin,
  Search,
  Bell,
  Mail,
  User,
  Shield,
  Briefcase,
  LogOut,
  ChevronDown,
  Sparkles,
  Menu,
  X,
  Compass,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { useLocation } from '../context/LocationContext';

export default function Navbar({
  onOpenLogin,
  onOpenRegisterCustomer,
  onOpenRegisterWorker,
  onOpenEmailLogs,
  onOpenNotifications,
  onNavigate,
  activePage,
  searchQuery,
  setSearchQuery,
  onOpenDemoSwitcher,
}) {
  const { user, role, isAuthenticated, isPendingWorker, logout, quickDemoLogin } = useAuth();
  const { unreadCount } = useNotification();
  const { currentLocation, coords, detectGPSLocation, isDetectingGPS, popularLocations, setPresetLocation } = useLocation();

  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          
          {/* Brand Logo */}
          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate('home')}
              className="flex items-center gap-2.5 group text-left focus:outline-none"
            >
              <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-aqua-600 to-aqua-400 flex items-center justify-center text-slate-950 font-black shadow-aqua-sm group-hover:scale-105 transition-transform">
                <span className="text-2xl leading-none">⚡</span>
              </div>
              <div>
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Worker<span className="text-aqua-600">Connect</span>
                </span>
                <span className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400 -mt-1">
                  Nearby Skilled Pros
                </span>
              </div>
            </button>

            {/* Location Selector Pill */}
            <div className="relative hidden lg:block">
              <button
                onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                className="flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-xs font-medium text-slate-700 transition"
              >
                <MapPin className="h-3.5 w-3.5 text-aqua-600 animate-bounce" />
                <span className="max-w-[150px] truncate">{currentLocation}</span>
                <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
              </button>

              {showLocationDropdown && (
                <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-xl p-3 z-50 animate-slide-up">
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Select Location
                    </span>
                    <button
                      onClick={() => {
                        detectGPSLocation();
                        setShowLocationDropdown(false);
                      }}
                      disabled={isDetectingGPS}
                      className="text-[11px] font-semibold text-aqua-700 hover:text-aqua-800 flex items-center gap-1"
                    >
                      <Compass className={`h-3 w-3 ${isDetectingGPS ? 'animate-spin' : ''}`} />
                      {isDetectingGPS ? 'Detecting...' : 'Use GPS'}
                    </button>
                  </div>
                  <div className="space-y-1 max-h-56 overflow-y-auto">
                    {popularLocations.map((loc) => (
                      <button
                        key={loc.name}
                        onClick={() => {
                          setPresetLocation(loc);
                          setShowLocationDropdown(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition ${
                          currentLocation === loc.name
                            ? 'bg-aqua-50 text-aqua-800 font-bold'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span>{loc.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{loc.pin}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Top Search Bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <div className="relative">
              <input
                type="text"
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search electrician, plumber, carpenter, city..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-aqua-500 focus:border-transparent transition"
              />
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-2.5 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Right Action Menu */}
          <div className="flex items-center gap-2.5 sm:gap-3.5">
            
            {/* Quick Demo Switcher Pill */}
            <button
              onClick={onOpenDemoSwitcher}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-xs font-semibold shadow-sm transition"
              title="Quick Demo Role Switcher"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-600" />
              <span>Demo Roles</span>
            </button>

            {/* Email Logs Button */}
            <button
              onClick={onOpenEmailLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
              title="View In-App Transactional Email Logs"
            >
              <Mail className="h-3.5 w-3.5 text-aqua-600" />
              <span className="hidden xl:inline">Live Emails</span>
            </button>

            {/* Notification Bell */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2.5 rounded-full hover:bg-slate-100 text-slate-600 transition"
              title="Notifications"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-4 w-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Navigation / Role Buttons */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(!showUserDropdown)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-slate-200 hover:border-slate-300 bg-white shadow-sm transition"
                >
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(user.fullName)}`}
                    alt={user.fullName}
                    className="h-7 w-7 rounded-full object-cover border border-aqua-400"
                  />
                  <div className="text-left hidden sm:block">
                    <span className="block text-xs font-bold text-slate-900 leading-tight max-w-[100px] truncate">
                      {user.fullName}
                    </span>
                    <span className="block text-[10px] font-semibold uppercase tracking-wider text-aqua-700">
                      {role}
                    </span>
                  </div>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </button>

                {showUserDropdown && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white border border-slate-200 shadow-2xl py-2 z-50 animate-slide-up">
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-xs text-slate-400 font-medium">Signed in as</p>
                      <p className="text-sm font-bold text-slate-900 truncate">{user.fullName}</p>
                      <p className="text-xs text-slate-500 truncate">{user.email}</p>
                      <span className={`mt-1.5 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        role === 'admin' ? 'bg-purple-100 text-purple-700' :
                        role === 'worker' ? (isPendingWorker ? 'bg-amber-100 text-amber-800' : 'bg-aqua-100 text-aqua-800') :
                        'bg-blue-100 text-blue-700'
                      }`}>
                        {role === 'worker' && isPendingWorker ? '⏳ Worker (Pending)' : role}
                      </span>
                    </div>

                    {/* Role specific links */}
                    {role === 'admin' && (
                      <button
                        onClick={() => {
                          onNavigate('admin');
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Shield className="h-4 w-4 text-purple-600" />
                        Admin Control Panel
                      </button>
                    )}

                    {role === 'worker' && (
                      <>
                        <button
                          onClick={() => {
                            onNavigate('worker-dashboard');
                            setShowUserDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Briefcase className="h-4 w-4 text-aqua-600" />
                          Worker Dashboard
                        </button>
                        <button
                          onClick={() => {
                            onNavigate('worker-profile');
                            setShowUserDropdown(false);
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <User className="h-4 w-4 text-slate-600" />
                          My Public Profile
                        </button>
                      </>
                    )}

                    {role === 'customer' && (
                      <button
                        onClick={() => {
                          onNavigate('customer-dashboard');
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                      >
                        <Briefcase className="h-4 w-4 text-aqua-600" />
                        Customer Dashboard & Bookings
                      </button>
                    )}

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={() => {
                        logout();
                        setShowUserDropdown(false);
                      }}
                      className="w-full text-left px-4 py-2 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={onOpenLogin}
                  className="px-4 py-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition"
                >
                  Sign In
                </button>
                <button
                  onClick={onOpenRegisterCustomer}
                  className="hidden sm:inline-flex px-4 py-2 rounded-full text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition"
                >
                  Join as Customer
                </button>
                <button
                  onClick={onOpenRegisterWorker}
                  className="px-4 py-2 rounded-full text-xs font-bold aqua-gradient-btn"
                >
                  Become a Worker
                </button>
              </div>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 md:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search & Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-slate-200 space-y-3">
            <div className="relative">
              <input
                type="text"
                value={searchQuery || ''}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search electrician, plumber, carpenter..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-50 border border-slate-200 text-sm text-slate-900"
              />
              <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              <button
                onClick={() => {
                  onNavigate('home');
                  setMobileMenuOpen(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-100 text-xs font-semibold text-slate-800"
              >
                Home
              </button>
              {isAuthenticated && role === 'customer' && (
                <button
                  onClick={() => {
                    onNavigate('customer-dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-aqua-100 text-xs font-semibold text-aqua-900"
                >
                  Customer Bookings
                </button>
              )}
              {isAuthenticated && role === 'worker' && (
                <button
                  onClick={() => {
                    onNavigate('worker-dashboard');
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-aqua-100 text-xs font-semibold text-aqua-900"
                >
                  Worker Dashboard
                </button>
              )}
              {isAuthenticated && role === 'admin' && (
                <button
                  onClick={() => {
                    onNavigate('admin');
                    setMobileMenuOpen(false);
                  }}
                  className="px-3 py-1.5 rounded-lg bg-purple-100 text-xs font-semibold text-purple-900"
                >
                  Admin Hub
                </button>
              )}
              <button
                onClick={() => {
                  onOpenDemoSwitcher();
                  setMobileMenuOpen(false);
                }}
                className="px-3 py-1.5 rounded-lg bg-amber-100 text-xs font-semibold text-amber-900"
              >
                ⚡ Switch Demo Roles
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

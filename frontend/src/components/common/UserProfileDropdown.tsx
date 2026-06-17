import React, { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Settings, LogOut, ChevronDown } from 'lucide-react';

interface UserProfileDropdownProps {
  setActiveTab: (tab: string) => void;
}

export const UserProfileDropdown: React.FC<UserProfileDropdownProps> = ({ setActiveTab }) => {
  const { user, logout } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Derive initials
  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : '??';

  // Role accents
  const roleAccent: Record<string, string> = {
    Admin: 'bg-violet-600',
    HOD: 'bg-teal-600',
    Coordinator: 'bg-blue-600',
    Faculty: 'bg-indigo-600',
  };
  const avatarColor = roleAccent[user?.role || ''] || 'bg-primary-600';

  // Role labels
  const roleLabel: Record<string, string> = {
    Admin: 'Administrator',
    HOD: 'Head of Department',
    Coordinator: 'Course Coordinator',
    Faculty: 'Faculty Member',
  };
  const getRoleLabel = () => {
    return roleLabel[user?.role || ''] || user?.role || 'User';
  };

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-surface-hover transition-colors text-left focus:outline-none focus:ring-2 focus:ring-primary-100 cursor-pointer"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-full ${avatarColor} text-white flex items-center justify-center text-xs font-bold flex-shrink-0 shadow-sm`}>
          {initials}
        </div>

        {/* User details: hidden on mobile */}
        <div className="hidden sm:block min-w-0 pr-1 select-none">
          <p className="text-xs font-bold text-text-primary leading-tight truncate">
            {user?.name || 'User'}
          </p>
          <p className="text-[9px] text-text-subtle font-semibold truncate mt-0.5 uppercase tracking-wide">
            {getRoleLabel()}
          </p>
        </div>

        {/* Dropdown chevron */}
        <ChevronDown className={`w-3.5 h-3.5 text-text-subtle transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-56 bg-white border border-border rounded-2xl shadow-card-lg z-50 overflow-hidden animate-fadeIn py-1"
          role="menu"
          aria-orientation="vertical"
        >
          {/* Header section in dropdown (for mobile accessibility) */}
          <div className="px-4 py-3 border-b border-border bg-slate-50/50 block sm:hidden">
            <p className="text-xs font-bold text-text-primary truncate">{user?.name || 'User'}</p>
            <p className="text-[9px] text-text-subtle font-semibold mt-0.5 uppercase tracking-wide">{getRoleLabel()}</p>
          </div>

          {/* Menu Items */}
          <button
            onClick={() => {
              setActiveTab('profile');
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-text-secondary hover:bg-surface-hover transition-colors text-left font-semibold cursor-pointer"
            role="menuitem"
          >
            <Settings className="w-4 h-4 text-text-subtle" />
            <span>Settings</span>
          </button>

          <button
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-red-650 hover:bg-red-50/40 transition-colors text-left font-semibold border-t border-border/60 cursor-pointer"
            role="menuitem"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

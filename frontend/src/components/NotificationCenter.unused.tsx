import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Bell, Search, Check, CheckSquare, ChevronLeft, ChevronRight, AlertTriangle, Info, CheckCircle2 } from 'lucide-react';

export const NotificationCenter: React.FC = () => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'All' | 'Course Updates' | 'Approval Status' | 'System'>('All');
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  // Fetch notifications
  const loadNotifications = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: 10,
        category: activeTab,
        search: searchQuery
      };
      if (selectedCourse) {
        params.courseId = selectedCourse;
      }
      const res = await api.notifications.list(params);
      setNotifications(res.notifications || []);
      setTotalPages(res.pages || 1);
      setTotalCount(res.total || 0);
      setUnreadCount(res.unreadCount || 0);
    } catch (err) {
      console.error('[NotificationCenter] Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch courses on mount for filter options
  useEffect(() => {
    const loadCourses = async () => {
      try {
        const res = await api.courses.list();
        setCourses(res.courses || []);
      } catch (err) {
        console.error('[NotificationCenter] Error loading courses:', err);
      }
    };
    loadCourses();
  }, []);

  // Reload notifications when filters or page changes
  useEffect(() => {
    loadNotifications();
  }, [page, activeTab, selectedCourse]);

  // Handle Search submit / trigger
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadNotifications();
  };

  // Mark single as read
  const handleMarkRead = async (id: string) => {
    try {
      await api.notifications.markRead(id);
      loadNotifications();
    } catch (err) {
      console.error('[NotificationCenter] Failed to mark read:', err);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      await api.notifications.markAllRead();
      loadNotifications();
    } catch (err) {
      console.error('[NotificationCenter] Failed to mark all read:', err);
    }
  };

  // Get relative time
  const getRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays === 1) return 'Yesterday';
    return `${diffDays} days ago`;
  };

  return (
    <div className="bg-white rounded-2xl border border-border shadow-sm overflow-hidden animate-fadeIn">
      {/* Header Panel */}
      <div className="p-6 border-b border-border bg-slate-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-50 border border-primary-100 flex items-center justify-center text-primary-600">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <span>Notification Center</span>
              {unreadCount > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-danger-50 text-danger-700 border border-danger-150 text-[10px] font-black">
                  {unreadCount} Unread
                </span>
              )}
            </h1>
            <p className="text-xs text-text-subtle font-medium mt-0.5">Manage curriculum workflow alerts, approvals, and system announcements.</p>
          </div>
        </div>
        
        {unreadCount > 0 && (
          <button 
            onClick={handleMarkAllRead}
            className="flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-50 border border-slate-350 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
          >
            <CheckSquare className="w-4 h-4 text-slate-500" />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Main Panel Content Split */}
      <div className="grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border">
        {/* Filters Sidebar */}
        <div className="p-5 space-y-5 lg:col-span-1 bg-slate-50/30">
          {/* Category Tabs */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-2 mb-2">Categories</span>
            {([
              { id: 'All', label: 'All Notifications' },
              { id: 'Course Updates', label: 'Course Updates' },
              { id: 'Approval Status', label: 'Approval Status' },
              { id: 'System', label: 'System Alerts' }
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setPage(1);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all border text-left cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-primary-50 border-primary-100 text-primary-750 font-bold'
                    : 'bg-transparent border-transparent text-text-muted hover:bg-surface-hover hover:text-text-secondary'
                }`}
              >
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Search form */}
          <form onSubmit={handleSearchSubmit} className="space-y-1.5 pt-2 border-t border-border/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-2">Search Text</span>
            <div className="relative">
              <input
                type="text"
                placeholder="Search alerts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-border rounded-xl pl-8 pr-3 py-2 text-xs outline-none bg-white font-semibold text-text-secondary focus:ring-1 focus:ring-primary-500 focus:border-primary-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </form>

          {/* Course filter select */}
          <div className="space-y-1.5 pt-2 border-t border-border/80">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block px-2">Filter by Course</span>
            <select
              value={selectedCourse}
              onChange={(e) => {
                setSelectedCourse(e.target.value);
                setPage(1);
              }}
              className="w-full border border-border rounded-xl p-2 text-xs font-semibold bg-white outline-none focus:ring-1 focus:ring-primary-500 text-text-secondary"
            >
              <option value="">All Courses</option>
              {courses.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.code} - {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Notifications Feed */}
        <div className="lg:col-span-3 flex flex-col min-h-[450px]">
          {loading ? (
            <div className="flex-1 flex items-center justify-center p-12 text-xs text-text-subtle font-medium">
              <span>Loading notifications...</span>
            </div>
          ) : notifications.length > 0 ? (
            <div className="flex-1 divide-y divide-slate-100">
              {notifications.map((noti) => {
                const IconComponent = noti.type === 'success' ? CheckCircle2 : noti.type === 'warning' ? AlertTriangle : Info;
                const iconColor = noti.type === 'success' ? 'text-success-600 bg-success-50 border-success-100' :
                                  noti.type === 'warning' ? 'text-warning-600 bg-warning-50 border-warning-100' :
                                  'text-primary-600 bg-primary-50 border-primary-100';

                return (
                  <div 
                    key={noti._id} 
                    className={`p-5 flex items-start gap-4 transition-all relative group border-l-2 ${
                      !noti.isRead ? 'border-primary-600 bg-primary-50/5' : 'border-transparent bg-white'
                    }`}
                  >
                    {/* Unread circle */}
                    {!noti.isRead && (
                      <span className="absolute top-6 right-6 w-2 h-2 rounded-full bg-primary-600" />
                    )}

                    {/* Icon container */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center border flex-shrink-0 ${iconColor}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>

                    {/* Details content */}
                    <div className="flex-1 space-y-1 pr-6">
                      <div className="flex flex-wrap items-baseline gap-2">
                        <h4 className="font-bold text-slate-800 text-sm leading-snug">{noti.title}</h4>
                        <span className="text-[10px] text-text-muted font-mono font-medium">{getRelativeTime(noti.createdAt)}</span>
                      </div>
                      
                      <p className="text-xs text-text-secondary leading-relaxed font-medium">{noti.description}</p>
                      
                      <div className="flex flex-wrap items-center gap-2 pt-2">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200`}>
                          {noti.category}
                        </span>
                        
                        {noti.courseId && (
                          <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold bg-primary-50 text-primary-700 border border-primary-100">
                            {noti.courseId.code}
                          </span>
                        )}
                        
                        {!noti.isRead && (
                          <button
                            onClick={() => handleMarkRead(noti._id)}
                            className="hidden group-hover:inline-flex items-center gap-1 text-[10px] text-primary-650 hover:text-primary-750 font-bold hover:underline bg-transparent border-0 cursor-pointer ml-auto"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark as read</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center text-text-subtle space-y-2">
              <span className="text-4xl">📭</span>
              <h3 className="font-bold text-slate-700 text-sm">No notifications found</h3>
              <p className="text-xs max-w-md font-medium">Try broadening your search criteria or switching to another category filter tab.</p>
            </div>
          )}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="p-4 border-t border-border flex items-center justify-between bg-slate-50/30">
              <span className="text-xs font-semibold text-text-muted">
                Showing page <strong className="text-slate-800">{page}</strong> of <strong className="text-slate-800">{totalPages}</strong> ({totalCount} items)
              </span>
              
              <div className="flex gap-2">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="p-1.5 border border-border rounded-lg bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="w-4 h-4 text-slate-650" />
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="p-1.5 border border-border rounded-lg bg-white hover:bg-slate-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  aria-label="Next page"
                >
                  <ChevronRight className="w-4 h-4 text-slate-650" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, CalendarDays, HelpCircle, Bell, LogOut, ChevronDown, Shield } from 'lucide-react';
import { formatDate, formatTime } from '../../utils/helpers';
import { useAuth } from '../../context/AuthContext';

const Header = ({ searchQuery, setSearchQuery }) => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const displayName = user?.name || 'Administrator';
  const displayEmail = user?.email || 'admin@gmail.com';
  const displayInitials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header
      style={{
        height: '52px',
        background: '#ffffff',
        borderBottom: '1px solid #e8ecef',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
        gap: '20px',
      }}
    >
      {/* Left Side (Search) */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '32px', flex: 1 }}>
        
        {/* Search Bar */}
        <div style={{ position: 'relative', width: '260px' }}>
          <Search
            style={{
              position: 'absolute',
              left: '10px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '14px',
              height: '14px',
              color: '#adb5bd',
            }}
            strokeWidth={1.8}
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery && setSearchQuery(e.target.value)}
            placeholder="Search customer, product or item..."
            style={{
              width: '100%',
              background: '#f4f6f8',
              border: '1px solid #e8ecef',
              borderRadius: '20px',
              padding: '6px 12px 6px 30px',
              fontSize: '12px',
              color: '#495057',
              outline: 'none',
            }}
            onFocus={e => {
              e.target.style.borderColor = '#3a6878';
              e.target.style.boxShadow = '0 0 0 3px rgba(58,104,120,0.1)';
            }}
            onBlur={e => {
              e.target.style.borderColor = '#e8ecef';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Date & Time */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#f3f4f6',
            borderRadius: '10px',
            padding: '4px 10px',
          }}
        >
          <Calendar style={{ width: '18px', height: '18px', color: '#2563eb' }} strokeWidth={2} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 500, color: '#111827', lineHeight: 1.1 }}>
              {formatDate(currentTime)}
            </div>
            <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: 1.1, marginTop: '2px' }}>
              {formatTime(currentTime)}
            </div>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <linearGradient id="calendarGradient" x1="0" y1="0" x2="24" y2="24" gradientUnits="userSpaceOnUse">
            <stop stopColor="#ff3344" offset="0%" />
            <stop stopColor="#a044b7" offset="100%" />
          </linearGradient>
        </svg>

        {/* Calendar Icon */}
        <button
          onClick={() => navigate('/calendar')}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            padding: '4px',
            borderRadius: '6px',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.8'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          <CalendarDays style={{ width: '24px', height: '24px' }} color="url(#calendarGradient)" strokeWidth={2.2} />
        </button>

        {/* Help Icon */}
        <button
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#1a233a',
            display: 'flex',
            alignItems: 'center',
            padding: '4px',
            borderRadius: '6px',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#343a40'}
          onMouseLeave={e => e.currentTarget.style.color = '#1a233a'}
        >
          <HelpCircle style={{ width: '22px', height: '22px' }} strokeWidth={2.2} />
        </button>

        {/* Bell Icon */}
        <button
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#1a233a',
            display: 'flex',
            alignItems: 'center',
            padding: '4px',
            borderRadius: '6px',
            position: 'relative',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#343a40'}
          onMouseLeave={e => e.currentTarget.style.color = '#1a233a'}
        >
          <Bell style={{ width: '22px', height: '22px' }} strokeWidth={2.2} />
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '4px',
              width: '10px',
              height: '10px',
              background: '#fff',
              borderRadius: '50%',
              border: '2.5px solid #ff3344',
            }}
          />
        </button>

        {/* Divider
        <div style={{ width: '1px', height: '24px', background: '#e8ecef' }} /> */}

        {/* User Profile with Dropdown */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <div
            onClick={() => setShowDropdown(!showDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '8px',
              transition: 'background 0.2s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f8f9fa')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ff7a59 0%, #d54a88 50%, #402de8 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
                boxShadow: '0 2px 8px rgba(213, 74, 136, 0.25)',
              }}
            >
              {displayInitials}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', lineHeight: 1.2 }}>
                {displayName}
              </div>
              <div style={{ fontSize: '11px', color: '#64748b', lineHeight: 1.2 }}>
                {displayEmail}
              </div>
            </div>
            <ChevronDown
              style={{
                width: '14px',
                height: '14px',
                color: '#64748b',
                transition: 'transform 0.2s',
                transform: showDropdown ? 'rotate(180deg)' : 'none',
              }}
            />
          </div>

          {/* Profile Dropdown Menu */}
          {showDropdown && (
            <div
              style={{
                position: 'absolute',
                right: 0,
                top: 'calc(100% + 8px)',
                width: '240px',
                background: '#ffffff',
                borderRadius: '12px',
                boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)',
                border: '1px solid #e2e8f0',
                padding: '8px',
                zIndex: 100,
              }}
            >
              <div style={{ padding: '8px 12px', borderBottom: '1px solid #f1f5f9' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                  {displayName}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  {displayEmail}
                </div>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '2px 8px',
                    borderRadius: '9999px',
                    background: 'linear-gradient(135deg, rgba(255,122,89,0.12) 0%, rgba(213,74,136,0.12) 50%, rgba(64,45,232,0.12) 100%)',
                    color: '#d54a88',
                    fontSize: '10px',
                    fontWeight: 700,
                    marginTop: '6px',
                  }}
                >
                  <Shield style={{ width: '10px', height: '10px' }} />
                  {user?.role || 'Administrator'}
                </div>
              </div>

              <div style={{ padding: '4px 0' }}>
                <button
                  onClick={handleLogout}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '8px 12px',
                    background: 'none',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '13px',
                    fontWeight: 500,
                    color: '#ef4444',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#fef2f2')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
                >
                  <LogOut style={{ width: '16px', height: '16px' }} />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

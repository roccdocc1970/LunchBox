/**
 * App Domain
 *
 * Static constants for the top-level app shell.
 */

export const NAV_GROUPS = [
  { key: 'academics', label: 'Academics', items: [
    { id: 'attendance',  label: 'Attendance',     icon: '📅' },
    { id: 'admissions',  label: 'Admissions',     icon: '📬' },
    { id: 'enrollment',  label: 'Enrollment',     icon: '📋' },
    { id: 'students',    label: 'Students',       icon: '🎒' },
    { id: 'classes',     label: 'Classes',        icon: '📚' },
    { id: 'schedule',    label: 'Schedule',       icon: '📅' },
    { id: 'reportcards', label: 'Report Cards',   icon: '📝' },
    { id: 'parents',     label: 'Parents',        icon: '👨‍👩‍👧' },
  ]},
  { key: 'people', label: 'People', items: [
    { id: 'staff',  label: 'Staff',  icon: '👩‍🏫' },
    { id: 'alumni', label: 'Alumni', icon: '🎓' },
  ]},
  { key: 'operations', label: 'Operations', items: [
    { id: 'fundraising', label: 'Fundraising', icon: '💰' },
    { id: 'facilities',  label: 'Facilities',  icon: '🔧' },
    { id: 'rooms',       label: 'Rooms',        icon: '🚪' },
  ]},
  { key: 'communicate', label: 'Communicate', items: [
    { id: 'messages', label: 'Messages',          icon: '✉️' },
    { id: 'reports',  label: 'Report Dashboards', icon: '📊' },
  ]},
]

export const QUICK_ACTIONS = [
  { label: 'New Enrollment',     icon: '➕', colorKey: 'primary', page: 'enrollment' },
  { label: 'Send Message',       icon: '✉️', color: '#3b82f6',   page: 'messages'   },
  { label: 'View Students',      icon: '🎒', color: '#8b5cf6',   page: 'students'   },
  { label: 'Report Dashboards',  icon: '📊', color: '#10b981',   page: 'reports'    },
]

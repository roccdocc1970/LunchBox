/**
 * App Domain
 *
 * Static constants for the top-level app shell.
 */

export const NAV_GROUPS = [
  { key: 'academics', label: 'Academics', items: [
    { id: 'admissions',  label: 'Admissions',        icon: 'ClipboardList' },
    { id: 'enrollment',  label: 'School Enrollment', icon: 'UserPlus' },
    { id: 'students',    label: 'Students',          icon: 'Users' },
    { id: 'classes',     label: 'Classes',           icon: 'BookOpen' },
    { id: 'cohorts',     label: 'Cohorts',           icon: 'UsersRound' },
    { id: 'schedule',    label: 'Schedule',          icon: 'CalendarDays' },
    { id: 'attendance',  label: 'Attendance',        icon: 'ClipboardCheck' },
    { id: 'reportcards', label: 'Report Cards',      icon: 'FileText' },
  ]},
  { key: 'people', label: 'People', items: [
    { id: 'staff',   label: 'Staff',   icon: 'Briefcase' },
    { id: 'parents', label: 'Parent Directory', icon: 'Heart' },
    { id: 'alumni',  label: 'Alumni',  icon: 'Award' },
  ]},
  { key: 'operations', label: 'Operations', items: [
    { id: 'fundraising', label: 'Fundraising',       icon: 'HeartHandshake' },
    { id: 'facilities',  label: 'Facility Requests', icon: 'Wrench' },
  ]},
  { key: 'communicate', label: 'Communicate', items: [
    { id: 'messages', label: 'Messages',          icon: 'MessageSquare' },
    { id: 'reports',  label: 'Report Dashboards', icon: 'BarChart3' },
  ]},
]

export const SETUP_STEPS = [
  { id: 'profile',     label: 'Complete your school profile',  page: 'settings',    done: (counts, school) => !!(school?.principal_name || school?.address) },
  { id: 'staff',       label: 'Add your first staff member',   page: 'staff',       done: (counts)         => counts.staff > 0 },
  { id: 'admissions',  label: 'Log your first inquiry',        page: 'admissions',  done: (counts)         => counts.admissions > 0 },
  { id: 'students',    label: 'Enroll your first student',     page: 'enrollment',  done: (counts)         => counts.students > 0 },
  { id: 'classes',     label: 'Create your first class',       page: 'classes',     done: (counts)         => counts.classes > 0 },
  { id: 'schedule',    label: 'Build your schedule',           page: 'schedule',    done: (counts)         => counts.schedule > 0 },
  { id: 'reportcards', label: 'Issue your first report card',  page: 'reportcards', done: (counts)         => counts.reportcards > 0 },
]

export const QUICK_ACTIONS = [
  { label: 'New Enrollment',     icon: 'UserPlus',   colorKey: 'primary', page: 'enrollment' },
  { label: 'Send Message',       icon: 'MessageSquare', color: '#3b82f6', page: 'messages'   },
  { label: 'View Students',      icon: 'Users',      color: '#8b5cf6',   page: 'students'   },
  { label: 'Report Dashboards',  icon: 'BarChart3',  color: '#10b981',   page: 'reports'    },
]

/**
 * Icons Domain
 *
 * Generalizes the name-string -> component pattern already used in
 * domain/facilities.js (CATEGORY_ICONS) + Facilities.jsx (CatIcon) into a
 * single registry, for the generative view templates — a chat-generated
 * view spec carries an icon NAME string, never a component, and that name
 * might not exist in the registry (a hallucinated or unrecognized name).
 */

import {
  Users, BookOpen, FileText, AlertTriangle, ClipboardCheck, Heart, HeartHandshake,
  GraduationCap, Wrench, Mail, Star, Repeat, Calendar, Award, Briefcase,
  ClipboardList, UserPlus, CalendarDays, MessageSquare, BarChart3, Backpack,
} from 'lucide-react'

export const ICON_COMPONENTS = {
  Users, BookOpen, FileText, AlertTriangle, ClipboardCheck, Heart, HeartHandshake,
  GraduationCap, Wrench, Mail, Star, Repeat, Calendar, Award, Briefcase,
  ClipboardList, UserPlus, CalendarDays, MessageSquare, BarChart3, Backpack,
}

/** Resolves an icon name string to its component, falling back safely for an unrecognized name. */
export function resolveIcon(name, fallback = FileText) {
  return ICON_COMPONENTS[name] || fallback
}

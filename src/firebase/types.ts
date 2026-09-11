export type UserRole = 'admin' | 'faculty' | 'user';

export interface SchoolInfo {
  name: string;
  tagline: string;
  description: string;
  address: string;
  phone: string;
  email: string;
  logoUrl: string;
  heroImageUrl: string;
  campusImages: string[];
  principalName: string;
  principalMessage: string;
  principalImageUrl: string;
  foundedYear: string;
  totalStudents: string;
  totalTeachers: string;
  totalCourses: string;
}

export interface Teacher {
  id: string;
  name: string;
  designation: string;
  subject: string;
  qualification: string;
  bio: string;
  imageUrl: string;
  email: string;
  phone: string;
  order: number;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
}

export interface SchoolEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  location: string;
  imageUrl: string;
}

export interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string;
  role: UserRole;
  lastLoginAt: string;
  createdAt: string;
}

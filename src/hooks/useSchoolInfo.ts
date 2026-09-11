import { useState, useEffect } from 'react';
import { fetchSchoolInfo } from '@/firebase/firestore';
import type { SchoolInfo } from '@/firebase/types';

const defaultSchoolInfo: SchoolInfo = {
  name: 'Bright Future Academy',
  tagline: 'Nurturing minds, building futures',
  description:
    'A premier educational institution committed to academic excellence, character development, and preparing students for a bright future. Our dedicated faculty and modern facilities create an environment where every student can thrive.',
  address: '123 Education Lane, Knowledge City, KC 12345',
  phone: '(555) 123-4567',
  email: 'info@brightfuture.edu',
  logoUrl: '',
  heroImageUrl: 'https://images.pexels.com/photos/5147366/pexels-photo-5147366.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  campusImages: [
    'https://images.pexels.com/photos/5147366/pexels-photo-5147366.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    'https://images.pexels.com/photos/37811241/pexels-photo-37811241.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
    'https://images.pexels.com/photos/37812834/pexels-photo-37812834.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  ],
  principalName: 'Dr. Sarah Mitchell',
  principalMessage:
    'At Bright Future Academy, we believe every child has unique talents waiting to be discovered. Our mission is to provide a nurturing environment where students grow academically, socially, and emotionally. We are committed to excellence in education and to helping each student reach their full potential.',
  principalImageUrl: 'https://images.pexels.com/photos/8423069/pexels-photo-8423069.jpeg?auto=compress&cs=tinysrgb&h=650&w=940',
  foundedYear: '1995',
  totalStudents: '1,200+',
  totalTeachers: '85+',
  totalCourses: '40+',
};

export function useSchoolInfo() {
  const [info, setInfo] = useState<SchoolInfo>(defaultSchoolInfo);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchoolInfo()
      .then((data) => {
        if (data) setInfo({ ...defaultSchoolInfo, ...data });
      })
      .catch((err) => console.error('Failed to fetch school info:', err))
      .finally(() => setLoading(false));
  }, []);

  return { info, loading };
}

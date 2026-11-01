import { useState, useEffect } from 'react';
import { fetchSchoolInfo } from '@/firebase/firestore';
import type { SchoolInfo } from '@/firebase/types';

const defaultSchoolInfo: SchoolInfo = {
  name: 'SchoolConnect',
  tagline: 'A multi-school information and management platform',
  description:
    'SchoolConnect helps visitors discover participating schools and gives authorised school teams tools to publish school information, notices and events.',
  address: '',
  phone: '',
  email: 'zaradigitalseva@gmail.com',
  logoUrl: '',
  heroImageUrl: 'https://images.pexels.com/photos/289737/pexels-photo-289737.jpeg?auto=compress&cs=tinysrgb&w=1600',
  campusImages: [
    'https://images.pexels.com/photos/289737/pexels-photo-289737.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/159844/cellular-education-classroom-159844.jpeg?auto=compress&cs=tinysrgb&w=1200',
    'https://images.pexels.com/photos/2675061/pexels-photo-2675061.jpeg?auto=compress&cs=tinysrgb&w=1200',
  ],
  principalName: 'SchoolConnect Team',
  principalMessage:
    'Our aim is to make participating school information easier to find and help authorised school teams manage their public online presence.',
  principalImageUrl: 'https://images.pexels.com/photos/5212324/pexels-photo-5212324.jpeg?auto=compress&cs=tinysrgb&w=940',
  foundedYear: '—',
  totalStudents: '—',
  totalTeachers: '—',
  totalCourses: '—',
};

export function useSchoolInfo() {
  const [info, setInfo] = useState<SchoolInfo>(defaultSchoolInfo);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSchoolInfo()
      .then((data) => {
        if (data) setInfo({ ...defaultSchoolInfo, ...data });
      })
      .catch((err) => console.error('Failed to fetch platform information:', err))
      .finally(() => setLoading(false));
  }, []);

  return { info, loading };
}

'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Spin } from 'antd';

export default function Home() {
  const { user } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [user, router]);

  return (
    <div style={{ display: 'flex', flex: 1, height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#f8fafc' }}>
      <Spin size="large" description="Yükleniyor..." />
    </div>
  );
}

import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { AppProvider } from '@/context/AppContext';
import Shell from '@/components/Shell';
import React from 'react';
import { ConfigProvider } from 'antd';
import trTR from 'antd/locale/tr_TR';
import NextTopLoader from 'nextjs-toploader';


const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'TS ERP - Professional Services Automation & Service Management',
  description: 'High-end PSA and Service Management ERP application built with Next.js and Antigravity 2.0',
};

const themeConfig = {
  token: {
    colorPrimary: '#002b49', // Sleek deep navy
    colorInfo: '#0ea5e9',    // Vibrant sky blue
    colorSuccess: '#10b981', // Professional emerald/teal
    colorWarning: '#f59e0b', // Warm amber
    colorError: '#ef4444',   // Vivid crimson
    borderRadius: 8,
    fontFamily: inter.style.fontFamily,
  },
  components: {
    Layout: {
      bodyBg: '#f8fafc',
      headerBg: '#ffffff',
      siderBg: '#ffffff',
    },
    Card: {
      boxShadowTertiary: '0 4px 12px 0 rgba(0, 0, 0, 0.03)',
    },
    Table: {
      headerBg: '#f8fafc',
      headerColor: '#475569',
    },
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="h-full bg-slate-50 antialiased">
      <body className={`${inter.className} min-h-full flex flex-col`}>
        <NextTopLoader color="#0ea5e9" height={3} showSpinner={false} shadow="0 0 10px #0ea5e9,0 0 5px #0ea5e9" />
        <AntdRegistry>
          <ConfigProvider theme={themeConfig} locale={trTR}>
            <AppProvider>
              <Shell>{children}</Shell>
            </AppProvider>
          </ConfigProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}

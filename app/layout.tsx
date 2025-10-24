import './globals.css';
import type { Metadata } from 'next';
import { ReactNode } from 'react';

export const metadata: Metadata = {
  title: 'Remote-Friendly Café Finder – El Paso',
  description: 'Discover remote-work friendly cafés across El Paso with Wi-Fi, seating, and more.'
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'Cosmos: Kitchen + Mocktail Bar', description: 'Explore the menu and order from Cosmos: Kitchen + Mocktail Bar.' };
export default function RootLayout({children}:{children:React.ReactNode}) { return <html lang="en"><body>{children}</body></html>; }

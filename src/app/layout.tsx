import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: 'PanchayatMausam — AI Hyperlocal Weather Downscaling & Agro-Advisory (SIH26074)',
  description: 'AI-based meteorological downscaling from Block to Gram Panchayat resolution with physics-informed topographic lapse rates and ICAR agro-advisories.',
  keywords: ['PanchayatMausam', 'SIH26074', 'IMD', 'Weather Downscaling', 'Gram Panchayat', 'Agro-Advisory', 'Smart India Hackathon']
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body>
        <Navbar />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

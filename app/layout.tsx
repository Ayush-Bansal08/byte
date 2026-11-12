import type { Metadata, Viewport } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { ByteProvider } from '@/components/byte/ByteContext';
import { ByteLayerLazy } from '@/components/byte/ByteLayerLazy';
import { ChatDock } from '@/components/chat/ChatDock';
import { Footer } from '@/components/site/Footer';
import { Nav } from '@/components/site/Nav';
import { TransitionProvider } from '@/components/transition/TransitionProvider';
import { PROFILE } from '@/content/profile';

const SITE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: { default: `${PROFILE.name}, software engineer`, template: `%s · ${PROFILE.name}` },
  description:
    'Ayush Bansal builds backend systems, cloud platforms and AI agents. 2nd place at ETHGlobal Mumbai 2026 (0G track), SWE intern at Finn, ML research intern at UNSW Sydney.',
  openGraph: { type: 'website', title: `${PROFILE.name}, software engineer`, description: PROFILE.summary, url: SITE },
  twitter: { card: 'summary_large_image' },
  alternates: { canonical: '/' },
};

export const viewport: Viewport = { themeColor: '#0c1119', colorScheme: 'dark' };

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: PROFILE.name,
  jobTitle: 'Software Engineer',
  email: `mailto:${PROFILE.email}`,
  alumniOf: PROFILE.education.school,
  sameAs: [PROFILE.links.github, PROFILE.links.linkedin],
  knowsAbout: ['Backend engineering', 'Kubernetes', 'AI agents', 'Cloud platforms', 'Machine learning'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head>
        {/* lets CSS show the static Byte fallback only when JavaScript is off */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      </head>
      <body>
        <a
          href="#main"
          className="fixed left-3 top-3 z-[100] -translate-y-20 rounded-full bg-accent px-4 py-2 font-medium text-bg transition-transform focus:translate-y-0"
        >
          Skip to content
        </a>
        <ByteProvider>
          <TransitionProvider>
            <Nav />
            <main id="main" className="pt-16">
              {children}
            </main>
            <Footer />
            <ByteLayerLazy />
            <ChatDock />
          </TransitionProvider>
        </ByteProvider>
      </body>
    </html>
  );
}

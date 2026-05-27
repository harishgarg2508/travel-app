import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ToastProvider from '@/components/ToastProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'All India Tour & Travel',
  description:
    'Book safe and comfortable intercity trips across India. Buses, cars, tempo travelers — we\'ve got you covered.',
  keywords: ['travel', 'India', 'tour', 'bus booking', 'intercity travel', 'trip booking'],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                function isAbortError(reason) {
                  if (!reason) return false;
                  if (typeof reason === 'string') {
                    return /aborterror|aborted/i.test(reason);
                  }
                  if (typeof reason === 'object') {
                    var name = reason.name;
                    var message = reason.message;
                    if (name === 'AbortError' || name === 'AbortException') return true;
                    if (typeof message === 'string' && /aborterror|aborted a request|user aborted/i.test(message)) return true;
                    var constructorName = reason.constructor ? reason.constructor.name : '';
                    if (constructorName === 'DOMException' || constructorName === 'AbortError') {
                      if (name === 'AbortError') return true;
                    }
                    if (Object.prototype.toString.call(reason) === '[object DOMException]' && name === 'AbortError') return true;
                  }
                  return false;
                }

                window.addEventListener('unhandledrejection', function(event) {
                  if (isAbortError(event.reason)) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                  }
                }, { capture: true });

                window.addEventListener('error', function(event) {
                  if (isAbortError(event.error)) {
                    event.preventDefault();
                    event.stopImmediatePropagation();
                  }
                }, { capture: true });
              })();
            `
          }}
        />
      </head>
      <body className="min-h-full flex flex-col bg-gray-50">
        <AuthProvider>
          <ToastProvider />
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}

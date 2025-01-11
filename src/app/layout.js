// src/app/layout.js
import ClientThemeProvider from '@/components/ClientThemeProvider';
import Header from '@/components/Header';
import './globals.css';

export const metadata = {
  title: 'Implaedén ®',
  description: 'Implantando Sonrisas®. Villahermosa Tabasco.',
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Header/>
        <ClientThemeProvider>{children}</ClientThemeProvider>
      </body>
    </html>
  );
}

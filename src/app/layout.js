// src/app/layout.js
import { PatientProvider } from '@/context/PatientContext';
import ClientThemeProvider from '@/components/ClientThemeProvider';
import Header from '@/components/Header';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';

export const metadata = {
  title: 'Implaedén ®',
  description: 'Implantando Sonrisas®. Villahermosa Tabasco.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {/* 2. Envuelve todo con AuthProvider */}
        <AuthProvider>
          <PatientProvider>
            {/* Ahora Header es un hijo de AuthProvider y podrá usar useAuth() */}
            <Header /> 
            <ClientThemeProvider>{children}</ClientThemeProvider>
          </PatientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
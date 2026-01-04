// src/app/layout.js
import { PatientProvider } from "@/context/PatientContext";
import ClientThemeProvider from "@/components/ClientThemeProvider";
import Header from "@/components/Header";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import "@assistant-ui/react-ui/styles/index.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <ClientThemeProvider>
            <PatientProvider>
               <ThemeProvider>
              <Header />
              {children}
              <Toaster richColors position="bottom-center" />
               </ThemeProvider>
            </PatientProvider>
          </ClientThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}

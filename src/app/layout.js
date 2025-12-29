// src/app/layout.js
import { PatientProvider } from "@/context/PatientContext";
import ClientThemeProvider from "@/components/ClientThemeProvider";
import Header from "@/components/Header";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import "@assistant-ui/react-ui/styles/index.css";

export const metadata = {
  title: "Implaedén ®",
  description: "Implantando Sonrisas®. Villahermosa Tabasco.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <PatientProvider>
            <Header />
            <ClientThemeProvider>{children}</ClientThemeProvider>
          </PatientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
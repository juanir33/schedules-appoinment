import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "../context/auth/AuthContext.context";
import { Toaster } from "react-hot-toast";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Salón de Belleza - Reservas Online",
  description: "Sistema de reservas online para salón de belleza",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html lang="es">
			<body className="bg-gray-50">
				<AuthProvider>
					<main className="min-h-screen">{children}</main>
				</AuthProvider>
				<Toaster
					position="top-right"
					toastOptions={{
						duration: 4000,
						style: {
							background: '#fff',
							color: '#333',
							borderRadius: '8px',
							boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
						},
						success: {
							iconTheme: {
								primary: '#10b981',
								secondary: '#fff',
							},
						},
						error: {
							iconTheme: {
								primary: '#ef4444',
								secondary: '#fff',
							},
						},
					}}
				/>
			</body>
		</html>
	);
}

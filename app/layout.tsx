import type { Metadata } from "next";
import { Roboto, Noto_Sans, Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import Header from "@/components/header";
import SyncUserWithConvex from "@/components/SyncUserWithConvex";
import { Toaster } from "@/components/ui/sonner";

const poppins = Inter({
	variable: "--font-poppins",
	subsets: ["latin"],
	weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"], // You can add more weights as needed
});

export const metadata: Metadata = {
	title: "TicketHub",
	description:
		"Best | Easy | Convenient way to buy, sell and manage event tickets.",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body className={`${poppins.variable} antialiased`}>
				<ClerkProvider>
					<ConvexClientProvider>
						<Header />
						<SyncUserWithConvex />
						{children}
						<Toaster position="top-center" />
					</ConvexClientProvider>
				</ClerkProvider>
			</body>
		</html>
	);
}

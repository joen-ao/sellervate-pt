import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { UserSwitcher } from "@/components/UserSwitcher";
import { getCurrentUser, listSwitchableUsers } from "@/lib/current-user";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sellervate · Reply review",
  description: "Team leads record their judgement on replies already sent; specialists read it back.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [current, users] = await Promise.all([getCurrentUser(), listSwitchableUsers()]);
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
        <UserSwitcher users={users} current={current} />
      </body>
    </html>
  );
}

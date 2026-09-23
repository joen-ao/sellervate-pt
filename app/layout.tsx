import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { unstable_rethrow } from "next/navigation";
import { UserSwitcher } from "@/components/UserSwitcher";
import { getCurrentUser, listSwitchableUsers } from "@/lib/current-user";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
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
  // If the database is down the shell still renders: the page's own error.tsx
  // explains it, and the corner says the switcher is unavailable. A throw here
  // would skip every error.tsx and land in global-error.tsx.
  let people: Awaited<ReturnType<typeof loadPeople>> | null = null;
  try {
    people = await loadPeople();
  } catch (e) {
    unstable_rethrow(e); // Next's own signals (dynamic usage, redirects) pass through
    console.error(e);
  }
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        {children}
        {people ? (
          <UserSwitcher users={people.users} current={people.current} />
        ) : (
          <p role="status" className="fixed bottom-4 right-4 z-50 rounded-field bg-base-200 px-3 py-1.5 text-sm text-base-content/70">
            User switcher unavailable
          </p>
        )}
      </body>
    </html>
  );
}

async function loadPeople() {
  const [current, users] = await Promise.all([getCurrentUser(), listSwitchableUsers()]);
  return { current, users };
}

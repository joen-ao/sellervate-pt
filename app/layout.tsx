import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { unstable_rethrow } from "next/navigation";
import { AppShell } from "@/components/shell/AppShell";
import { getCurrentUser } from "@/lib/current-user";
import { getShellBrands } from "@/lib/data/shell";
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
  // If the database is down the page still renders: its own error.tsx explains
  // it, and the corner says switching is unavailable. A throw here would skip
  // every error.tsx and land in global-error.tsx.
  let user: Awaited<ReturnType<typeof getCurrentUser>> | undefined;
  try {
    user = await getCurrentUser();
  } catch (e) {
    unstable_rethrow(e); // Next's own signals (dynamic usage, redirects) pass through
    console.error(e);
  }
  const brands = user ? await loadShellBrands() : [];

  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        {user ? <AppShell user={user} brands={brands}>{children}</AppShell> : children}
        {user === undefined && (
          <p role="status" className="fixed bottom-4 right-4 z-50 rounded-field bg-base-200 px-3 py-1.5 text-sm text-base-content/70">
            Switching person is unavailable
          </p>
        )}
      </body>
    </html>
  );
}

// Its own try: losing the brand list costs the sidebar its brands and counts,
// not the shell.
async function loadShellBrands() {
  try {
    return await getShellBrands();
  } catch (e) {
    unstable_rethrow(e);
    console.error(e);
    return [];
  }
}

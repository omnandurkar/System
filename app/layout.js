import { JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import Layout from "@/components/Layout";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono"
});

export const metadata = {
  title: "System",
  description: "Daily Protocol",
  icons: {
    icon: "/icon.png",
  },
};

import { getUserStats } from "@/app/actions";

export default async function RootLayout({ children }) {
  const user = await getUserStats();

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${jetbrainsMono.variable} font-mono`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Layout user={user}>{children}</Layout>
        </ThemeProvider>
      </body>
    </html>
  );
}

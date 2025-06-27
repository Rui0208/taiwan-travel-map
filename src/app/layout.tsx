import "./globals.css";
import { Inter } from "next/font/google";
import { SessionProvider } from "next-auth/react";
import { auth } from "@/auth";
import { I18nProvider } from "@/components/I18nProvider";
import ClientLayoutWrapper from "@/components/layout/ClientLayoutWrapper";

const inter = Inter({ subsets: ["latin"] });

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  return (
    <html lang="zh-TW">
      <body className={inter.className}>
        <SessionProvider session={session}>
          <I18nProvider>
            <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
          </I18nProvider>
        </SessionProvider>
      </body>
    </html>
  );
}

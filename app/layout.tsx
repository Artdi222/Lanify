import type { Metadata } from "next";
import { Fira_Code, Fira_Sans, Outfit, DM_Sans, JetBrains_Mono } from "next/font/google";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const firaCode = Fira_Code({
  variable: "--font-fira-code",
  subsets: ["latin"],
});

const firaSans = Fira_Sans({
  variable: "--font-fira-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Lanify",
  description: "Web-based osu!mania rhythm game",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${firaCode.variable} ${firaSans.variable} ${outfit.variable} ${dmSans.variable} ${jetbrainsMono.variable} dark h-full overflow-hidden antialiased`}
      style={{ colorScheme: 'dark' }}
    >
      <body className="h-full flex flex-col bg-background text-foreground overflow-hidden">
        <TooltipProvider>
          {children}
          <Toaster position="bottom-right" richColors theme="dark" />
        </TooltipProvider>
      </body>
    </html>
  );
}

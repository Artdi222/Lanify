import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lanify Admin | Beatmap Management",
  description: "Advanced admin dashboard for osu!mania beatmaps.",
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen font-sans">
      {children}
    </div>
  );
}

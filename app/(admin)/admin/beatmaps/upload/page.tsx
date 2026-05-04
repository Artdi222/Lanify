"use client";

import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import BeatmapUploadForm from "@/components/admin/BeatmapUploadForm";
import Link from "next/link";
import { motion } from "framer-motion";

export default function UploadBeatmapPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/beatmaps">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ChevronLeft className="h-6 w-6" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold font-heading glow-blue">Upload Beatmap</h1>
          <p className="text-muted-foreground">Add a new .osz file to the mania repository.</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <BeatmapUploadForm />
      </motion.div>
      
      {/* Footer / Help */}
      <div className="pt-8 border-t border-border mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
        <div className="space-y-2">
          <h4 className="font-bold text-foreground">File Format</h4>
          <p className="text-muted-foreground leading-relaxed">
            We only accept standard .osz archives exported from the osu! editor. Ensure the file contains at least one mania difficulty.
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="font-bold text-foreground">Metadata Parsing</h4>
          <p className="text-muted-foreground leading-relaxed">
            Most metadata is parsed automatically from the .osu file headers. You only need to provide the manual Star Rating.
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="font-bold text-foreground">Direct Upload</h4>
          <p className="text-muted-foreground leading-relaxed">
            Files are uploaded directly to Supabase storage. Large files up to 50MB are supported with a progress indicator.
          </p>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  ChevronLeft, 
  Trash2, 
  Download, 
  ExternalLink,
  Copy,
  CheckCircle2,
  Loader2,
  Calendar,
  FileCode,
  Globe
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import BeatmapPreview from "@/components/admin/BeatmapPreview";
import DeleteConfirmModal from "@/components/admin/DeleteConfirmModal";
import { getBeatmap, deleteBeatmap, getBeatmapUrl } from "@/lib/api/beatmaps";
import { useAuthStore } from "@/lib/store/useAuthStore";
import type { Beatmap, DifficultyInfo } from "@/types/beatmap";
import { toast } from "sonner";
import { format } from "date-fns";
import Link from "next/link";
import { motion } from "framer-motion";

export default function BeatmapDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [beatmap, setBeatmap] = useState<Beatmap | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const { token } = useAuthStore();

  useEffect(() => {
    const fetchData = async () => {
      if (!token) return;
      setIsLoading(true);
      try {
        const data = await getBeatmap(id, token);
        setBeatmap(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch beatmap details");
        router.push("/admin/beatmaps");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [id, token, router]);

  const handleDelete = async () => {
    if (!token) return;
    setIsDeleting(true);
    try {
      await deleteBeatmap(id, token);
      toast.success("Beatmap removed from repository");
      router.push("/admin/beatmaps");
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete beatmap");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleGetUrl = async () => {
    if (!token) return;
    setIsFetchingUrl(true);
    try {
      const { url } = await getBeatmapUrl(id, token);
      setSignedUrl(url);
    } catch (err) {
      console.error(err);
      toast.error("Failed to generate signed URL");
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const copyToClipboard = () => {
    if (!signedUrl) return;
    navigator.clipboard.writeText(signedUrl);
    setCopied(true);
    toast.success("Signed URL copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex h-[70vh] w-full items-center justify-center">
        <Loader2 className="h-10 w-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!beatmap) return null;

  // Transform Beatmap to DifficultyInfo for the preview component
  const mockDiffInfo: DifficultyInfo = {
    filename: beatmap.filePath.split("/").pop() || "beatmap.osz",
    title: beatmap.title,
    titleUnicode: beatmap.title,
    artist: beatmap.artist,
    artistUnicode: beatmap.artist,
    creator: beatmap.creator,
    version: beatmap.difficultyName,
    mode: 3,
    keyCount: beatmap.keyCount,
    od: beatmap.od || 0,
    hp: beatmap.hp || 0,
    bpm: beatmap.bpm,
    lengthSeconds: beatmap.lengthSeconds,
    noteCount: beatmap.noteCount,
    holdCount: beatmap.holdCount
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <Link href="/admin/beatmaps">
            <Button variant="outline" size="icon" className="rounded-full h-10 w-10">
              <ChevronLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold font-heading glow-blue truncate max-w-md">
              {beatmap.title}
            </h1>
            <p className="text-muted-foreground">{beatmap.artist} • <span className="text-accent font-bold">★{beatmap.starRating.toFixed(2)}</span></p>
          </div>
        </div>
        
        <div className="flex gap-3">
          <Button 
            variant="destructive" 
            className="gap-2 shadow-lg shadow-destructive/10"
            onClick={() => setShowDeleteModal(true)}
          >
            <Trash2 className="h-4 w-4" /> Delete
          </Button>
          <Button 
            variant="default" 
            className="gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
            onClick={handleGetUrl}
            disabled={isFetchingUrl}
          >
            {isFetchingUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Generate Download Link
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Technical Details */}
        <div className="lg:col-span-2 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <BeatmapPreview info={mockDiffInfo} />
          </motion.div>

          <Card className="border-border/50 bg-card/30 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                System Audit Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-8">
                <DetailItem 
                  icon={Calendar} 
                  label="Uploaded At" 
                  value={format(new Date(beatmap.createdAt), "PPP p")} 
                />
                <DetailItem 
                  icon={FileCode} 
                  label="Internal ID" 
                  value={beatmap.id} 
                  copyable
                />
              </div>
              <Separator className="bg-border/50" />
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Storage Path</span>
                <div className="bg-secondary/50 p-3 rounded-lg border border-border/50 font-mono text-xs break-all">
                  {beatmap.filePath}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Signed Link & Actions */}
        <div className="space-y-6">
          <Card className="border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-primary/5 pb-4">
              <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                <Globe className="h-4 w-4" /> Signed Access Link
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              {signedUrl ? (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                  <div className="relative group">
                    <div className="absolute inset-0 bg-primary/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative flex items-center gap-2 p-3 rounded-xl bg-background border-2 border-primary/50 font-mono text-[10px] break-all">
                      {signedUrl}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2" 
                      onClick={copyToClipboard}
                    >
                      {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
                      {copied ? "Copied" : "Copy Link"}
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex-1 gap-2" 
                      asChild
                    >
                      <a href={signedUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" /> Open Link
                      </a>
                    </Button>
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center">
                    This URL is signed for temporary access and will expire soon.
                  </p>
                </div>
              ) : (
                <div className="text-center py-8 space-y-4">
                  <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center mx-auto opacity-50">
                    <Download className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Generate a temporary signed URL to download or verify the .osz file.
                  </p>
                  <Button 
                    variant="secondary" 
                    className="w-full gap-2"
                    onClick={handleGetUrl}
                    disabled={isFetchingUrl}
                  >
                    {isFetchingUrl ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate Link"}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="p-6 rounded-2xl bg-destructive/5 border border-destructive/10 space-y-4">
            <h4 className="text-sm font-bold text-destructive flex items-center gap-2">
              <Trash2 className="h-4 w-4" /> Danger Zone
            </h4>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Deleting this beatmap will permanently remove its metadata and the associated file from Supabase storage.
            </p>
            <Button 
              variant="outline" 
              className="w-full border-destructive/30 text-destructive hover:bg-destructive hover:text-white"
              onClick={() => setShowDeleteModal(true)}
            >
              Permanently Delete
            </Button>
          </div>
        </div>
      </div>

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title={beatmap.title}
      />
    </div>
  );
}

function DetailItem({ 
  icon: Icon, 
  label, 
  value, 
  copyable 
}: { 
  icon: React.ComponentType<{ className?: string }>, 
  label: string, 
  value: string,
  copyable?: boolean
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    toast.success(`${label} copied`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-2">
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
        <Icon className="h-3 w-3" />
        {label}
      </span>
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-foreground">{value}</p>
        {copyable && (
          <button 
            onClick={handleCopy}
            className="text-muted-foreground hover:text-primary transition-colors"
          >
            {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        )}
      </div>
    </div>
  );
}

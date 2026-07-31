"use client";

import { useForm, SubmitHandler, useFieldArray, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Upload, 
  File, 
  Check, 
  ChevronLeft, 
  Loader2,
  Layers,
  ArrowRight,
  Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { OszInspector } from "@/lib/beatmap/OszInspector";
import { uploadToSupabase, createBeatmapBatch, calculateStars } from "@/lib/api/beatmaps";
import { useAuthStore } from "@/lib/store/useAuthStore";
import { cn } from "@/lib/utils";
import { useRef, useState } from "react";

const metadataSchema = z.object({
  title: z.string().min(1, "Title is required"),
  artist: z.string().min(1, "Artist is required"),
  creator: z.string().min(1, "Creator is required"),
  difficulties: z.array(z.object({
    difficultyName: z.string().min(1, "Difficulty name is required"),
    starRating: z.number().min(0, "Stars must be positive"),
    keyCount: z.number(),
    bpm: z.number(),
    lengthSeconds: z.number(),
    od: z.number(),
    hp: z.number(),
    noteCount: z.number(),
    holdCount: z.number(),
    selected: z.boolean(),
  })).min(1, "At least one difficulty must be selected"),
});

type MetadataForm = z.infer<typeof metadataSchema>;
type DifficultyEntry = MetadataForm["difficulties"][number];

const STEPS = [
  { id: 1, name: "Select File", icon: File },
  { id: 2, name: "Verify & Stars", icon: Layers },
  { id: 3, name: "Upload", icon: Upload },
];

export default function BeatmapUploadForm() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { token } = useAuthStore();
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    formState: { errors },
  } = useForm<MetadataForm>({
    resolver: zodResolver(metadataSchema),
    defaultValues: {
      title: "",
      artist: "",
      creator: "",
      difficulties: [],
    },
  });

  // Use useFieldArray for the list of difficulties
  const { fields } = useFieldArray({
    control,
    name: "difficulties",
  });

  // Use useWatch hook for observing selection/length (React Compiler compatible)
  const watchedDifficulties = useWatch({
    control,
    name: "difficulties",
  }) || [];

  // Step 1 -> Step 2: Parse OSZ
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.name.endsWith(".osz")) {
      toast.error("Please select a valid .osz file");
      return;
    }

    setFile(selectedFile);
    setIsProcessing(true);
    
    try {
      const info = await OszInspector.inspect(selectedFile);
      const maniaDiffs = info.filter(d => d.mode === 3);
      
      if (maniaDiffs.length === 0) {
        toast.error("No mania difficulties found in this file.");
        setIsProcessing(false);
        return;
      }

      // Store cover if found
      if (maniaDiffs[0].coverFile) {
        setCoverFile(maniaDiffs[0].coverFile);
      }

      // Try to calculate stars from backend
      const starRatings: Record<string, number> = {};
      if (token) {
        try {
          const starsInfo = await calculateStars(selectedFile, token);
          for (const item of starsInfo) {
            starRatings[item.difficultyName] = item.starRating;
          }
        } catch (err) {
          console.warn("Could not calculate stars automatically:", err);
          toast.warning("Failed to calculate star ratings automatically.");
        }
      }

      reset({
        title: maniaDiffs[0].title,
        artist: maniaDiffs[0].artist,
        creator: maniaDiffs[0].creator,
        difficulties: maniaDiffs.map(d => ({
          difficultyName: d.version,
          starRating: starRatings[d.version] || 0,
          keyCount: d.keyCount,
          bpm: d.bpm,
          lengthSeconds: d.lengthSeconds,
          od: d.od,
          hp: d.hp,
          noteCount: d.noteCount,
          holdCount: d.holdCount,
          selected: true,
        })),
      });

      setStep(2);
      toast.success(`Found ${maniaDiffs.length} mania difficulties`);
    } catch (err) {
      console.error(err);
      toast.error("Failed to parse beatmap file");
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 2 -> Step 3: Final Upload
  const onSubmit: SubmitHandler<MetadataForm> = async (data) => {
    if (!file || !token) return;
    
    const selectedDiffs = data.difficulties.filter(d => d.selected);
    if (selectedDiffs.length === 0) {
      toast.error("Please select at least one difficulty to upload");
      return;
    }

    setStep(3);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Upload .osz to Supabase
      const filePath = await uploadToSupabase(file, (p) => setUploadProgress(p));
      
      let coverUrl: string | undefined = undefined;
      if (coverFile) {
        const coverPath = await uploadToSupabase(coverFile);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
        coverUrl = `${apiUrl}/beatmaps/bg?path=${encodeURIComponent(coverPath)}`;
      }

      // 2. Create entries in backend
      await createBeatmapBatch({
        filePath,
        coverUrl,
        commonMetadata: {
          title: data.title,
          artist: data.artist,
          creator: data.creator,
        },
        difficulties: selectedDiffs.map(d => ({
          difficultyName: d.difficultyName,
          starRating: d.starRating,
          keyCount: d.keyCount,
          bpm: d.bpm,
          lengthSeconds: d.lengthSeconds,
          od: d.od,
          hp: d.hp,
          noteCount: d.noteCount,
          holdCount: d.holdCount,
        })),
      }, token);

      toast.success(`${selectedDiffs.length} difficulties uploaded successfully!`);
      // Redirect after success animation
      setTimeout(() => {
        window.location.href = "/admin/beatmaps";
      }, 1500);
      
    } catch (err: unknown) {
      console.error(err);
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      toast.error(errorMessage);
      setStep(2);
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Step Indicators */}
      <div className="mb-12 relative flex justify-between px-8">
        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border -translate-y-1/2 z-0" />
        {STEPS.map((s) => {
          const isActive = step === s.id;
          const isCompleted = step > s.id;
          return (
            <div key={s.id} className="relative z-10 flex flex-col items-center gap-2 bg-background px-4">
              <div className={cn(
                "h-10 w-10 rounded-full flex items-center justify-center border-2 transition-all duration-300",
                isActive ? "bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/30" : 
                isCompleted ? "bg-emerald-500 border-emerald-500 text-white" : 
                "bg-card border-border text-muted-foreground"
              )}>
                {isCompleted ? <Check className="h-5 w-5" /> : <s.icon className="h-5 w-5" />}
              </div>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-widest transition-colors",
                isActive ? "text-primary glow-blue" : "text-muted-foreground"
              )}>
                {s.name}
              </span>
            </div>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1: FILE SELECTION */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div 
              onClick={() => fileInputRef.current?.click()}
              className={cn(
                "group relative border-2 border-dashed rounded-2xl p-16 flex flex-col items-center justify-center transition-all cursor-pointer",
                isProcessing ? "border-primary bg-primary/5 cursor-not-allowed" : "border-border hover:border-primary hover:bg-primary/5"
              )}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept=".osz" 
                className="hidden" 
                disabled={isProcessing}
              />
              
              <div className="mb-4 h-20 w-20 rounded-full bg-secondary flex items-center justify-center ring-1 ring-border group-hover:scale-110 transition-transform">
                {isProcessing ? (
                  <Loader2 className="h-10 w-10 text-primary animate-spin" />
                ) : (
                  <Upload className="h-10 w-10 text-muted-foreground group-hover:text-primary transition-colors" />
                )}
              </div>
              
              <h2 className="text-2xl font-bold font-heading">
                {isProcessing ? "Analyzing .osz..." : "Drop your .osz file here"}
              </h2>
              <p className="text-muted-foreground mt-2 text-center max-w-md">
                {`We'll automatically extract all mania difficulties, metadata, and background images.`}
              </p>
              
              {!isProcessing && (
                <Button variant="outline" className="mt-8 gap-2">
                  <File className="h-4 w-4" /> Browse Files
                </Button>
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 2: CONFIGURE & VERIFY */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => setStep(1)} className="rounded-full">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-2xl font-bold font-heading">Configure Difficulties</h2>
              </div>
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                {watchedDifficulties.filter((d: DifficultyEntry) => d.selected).length} Difficulties Selected
              </Badge>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Common Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-6 rounded-2xl bg-secondary/20 border border-border/50">
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input {...register("title")} className="bg-background" />
                  {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Artist</Label>
                  <Input {...register("artist")} className="bg-background" />
                  {errors.artist && <p className="text-xs text-destructive">{errors.artist.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label>Creator</Label>
                  <Input {...register("creator")} className="bg-background" />
                  {errors.creator && <p className="text-xs text-destructive">{errors.creator.message}</p>}
                </div>
              </div>

              {/* Difficulty List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs font-bold uppercase tracking-widest text-muted-foreground px-4">
                  <div className="flex items-center gap-12">
                    <span className="w-8">Select</span>
                    <span>Difficulty Name</span>
                  </div>
                  <div className="flex items-center gap-20 mr-12">
                    <span>Stats</span>
                    <span className="w-32 text-center text-primary glow-blue">Star Rating</span>
                  </div>
                </div>

                <div className="space-y-3">
                  {fields.map((field, index) => {
                    const diff = watchedDifficulties[index] || field;
                    return (
                      <div 
                        key={field.id}
                        className={cn(
                          "group flex items-center justify-between p-4 rounded-xl border transition-all",
                          diff.selected ? "border-border bg-card/50" : "border-border/30 bg-transparent opacity-60"
                        )}
                      >
                        <div className="flex items-center gap-6">
                          <div 
                            onClick={() => setValue(`difficulties.${index}.selected`, !diff.selected)}
                            className={cn(
                              "h-6 w-6 rounded border-2 flex items-center justify-center cursor-pointer transition-colors",
                              diff.selected ? "bg-primary border-primary text-primary-foreground" : "border-muted-foreground/30 hover:border-primary"
                            )}
                          >
                            {diff.selected && <Check className="h-4 w-4 stroke-[3px]" />}
                          </div>
                          
                          <div>
                            <Input 
                              {...register(`difficulties.${index}.difficultyName`)} 
                              className="h-8 font-bold bg-transparent border-none focus-visible:ring-0 p-0 text-base"
                              disabled={!diff.selected}
                            />
                            <p className="text-xs text-muted-foreground">
                              {diff.keyCount}K • {diff.bpm} BPM
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-8">
                          <div className="flex items-center gap-3 text-xs font-mono text-muted-foreground">
                            <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {Math.floor(diff.lengthSeconds / 60)}:{(diff.lengthSeconds % 60).toString().padStart(2, "0")}</span>
                          </div>
                          
                          <div className="w-32">
                            <div className="relative">
                              <Input 
                                type="number" 
                                step="0.01"
                                {...register(`difficulties.${index}.starRating`, { valueAsNumber: true })}
                                disabled={!diff.selected}
                                className={cn(
                                  "h-10 text-center font-bold bg-background",
                                  diff.selected ? "border-primary/50 focus:border-primary ring-primary/20" : "border-border"
                                )}
                                placeholder="0.00"
                              />
                              <div className="absolute -top-6 left-0 w-full text-center">
                                {errors.difficulties?.[index]?.starRating && (
                                  <span className="text-[10px] text-destructive font-bold">{errors.difficulties?.[index]?.starRating?.message}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4">
                <Button 
                  type="submit" 
                  disabled={isUploading}
                  className="w-full h-14 text-lg font-bold bg-primary hover:bg-primary/90 shadow-xl shadow-primary/20 gap-3 group"
                >
                  {isUploading ? (
                    <Loader2 className="h-6 w-6 animate-spin" />
                  ) : (
                    <>
                      Upload {watchedDifficulties.filter((d: DifficultyEntry) => d.selected).length} Difficulties 
                      <ArrowRight className="h-6 w-6 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>
                <p className="text-center text-xs text-muted-foreground mt-4">
                  The .osz file and background image will be uploaded once and shared across all difficulties.
                </p>
              </div>
            </form>
          </motion.div>
        )}

        {/* STEP 3: UPLOAD PROGRESS */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto text-center space-y-8 py-12"
          >
            <div className="relative h-48 w-48 mx-auto">
              <svg className="h-full w-full" viewBox="0 0 100 100">
                <circle
                  className="text-secondary stroke-current"
                  strokeWidth="8"
                  fill="transparent"
                  r="42"
                  cx="50"
                  cy="50"
                />
                <motion.circle
                  className="text-primary stroke-current"
                  strokeWidth="8"
                  strokeLinecap="round"
                  fill="transparent"
                  r="42"
                  cx="50"
                  cy="50"
                  initial={{ strokeDasharray: "264 264", strokeDashoffset: 264 }}
                  animate={{ strokeDashoffset: 264 - (264 * uploadProgress) / 100 }}
                  transition={{ duration: 0.5 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-4xl font-bold font-mono glow-blue">{uploadProgress}%</span>
                <span className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Uploaded</span>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-2xl font-bold font-heading">
                {uploadProgress === 100 ? "Finalizing..." : "Uploading Everything..."}
              </h2>
              <p className="text-muted-foreground">
                Processing file and metadata for {watchedDifficulties.filter((d: DifficultyEntry) => d.selected).length} difficulties.
              </p>
            </div>

            <div className="bg-card/50 border border-border p-4 rounded-xl flex items-center gap-4">
              <div className="h-10 w-10 rounded-lg bg-secondary flex items-center justify-center">
                <File className="h-5 w-5 text-muted-foreground" />
              </div>
              <div className="text-left flex-1 overflow-hidden">
                <p className="font-bold truncate">{file?.name}</p>
                <p className="text-xs text-muted-foreground">{(file?.size ?? 0) / 1024 / 1024 > 1 
                  ? `${((file?.size ?? 0) / 1024 / 1024).toFixed(2)} MB` 
                  : `${((file?.size ?? 0) / 1024).toFixed(2)} KB`}
                </p>
              </div>
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

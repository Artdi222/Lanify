"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, User, X } from "lucide-react";
import { Icon } from "@/components/ui/icons/Icon";
import Flag from "@/components/profile/Flag";
import { countryName } from "@/lib/country";
import { getCountryRankings, getRankings, type CountryRankingEntry, type RankingEntry } from "@/lib/api/user";

type Tab = "performance" | "country";
type Players = { page: number; pageCount: number; entries: RankingEntry[] };

// ponytail: tiny per-key cache so tab/page switches don't flash empty; refreshed on every fetch.
const cache = new Map<string, unknown>();

function useFetch<T>(key: string, enabled: boolean, load: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    load()
      .then((res) => {
        cache.set(key, res);
        if (alive) setData(res);
      })
      .catch(() => alive && setData(null));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, enabled]);
  return (cache.get(key) as T | undefined) ?? data;
}

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const ROW = "grid h-[45px] items-center gap-3 rounded-[6px] bg-lf-surface-hover/60 px-5 font-game-body text-[13px] text-white/65";
const HEAD = "grid gap-3 px-5 pb-2 font-game-body text-[13px] text-white/55";
const PLAYER_COLS = "grid-cols-[56px_minmax(0,1fr)_100px_100px_110px_64px_64px_64px]";
const COUNTRY_COLS = "grid-cols-[56px_minmax(0,1fr)_110px_100px_110px_120px]";

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`relative cursor-pointer pb-3 font-game-display text-[15px] transition-colors ${active ? "font-bold text-white" : "text-lf-accent hover:text-white"}`}>
      {children}
      {active && <span className="absolute inset-x-0 -bottom-px h-[3px] rounded-full bg-lf-accent" />}
    </button>
  );
}

/** Rankings overlay. Spec: docs/ui-spec/rankings.md. */
export default function RankingsOverlay({
  isOpen,
  onClose,
  onOpenUser,
  escBlocked,
}: {
  isOpen: boolean;
  onClose: () => void;
  onOpenUser: (id: string) => void;
  /** True while a profile opened from here sits on top and owns Esc. */
  escBlocked?: boolean;
}) {
  const [tab, setTab] = useState<Tab>("performance");
  const [page, setPage] = useState(1);
  const [country, setCountry] = useState<string | null>(null);

  const players = useFetch<Players>(`p-${page}-${country ?? ""}`, isOpen && tab === "performance", () => getRankings(page, country ?? undefined));
  const countries = useFetch<CountryRankingEntry[]>("countries", isOpen && tab === "country", getCountryRankings);

  useEffect(() => {
    if (!isOpen || escBlocked) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose, escBlocked]);

  const showCountry = (code: string | null) => {
    setCountry(code);
    setPage(1);
    setTab("performance");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 top-12 z-40">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60" />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.18 }}
            className="absolute inset-y-0 left-1/2 flex w-[min(1632px,100%)] -translate-x-1/2 flex-col bg-lf-surface shadow-lf-panel"
          >
            <div className="relative flex h-[113px] shrink-0 flex-col items-center justify-center bg-linear-to-r from-lf-primary/70 via-lf-bg-raised to-lf-accent/30 text-center">
              <h1 className="font-game-display text-[22px] font-bold text-white">rankings</h1>
              <p className="font-game-body text-[17px] text-white/90">find out who&apos;s the best right now</p>
              <button type="button" onClick={onClose} aria-label="Close" className="absolute right-6 top-4 cursor-pointer rounded-full p-2 text-white/70 transition-colors hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <header className="flex h-[75px] shrink-0 items-center gap-4 bg-lf-bg-raised px-[70px]">
              <Icon name="rankings" size={32} />
              <h2 className="font-game-display text-[22px] text-white">rankings</h2>
            </header>
            <div className="flex shrink-0 items-end gap-7 bg-lf-bg-raised px-[70px] pt-4">
              <div className="flex gap-7 border-b border-lf-accent/40">
                <TabButton active={tab === "performance"} onClick={() => setTab("performance")}>
                  performance
                </TabButton>
                <TabButton active={tab === "country"} onClick={() => setTab("country")}>
                  country
                </TabButton>
              </div>
              {tab === "performance" && country && (
                <button type="button" onClick={() => showCountry(null)} className="mb-2.5 flex cursor-pointer items-center gap-2 rounded-full bg-black/30 py-1 pl-2 pr-3 font-game-body text-sm text-white transition-colors hover:bg-black/50">
                  <Flag code={country} height={16} />
                  {countryName(country)}
                  <X className="h-3.5 w-3.5 text-white/60" />
                </button>
              )}
            </div>

            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-[70px] py-6">
              {tab === "performance" ? (
                <>
                  <div className={`${HEAD} ${PLAYER_COLS}`}>
                    <span />
                    <span />
                    <span>Accuracy</span>
                    <span>Play Count</span>
                    <span className="text-white">Performance</span>
                    <span>SS</span>
                    <span>S</span>
                    <span>A</span>
                  </div>
                  <div className="space-y-1">
                    {players?.entries.map((p) => (
                      <div
                        key={p.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => onOpenUser(p.id)}
                        onKeyDown={(e) => e.key === "Enter" && onOpenUser(p.id)}
                        className={`${ROW} ${PLAYER_COLS} cursor-pointer transition-colors hover:bg-lf-surface-hover`}
                      >
                        <span className="font-bold text-white">#{p.rank}</span>
                        <span className="flex min-w-0 items-center gap-2">
                          {p.country ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation(); // flag filters by country instead of opening the profile
                                showCountry(p.country);
                              }}
                              title={countryName(p.country)}
                              className="shrink-0 cursor-pointer"
                            >
                              <Flag code={p.country} height={27} />
                            </button>
                          ) : (
                            <span className="h-[27px] w-9 shrink-0" />
                          )}
                          <span className="flex h-[27px] w-[57px] shrink-0 items-center justify-center overflow-hidden rounded-[4px] bg-lf-bg">
                            {p.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.avatarUrl} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <User className="h-4 w-4 text-lf-text-muted" />
                            )}
                          </span>
                          <span className="truncate text-[14px] text-white">{p.username}</span>
                        </span>
                        <span>{p.accuracy.toFixed(2)}%</span>
                        <span>{p.playCount.toLocaleString("en-US")}</span>
                        <span className="text-white">{fmt(p.totalPp)}</span>
                        <span>{p.ss.toLocaleString("en-US")}</span>
                        <span>{p.s.toLocaleString("en-US")}</span>
                        <span>{p.a.toLocaleString("en-US")}</span>
                      </div>
                    ))}
                  </div>
                  {players && players.entries.length === 0 && <p className="py-10 text-center font-game-body text-white/60">No players ranked yet.</p>}
                  {players && players.pageCount > 1 && (
                    <div className="mt-6 flex items-center justify-center gap-4 font-game-body text-sm text-white">
                      <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} aria-label="Previous page" className="cursor-pointer rounded-full p-2 transition-colors hover:bg-white/10 disabled:cursor-default disabled:opacity-30">
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      {page} / {players.pageCount}
                      <button type="button" disabled={page >= players.pageCount} onClick={() => setPage(page + 1)} aria-label="Next page" className="cursor-pointer rounded-full p-2 transition-colors hover:bg-white/10 disabled:cursor-default disabled:opacity-30">
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className={`${HEAD} ${COUNTRY_COLS}`}>
                    <span />
                    <span />
                    <span>Active Users</span>
                    <span>Play Count</span>
                    <span>Avg. Perf.</span>
                    <span className="text-white">Performance</span>
                  </div>
                  <div className="space-y-1">
                    {countries?.map((c) => (
                      <button key={c.country} type="button" onClick={() => showCountry(c.country)} className={`${ROW} ${COUNTRY_COLS} w-full cursor-pointer text-left transition-colors hover:bg-lf-surface-hover`}>
                        <span className="font-bold text-white">#{c.rank}</span>
                        <span className="flex min-w-0 items-center gap-3">
                          <Flag code={c.country} height={27} />
                          <span className="truncate text-[14px] text-white">{countryName(c.country)}</span>
                        </span>
                        <span>{c.activeUsers.toLocaleString("en-US")}</span>
                        <span>{c.playCount.toLocaleString("en-US")}</span>
                        <span>{fmt(c.avgPerformance)}</span>
                        <span className="text-white">{fmt(c.performance)}</span>
                      </button>
                    ))}
                  </div>
                  {countries && countries.length === 0 && <p className="py-10 text-center font-game-body text-white/60">No countries yet. Players set theirs in player info.</p>}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

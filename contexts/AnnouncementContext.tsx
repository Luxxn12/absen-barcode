"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useHydrated } from "@/hooks/useHydrated";
import {
  listAnnouncementsAction,
  createAnnouncementAction,
  deleteAnnouncementAction,
  type AnnouncementRecord,
} from "@/app/actions/announcements";

export type Announcement = AnnouncementRecord;

type AnnouncementContextValue = {
  announcements: Announcement[];
  loading: boolean;
  addAnnouncement: (
    payload: Pick<Announcement, "time" | "title">
  ) => Promise<Announcement | null>;
  removeAnnouncement: (id: string) => Promise<boolean>;
  refresh: () => Promise<void>;
};

const AnnouncementContext =
  createContext<AnnouncementContextValue | null>(null);

function sortAnnouncements(items: Announcement[]) {
  return [...items].sort((a, b) => a.time.localeCompare(b.time));
}

export function AnnouncementProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const hydrated = useHydrated();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listAnnouncementsAction();
      setAnnouncements(sortAnnouncements(data));
    } catch (error) {
      console.error("Gagal memuat pengumuman:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    void refresh();
  }, [hydrated, refresh]);

  const addAnnouncement = useCallback(
    async (payload: Pick<Announcement, "time" | "title">) => {
      const time = payload.time.trim();
      const title = payload.title.trim();
      if (!time || !title) return null;
      try {
        const created = await createAnnouncementAction({ time, title });
        setAnnouncements((prev) => sortAnnouncements([...prev, created]));
        return created;
      } catch (error) {
        console.error("Gagal menambahkan pengumuman:", error);
        return null;
      }
    },
    []
  );

  const removeAnnouncement = useCallback(async (id: string) => {
    try {
      await deleteAnnouncementAction(id);
      setAnnouncements((prev) => prev.filter((item) => item.id !== id));
      return true;
    } catch (error) {
      console.error("Gagal menghapus pengumuman:", error);
      return false;
    }
  }, []);

  const value = useMemo<AnnouncementContextValue>(
    () => ({
      announcements,
      loading,
      addAnnouncement,
      removeAnnouncement,
      refresh,
    }),
    [announcements, loading, addAnnouncement, removeAnnouncement, refresh]
  );

  return (
    <AnnouncementContext.Provider value={value}>
      {children}
    </AnnouncementContext.Provider>
  );
}

export function useAnnouncements() {
  const context = useContext(AnnouncementContext);
  if (!context) {
    throw new Error(
      "useAnnouncements must be used within AnnouncementProvider"
    );
  }
  return context;
}

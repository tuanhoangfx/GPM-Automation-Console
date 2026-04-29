import { useEffect, useMemo, useState } from "react";
import { profileId, profileName } from "../lib/profiles";
import type { ProfileRow } from "../types";

export function useProfiles(profiles: ProfileRow[], selected: Set<string | number>) {
  const [search, setSearch] = useState("");
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(500);

  const selectedProfiles = useMemo(
    () => profiles.filter((profile) => selected.has(profileId(profile))),
    [profiles, selected]
  );

  const filteredProfiles = useMemo(() => {
    const term = search.trim().toLowerCase();
    return profiles.filter((profile) => {
      const matchesSearch = !term || profileName(profile).toLowerCase().includes(term);
      const matchesGroup = selectedGroupIds.length === 0 || selectedGroupIds.includes(String(profile.group_id));
      return matchesSearch && matchesGroup;
    });
  }, [profiles, search, selectedGroupIds]);

  const totalPages = Math.max(1, Math.ceil(filteredProfiles.length / pageSize));
  const pageStart = (currentPage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, filteredProfiles.length);
  const pagedProfiles = filteredProfiles.slice(pageStart, pageEnd);

  const profileCounts = useMemo(() => {
    const counts = {
      total: profiles.length,
      ready: 0,
      running: 0,
      failed: 0
    };
    for (const profile of profiles) {
      if (profile.status === "closed") counts.ready += 1;
      else if (profile.status === "running" || profile.status === "opening") counts.running += 1;
      else if (profile.status === "failed") counts.failed += 1;
    }
    return counts;
  }, [profiles]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  return {
    search,
    setSearch,
    selectedGroupIds,
    setSelectedGroupIds,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    selectedProfiles,
    filteredProfiles,
    totalPages,
    pageStart,
    pageEnd,
    pagedProfiles,
    profileCounts
  };
}

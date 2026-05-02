import { useCallback, useEffect, useMemo, useState } from "react";
import { profileId, profileName } from "./profile-utils";
import type { ProfileRow } from "../../types";

export type ProfileTableSortKey = "profile" | "group" | "status" | "proxy" | "note";

export type ProfileSortDirection = "asc" | "desc";

export function useProfiles(profiles: ProfileRow[], selected: Set<string | number>) {
  const [search, setSearch] = useState("");
  const [selectedGroupIds, setSelectedGroupIds] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<ProfileRow["status"][]>([]);
  const [sortColumn, setSortColumn] = useState<ProfileTableSortKey>("profile");
  const [sortDirection, setSortDirection] = useState<ProfileSortDirection>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(100);

  const profileById = useMemo(
    () => new Map(profiles.map((profile) => [profileId(profile), profile] as const)),
    [profiles]
  );

  const selectedProfiles = useMemo(() => {
    const items: ProfileRow[] = [];
    selected.forEach((id) => {
      const profile = profileById.get(id);
      if (profile) items.push(profile);
    });
    return items;
  }, [profileById, selected]);

  const filteredProfilesRaw = useMemo(() => {
    const term = search.trim().toLowerCase();
    return profiles.filter((profile) => {
      const matchesSearch = !term || profileName(profile).toLowerCase().includes(term);
      const matchesGroup = selectedGroupIds.length === 0 || selectedGroupIds.includes(String(profile.group_id));
      const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(profile.status);
      return matchesSearch && matchesGroup && matchesStatus;
    });
  }, [profiles, search, selectedGroupIds, selectedStatuses]);

  const filteredProfiles = useMemo(() => {
    function statusSortLabel(status: ProfileRow["status"]) {
      return status === "closed" ? "Ready" : status;
    }

    function sortKeyFor(profile: ProfileRow): string {
      switch (sortColumn) {
        case "profile":
          return profileName(profile).toLocaleLowerCase();
        case "group":
          return String(profile.group_name || profile.group_id || "").toLocaleLowerCase();
        case "status":
          return statusSortLabel(profile.status).toLocaleLowerCase();
        case "proxy":
          return String(profile.raw_proxy || profile.proxy || "Local IP").toLocaleLowerCase();
        case "note":
          return String(profile.lastMessage || profile.note || "-").toLocaleLowerCase();
        default:
          return "";
      }
    }

    const list = [...filteredProfilesRaw];
    list.sort((a, b) => {
      const cmp = sortKeyFor(a).localeCompare(sortKeyFor(b), undefined, { sensitivity: "base", numeric: true });
      const signed = sortDirection === "desc" ? -cmp : cmp;
      if (signed !== 0) return signed;
      return String(profileId(a)).localeCompare(String(profileId(b)), undefined, { sensitivity: "base", numeric: true });
    });

    return list;
  }, [filteredProfilesRaw, sortColumn, sortDirection]);

  const toggleProfileSort = useCallback(
    (column: ProfileTableSortKey) => {
      if (sortColumn === column) {
        setSortDirection((direction) => (direction === "asc" ? "desc" : "asc"));
        return;
      }
      setSortColumn(column);
      setSortDirection("asc");
    },
    [sortColumn]
  );

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

  useEffect(() => {
    setCurrentPage(1);
  }, [sortColumn, sortDirection]);

  return {
    search,
    setSearch,
    selectedGroupIds,
    setSelectedGroupIds,
    selectedStatuses,
    setSelectedStatuses,
    sortColumn,
    sortDirection,
    toggleProfileSort,
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

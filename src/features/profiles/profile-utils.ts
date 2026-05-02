import type { GpmProfile, ProfileRow } from "../../types";

export function profileId(profile: GpmProfile) {
  return profile.id ?? profile.profile_id;
}

export function profileName(profile: GpmProfile) {
  return profile.profile_name || profile.name || `Profile ${profileId(profile)}`;
}

/** Merge fresh API payload with optimistic row state so polls do not flicker transient statuses. */
export function syncProfileRowState(
  profile: GpmProfile,
  previous?: Pick<ProfileRow, "status" | "lastMessage">
): Pick<ProfileRow, "status" | "lastMessage"> {
  const extended = profile as Partial<ProfileRow>;
  if (extended.status != null) {
    return {
      status: extended.status,
      lastMessage: extended.lastMessage ?? previous?.lastMessage
    };
  }
  if (previous?.status === "opening" || previous?.status === "running") {
    return {
      status: previous.status,
      lastMessage: previous.lastMessage ?? extended.lastMessage
    };
  }
  return {
    status: previous?.status ?? "closed",
    lastMessage: extended.lastMessage ?? previous?.lastMessage
  };
}

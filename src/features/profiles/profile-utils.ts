import type { GpmProfile } from "../../types";

export function profileId(profile: GpmProfile) {
  return profile.id ?? profile.profile_id;
}

export function profileName(profile: GpmProfile) {
  return profile.profile_name || profile.name || `Profile ${profileId(profile)}`;
}

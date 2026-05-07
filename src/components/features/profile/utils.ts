export interface User {
  first_name?: string;
  last_name?: string;
  nickname?: string;
  phone?: string;
  gender?: string;
  username?: string;
  email?: string;
  role?: string | { id?: string; name?: string };
  role_name?: string;
  profile_image?: string;
}

export interface FormData {
  firstname: string;
  lastname: string;
  nickname: string;
  phone: string;
  gender: string;
  username: string;
  email: string;
  position: string;
}

const ROLE_AVATAR_MAP: Record<string, string> = {
  nurse: "/images/profile.png",
  kitchen: "/images/profile.png",
};

export function getRoleAvatar(role?: string): string {
  if (!role) return ROLE_AVATAR_MAP.nurse;
  const lowerRole = role.toLowerCase();
  if (lowerRole.includes("kitchen") || lowerRole.includes("โภชนา") || lowerRole.includes("ครัว")) {
    return ROLE_AVATAR_MAP.kitchen;
  }
  return ROLE_AVATAR_MAP.nurse;
}

export const mapUserToForm = (user: User): FormData => ({
  firstname: user.first_name ?? "",
  lastname: user.last_name ?? "",
  nickname: user.nickname ?? "",
  phone: user.phone ?? "",
  gender: (user.gender ?? "").toLowerCase(),
  username: user.username ?? "",
  email: user.email ?? "",
  position: user.role_name ?? (typeof user.role === "string" ? user.role : user.role?.name) ?? "",
});

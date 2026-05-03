// Utility for role display name
export function getRoleDisplayName(role?: string): string {
  if (!role) return "เจ้าหน้าที่ดูแล";
  const lowerRole = role.toLowerCase();
  if (lowerRole.includes("kitchen") || lowerRole.includes("โภชนา") || lowerRole.includes("ครัว")) {
    return "เจ้าหน้าที่ครัว";
  }
  return "เจ้าหน้าที่ดูแล";
}

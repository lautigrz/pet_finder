export const UserExpAction = {
  VERIFY_EMAIL: "VERIFY_EMAIL",
  CREATE_LOST_REPORT: "CREATE_LOST_REPORT",
  CREATE_SIGHTING_REPORT: "CREATE_SIGHTING_REPORT",
  FOLLOW_REPORT: "FOLLOW_REPORT",
  COMPLETE_PROFILE: "COMPLETE_PROFILE",
  SEND_HELPFUL_MESSAGE: "SEND_HELPFUL_MESSAGE",
} as const;

export type UserExpAction = typeof UserExpAction[keyof typeof UserExpAction];

export const USER_EXP_BY_ACTION: Record<UserExpAction, number> = {
  [UserExpAction.VERIFY_EMAIL]: 10,
  [UserExpAction.CREATE_LOST_REPORT]: 25,
  [UserExpAction.CREATE_SIGHTING_REPORT]: 35,
  [UserExpAction.FOLLOW_REPORT]: 5,
  [UserExpAction.COMPLETE_PROFILE]: 15,
  [UserExpAction.SEND_HELPFUL_MESSAGE]: 10,
};

export function getExpForAction(action: UserExpAction): number {
  const exp = USER_EXP_BY_ACTION[action];
  if (!exp) throw new Error(`Unsupported user experience action: ${action}`);
  return exp;
}

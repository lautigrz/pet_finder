import { AppealTargetType } from "../appeal/types/appeal-target-type";

export interface AppealTokenPayload {
  targetType: AppealTargetType;
  targetPublicId: string;
  appellantPublicId: string;
}

export interface IAppealTokenSigner {
  sign(payload: AppealTokenPayload): string;
  verify(token: string): AppealTokenPayload;
}

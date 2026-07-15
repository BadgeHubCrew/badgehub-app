import { privateRestContracts } from "@shared/contracts/privateRestContracts";
import { publicRestContracts } from "@shared/contracts/publicRestContracts";

/** Combined public + private REST contracts (oRPC). */
export const apiContracts = {
  ...publicRestContracts,
  ...privateRestContracts,
};

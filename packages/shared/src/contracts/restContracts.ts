import { initContract } from "@ts-rest/core";
import { privateRestContracts } from "@badgehub/shared/contracts/privateRestContracts";
import { publicRestContracts } from "@badgehub/shared/contracts/publicRestContracts";

const c = initContract();

export const tsRestApiContracts = c.router({
  ...privateRestContracts,
  ...publicRestContracts,
});

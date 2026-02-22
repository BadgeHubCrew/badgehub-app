import { initContract } from "@ts-rest/core";
import { privateRestContracts } from "#shared/contracts/privateRestContracts";
import { publicRestContracts } from "#shared/contracts/publicRestContracts";

const c = initContract();

export const tsRestApiContracts = c.router({
  ...privateRestContracts,
  ...publicRestContracts,
});

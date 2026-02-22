import { dummyApps } from "@__test__/fixtures";
import { publicTsRestClient as defaultPrivateTsRestClient } from "@api/tsRestClient.ts";

export function privateTsRestClientBuilder(apps = dummyApps) {
  return {
    ...defaultPrivateTsRestClient,
    async getUserDraftProjects() {
      return {
        status: 200,
        body: apps.map((a) => a.summary),
        headers: new Headers(),
      };
    },
  } as typeof defaultPrivateTsRestClient;
}

export function privateTsRestClientWithError() {
  return {
    ...defaultPrivateTsRestClient,
    async getUserDraftProjects() {
      throw new Error("API error");
    },
  } as typeof defaultPrivateTsRestClient;
}

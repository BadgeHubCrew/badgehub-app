import React, { useState } from "react";
import PageLayout from "@sharedComponents/PageLayout.tsx";
import AppCreationBreadcrumb from "./AppCreationBreadcrumb.tsx";
import AppCreationBasicInfo from "./AppCreationBasicInfo.tsx";
import AppCreationActions from "./AppCreationActions.tsx";
import { VALID_SLUG_REGEX } from "@shared/contracts/slug.ts";
import { useSession } from "@sharedComponents/keycloakSession/SessionContext.tsx";
import {
  getFreshAuthorizedTsRestClient,
} from "@api/tsRestClient.ts";
import { useNavigate } from "react-router-dom";
import { PleaseLoginMessage } from "@sharedComponents/PleaseLoginMessage.tsx";
import { assertDefined } from "@shared/util/assertions.ts";
import { useTitle } from "@hooks/useTitle.ts";

export interface AppCreationFormData {
  slug: string;
}

// Define the valid slug regex

const initialForm: AppCreationFormData = {
  slug: "",
};

const AppCreationPage: React.FC = () => {
  useTitle("Create project");
  const [form, setForm] = useState<AppCreationFormData>(initialForm);
  const [error, setError] = useState<string | null>(null);
  const { user, keycloak } = useSession();
  const navigate = useNavigate();
  const handleFormChange = (changes: Partial<AppCreationFormData>) => {
    setForm((prev) => ({
      ...prev,
      ...changes,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    assertDefined(keycloak);
    e.preventDefault();
    setError(null);
    try {
      const response = await (
        await getFreshAuthorizedTsRestClient(keycloak)
      ).createProject({
        params: { slug: form.slug },
      });
      if (response.status === 204) {
        navigate(`/page/project/${form.slug}/edit`);
      } else {
        // Try to extract error reason from response body
        let reason: unknown = "Unknown error";
        if (
          response.body &&
          typeof response.body === "object" &&
          "reason" in response.body
        ) {
          reason = response.body.reason;
        }
        setError(typeof reason === "string" ? reason : "Unknown error");
      }
    } catch (err: unknown) {
      setError((err as { message: string })?.message || "Unknown error");
    }
  };

  // Check if slug is valid
  const isSlugValid = VALID_SLUG_REGEX.test(form.slug);

  // Check if user is logged in
  const userIsLoggedIn = keycloak?.authenticated && user?.id;

  return (
    <PageLayout data-testid="app-creation-page">
      <AppCreationBreadcrumb />
      <h1 className="text-3xl font-bold mb-6">
        Create a New Project
      </h1>
      {!userIsLoggedIn ? (
        <PleaseLoginMessage whatToSee="create a project" />
      ) : (
        <>
          {error && (
            <div role="alert" className="alert alert-error mb-4">
              {error}
            </div>
          )}
          <form className="space-y-8" onSubmit={handleSubmit}>
            <AppCreationBasicInfo form={form} onChange={handleFormChange} />
            <AppCreationActions isSlugValid={isSlugValid} />
          </form>
        </>
      )}
    </PageLayout>
  );
};

export default AppCreationPage;

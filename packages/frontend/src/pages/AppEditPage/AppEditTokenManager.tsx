import React, { useState, useEffect, useCallback } from "react";
import Keycloak from "keycloak-js";
import { getFreshAuthorizedTsRestClient } from "@api/tsRestClient.ts";
import { ProjectApiTokenMetadata } from "@shared/domain/readModels/project/ProjectApiToken";
import { assertDefined } from "@shared/util/assertions";

import { DeleteIcon } from "@sharedComponents/icons/DeleteIcon.tsx";
import { EyeIcon } from "@sharedComponents/icons/EyeIcon.tsx";
import { ClipboardCopyIcon } from "@sharedComponents/icons/ClipboardCopyIcon.tsx";
import { EyeOffIcon } from "@sharedComponents/icons/EyeOffIcon.tsx";
import { BADGHUB_API_V3_URL } from "@config.ts";
import { privateProjectContracts } from "@shared/contracts/privateRestContracts.ts";

interface AppEditTokenManagerProps {
  slug: string;
  keycloak: Keycloak;
}

/**
 * A component to manage API tokens for a project on the edit page.
 * It allows viewing token status, generating new tokens, and revoking existing ones.
 */
const AppEditTokenManager: React.FC<AppEditTokenManagerProps> = ({
  slug,
  keycloak,
}) => {
  const [tokenMetadata, setTokenMetadata] =
    useState<ProjectApiTokenMetadata | null>(null);
  const [newToken, setNewToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showToken, setShowToken] = useState(true);
  const [isOperating, setIsOperating] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [commandCopied, setCommandCopied] = useState(false);

  const fetchTokenMetadata = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const client = await getFreshAuthorizedTsRestClient(keycloak);
      const response = await client.getProjectApiTokenMetadata({
        params: { slug },
      });
      if (response.status === 200) {
        setTokenMetadata(response.body);
      } else if (response.status === 404) {
        setTokenMetadata(null);
      } else {
        setError("Failed to fetch token information.");
        console.error(response);
      }
    } catch (e) {
      setError("An error occurred while fetching token information.");
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [slug, keycloak]);

  useEffect(() => {
    fetchTokenMetadata();
  }, [fetchTokenMetadata]);

  const handleGenerateToken = async () => {
    assertDefined(keycloak);
    setIsOperating(true);
    setError(null);
    setNewToken(null);
    try {
      const client = await getFreshAuthorizedTsRestClient(keycloak);
      const response = await client.createProjectAPIToken({
        params: { slug },
        body: undefined,
      });
      if (response.status === 200) {
        setNewToken(response.body.token);
        setShowToken(true);
        await fetchTokenMetadata(); // Refresh metadata
      } else {
        setError("Failed to generate token.");
        console.error(response);
      }
    } catch (e) {
      setError("An error occurred while generating the token.");
      console.error(e);
    } finally {
      setIsOperating(false);
    }
  };

  const handleRevokeToken = async () => {
    if (
      !window.confirm(
        "Are you sure you want to revoke the API token? This action cannot be undone."
      )
    ) {
      return;
    }
    assertDefined(keycloak);
    setIsOperating(true);
    setError(null);
    try {
      const client = await getFreshAuthorizedTsRestClient(keycloak);
      const response = await client.revokeProjectAPIToken({ params: { slug } });
      if (response.status === 204) {
        setTokenMetadata(null);
        setNewToken(null);
      } else {
        setError("Failed to revoke token.");
        console.error(response);
      }
    } catch (e) {
      setError("An error occurred while revoking the token.");
      console.error(e);
    } finally {
      setIsOperating(false);
    }
  };

  const handleCopyToken = () => {
    if (newToken) {
      navigator.clipboard.writeText(newToken);
      setTokenCopied(true);
      setTimeout(() => setTokenCopied(false), 2000);
    }
  };
  const draftContract = privateProjectContracts.getDraftProject;
  const tokenForCommand =
    newToken && showToken ? newToken : "YOUR_PROJECT_TOKEN";
  const curlCommand = `curl -H "badgehub-api-token: ${tokenForCommand}" ${BADGHUB_API_V3_URL}${draftContract.path.replace(":slug", slug)}`;

  const handleCopyCommand = () => {
    navigator.clipboard.writeText(curlCommand);
    setCommandCopied(true);
    setTimeout(() => setCommandCopied(false), 2000);
  };

  if (loading) {
    return (
      <section className="card bg-base-200 shadow-lg">
        <div className="card-body">
          <h2 className="card-title text-2xl mb-2">API Token</h2>
          <p className="opacity-70">Loading token information...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card bg-base-200 shadow-lg">
      <div className="card-body">
      <h2 className="card-title text-2xl mb-2">API Token</h2>
      <div className="space-y-4">
        {error && <p className="text-error">{error}</p>}

        {newToken && (
          <div className="bg-base-300 p-4 rounded-lg">
            <h3 className="text-lg font-semibold text-success">
              New Token Generated
            </h3>
            <p className="opacity-70 text-sm mb-2">
              Please copy this token. You will not be able to see it again.
            </p>
            <div className="flex items-center space-x-2 bg-base-200 p-2 rounded-md">
              <input
                type={showToken ? "text" : "password"}
                readOnly
                value={newToken}
                className="flex-grow bg-transparent border-none font-mono focus:ring-0 focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="btn btn-sm btn-ghost"
                title={showToken ? "Hide token" : "Show token"}
              >
                {showToken ? <EyeOffIcon /> : <EyeIcon />}
              </button>
              <button
                type="button"
                onClick={handleCopyToken}
                className="btn btn-sm btn-ghost relative"
                title="Copy to clipboard"
              >
                <ClipboardCopyIcon />
                {tokenCopied && (
                  <span className="absolute -top-7 right-0 badge badge-success text-xs">
                    Copied!
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {tokenMetadata ? (
          <div className={newToken ? "mt-4" : ""}>
            {!newToken && (
              <p>
                An API token exists for this project.
              </p>
            )}
            <div className="flex flex-col sm:flex-row sm:gap-6">
              <p className="text-sm opacity-60">
                <span className="font-semibold">Created:</span>{" "}
                {new Date(tokenMetadata.created_at).toLocaleString()}
              </p>
              {tokenMetadata.last_used_at && (
                <p className="text-sm opacity-60">
                  <span className="font-semibold">Last used:</span>{" "}
                  {new Date(tokenMetadata.last_used_at).toLocaleString()}
                </p>
              )}
            </div>
            <div className="mt-6 mb-4">
              <h4 className="text-lg font-semibold mb-2">
                Example Usage (cURL)
              </h4>
              <div className="flex items-start space-x-2 bg-base-300 p-2 rounded-md font-mono text-sm">
                <pre className="text-success overflow-x-auto whitespace-pre-wrap flex-grow pt-1">
                  <code>{curlCommand}</code>
                </pre>
                <button
                  type="button"
                  onClick={handleCopyCommand}
                  className="btn btn-sm btn-ghost relative"
                  title="Copy command"
                >
                  <ClipboardCopyIcon />
                  {commandCopied && (
                    <span className="absolute -top-7 right-0 badge badge-success text-xs">
                      Copied!
                    </span>
                  )}
                </button>
              </div>
            </div>
            <div className="flex gap-4 items-center">
              <button
                type="button"
                onClick={handleRevokeToken}
                disabled={isOperating}
                className="btn btn-error flex items-center gap-2"
              >
                <DeleteIcon />
                Revoke Token
              </button>
              <button
                type="button"
                onClick={handleGenerateToken}
                disabled={isOperating}
                className="btn btn-info"
              >
                Regenerate Token
              </button>
            </div>
          </div>
        ) : (
          <div>
            <p>No active API token.</p>
            <button
              type="button"
              onClick={handleGenerateToken}
              disabled={isOperating}
              className="btn btn-success mt-4"
            >
              Generate New Token
            </button>
          </div>
        )}
      </div>
      </div>
    </section>
  );
};

export default AppEditTokenManager;

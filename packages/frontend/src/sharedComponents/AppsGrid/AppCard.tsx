import React, { useEffect, useState } from "react";
import type { AppCardProps } from "../types.ts";
import { MLink } from "@sharedComponents/MLink.tsx";
import { ERROR_ICON_URL, FALLBACK_ICON_URL } from "@config.ts";
import { DownloadIcon } from "@sharedComponents/AppsGrid/DownloadIcon.tsx";
import GitLink from "@sharedComponents/GitLink.tsx";
import { useSession } from "@sharedComponents/keycloakSession/SessionContext.tsx";

const AppCard: React.FC<
  AppCardProps & {
    git_url?: string; // Add git_url to props
  }
> = ({
  name,
  description,
  categories,
  published_at,
  revision,
  badges,
  slug,
  icon_map,
  editable,
  installs,
  git_url,
}) => {
  const icon = icon_map?.["64x64"];
  const iconSrc = icon ? icon.url : FALLBACK_ICON_URL;
  const { keycloak } = useSession();

  const [authenticatedIconSrc, setAuthenticatedIconSrc] = useState<
    string | null
  >(null);
  const [isLoadingIcon, setIsLoadingIcon] = useState(false);

  useEffect(() => {
    const isDraftFile = iconSrc.includes("/draft/files/");

    if (!isDraftFile) {
      setAuthenticatedIconSrc(iconSrc);
      return;
    }

    if (!keycloak?.token) {
      setAuthenticatedIconSrc(FALLBACK_ICON_URL);
      return;
    }

    let isCanceled = false;
    let currentBlobUrl: string | null = null;
    setIsLoadingIcon(true);

    const fetchAuthenticatedImage = async () => {
      try {
        const response = await fetch(iconSrc, {
          headers: {
            Authorization: `Bearer ${keycloak.token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        if (isCanceled) return;

        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        currentBlobUrl = blobUrl;
        setAuthenticatedIconSrc(blobUrl);
        setIsLoadingIcon(false);
      } catch (error) {
        console.error("Failed to load authenticated icon:", error);
        if (!isCanceled) {
          setAuthenticatedIconSrc(FALLBACK_ICON_URL);
          setIsLoadingIcon(false);
        }
      }
    };

    fetchAuthenticatedImage();

    return () => {
      isCanceled = true;
      // Revoke the blob URL created by this effect to prevent memory leaks
      if (currentBlobUrl) {
        URL.revokeObjectURL(currentBlobUrl);
      }
    };
  }, [iconSrc, keycloak?.token]);

  return (
    <div
      data-testid="AppCard"
      className="bg-gray-800 rounded-lg shadow-lg overflow-hidden card-hover-effect flex flex-col h-60"
    >
      <div className="p-5 flex flex-col flex-grow">
        {/* Header with icon, title, and Git link */}
        <div className="flex items-center mb-3">
          <div className="w-10 h-10 rounded-lg bg-gray-700 flex items-center justify-center mr-4 flex-shrink-0 overflow-hidden">
            {isLoadingIcon || !authenticatedIconSrc ? (
              <div className="w-8 h-8 bg-gray-600 animate-pulse rounded"></div>
            ) : (
              <img
                src={authenticatedIconSrc}
                alt={name || "App icon"}
                className="w-8 h-8 object-contain"
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = ERROR_ICON_URL;
                }}
              />
            )}
          </div>
          <div className="flex-grow flex items-center justify-between min-w-0">
            <MLink
              to={
                editable
                  ? `/page/project/${slug}/edit`
                  : `/page/project/${slug}`
              }
              className="min-w-0" // Prevents the link from pushing other elements
            >
              <h3 className="text-xl font-semibold text-emerald-400 hover:text-emerald-300 transition-colors truncate">
                {name}
              </h3>
            </MLink>
            <GitLink url={git_url} />
          </div>
        </div>

        {/* Description with line clamp */}
        <p className="text-sm text-slate-400 leading-relaxed line-clamp-2">
          {description}
        </p>

        {/* Tags section pushed to bottom */}
        <div className="mt-auto mb-3">
          {(() => {
            const MAX_VISIBLE_TAGS = 3;
            const allTags = [
              ...(categories?.map((cat, index) => ({
                text: cat,
                type: "category",
                id: `category-${index}`,
              })) ?? []),
              ...(badges?.map((badge, index) => ({
                text: badge,
                type: "badge",
                id: `badge-${index}`,
              })) ?? []),
            ];
            const visibleTags = allTags.slice(0, MAX_VISIBLE_TAGS);
            const hiddenCount = allTags.length - MAX_VISIBLE_TAGS;

            return (
              <>
                {visibleTags.map((tag) => (
                  <span
                    key={tag.id}
                    className={`${
                      tag.type === "category" ? "tag" : "tag-mcu"
                    } text-xs font-semibold mr-2 px-2.5 py-0.5 rounded-full`}
                  >
                    {tag.text}
                  </span>
                ))}
                {hiddenCount > 0 && (
                  <span
                    className="text-xs text-slate-500 font-medium cursor-help"
                    title={allTags
                      .slice(MAX_VISIBLE_TAGS)
                      .map((tag) => tag.text)
                      .join(", ")}
                  >
                    +{hiddenCount} more
                  </span>
                )}
              </>
            );
          })()}
        </div>
      </div>

      {/* Footer with stats */}
      <div className="px-5 py-3 bg-gray-700 border-t border-gray-700 flex justify-between items-center">
        <p className="text-sm text-slate-400">Revision: {revision ?? "-"}</p>
        <p className="text-sm text-slate-400">
          Published:{" "}
          {published_at ? new Date(published_at).toLocaleDateString() : "-"}
        </p>
        {installs !== undefined && (
          <p className="text-sm text-slate-400 flex items-center">
            <DownloadIcon />
            <span className="ml-1">{installs}</span>
          </p>
        )}
      </div>
    </div>
  );
};

export default AppCard;

CREATE TABLE project_ratings
(
    id                  SERIAL PRIMARY KEY,
    project_slug        TEXT                                   NOT NULL,
    registered_badge_id TEXT,
    idp_user_id         TEXT,
    rating              SMALLINT                               NOT NULL,
    created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT fk_project_ratings_project
        FOREIGN KEY (project_slug) REFERENCES projects (slug) ON DELETE CASCADE,
    CONSTRAINT fk_project_ratings_registered_badge
        FOREIGN KEY (registered_badge_id) REFERENCES registered_badges (id) ON DELETE CASCADE,
    CONSTRAINT project_ratings_rating_range
        CHECK (rating BETWEEN 1 AND 5),
    CONSTRAINT project_ratings_one_source
        CHECK (num_nonnulls(registered_badge_id, idp_user_id) = 1)
);

CREATE UNIQUE INDEX idx_project_ratings_project_badge
    ON project_ratings (project_slug, registered_badge_id)
    WHERE registered_badge_id IS NOT NULL;

CREATE UNIQUE INDEX idx_project_ratings_project_user
    ON project_ratings (project_slug, idp_user_id)
    WHERE idp_user_id IS NOT NULL;

CREATE INDEX idx_project_ratings_project_slug
    ON project_ratings (project_slug);

CREATE MATERIALIZED VIEW project_rating_reports AS
SELECT
    project_slug,
    AVG(rating)::REAL AS average_rating,
    COUNT(*)::INTEGER AS rating_count
FROM project_ratings
GROUP BY project_slug;

CREATE UNIQUE INDEX idx_project_rating_reports_project_slug
    ON project_rating_reports (project_slug);

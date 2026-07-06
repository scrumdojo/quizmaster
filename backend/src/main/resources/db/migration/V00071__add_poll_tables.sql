CREATE TABLE poll (
    id SERIAL PRIMARY KEY,
    workspace_guid TEXT NOT NULL,
    question TEXT NOT NULL
);

CREATE INDEX poll_workspace_guid_idx ON poll (workspace_guid);

CREATE TABLE poll_answer (
    poll_id INTEGER NOT NULL REFERENCES poll (id) ON DELETE CASCADE,
    answer_id INTEGER NOT NULL,
    text TEXT NOT NULL,
    votes INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (poll_id, answer_id)
);

COMMENT ON COLUMN poll_answer.votes IS 'Aggregate vote counter; incremented atomically per submitted vote';

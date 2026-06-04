ALTER TABLE question DROP CONSTRAINT IF EXISTS chk_tolerance_only_numerical;
UPDATE question SET tolerance = 0 WHERE tolerance IS NULL;
ALTER TABLE question ALTER COLUMN tolerance SET DEFAULT 0;
ALTER TABLE question ALTER COLUMN tolerance SET NOT NULL;

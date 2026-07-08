ALTER TABLE quiz DROP CONSTRAINT quiz_mode_check;
ALTER TABLE quiz ADD CONSTRAINT quiz_mode_check CHECK (mode IN ('LEARN', 'EXAM', 'BUZZER'));

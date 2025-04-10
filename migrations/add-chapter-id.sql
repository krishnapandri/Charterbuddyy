-- Add chapter_id column to questions table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'questions' AND column_name = 'chapter_id'
    ) THEN
        ALTER TABLE questions ADD COLUMN chapter_id INTEGER REFERENCES chapters(id);
    END IF;
END $$;
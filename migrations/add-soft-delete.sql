-- Add is_deleted column to all main tables
DO $$
BEGIN
    -- Add to users table
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'is_deleted'
    ) THEN
        ALTER TABLE users ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;

    -- Add to topics table
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'topics' AND column_name = 'is_deleted'
    ) THEN
        ALTER TABLE topics ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;

    -- Add to chapters table
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'chapters' AND column_name = 'is_deleted'
    ) THEN
        ALTER TABLE chapters ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;

    -- Add to questions table
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'questions' AND column_name = 'is_deleted'
    ) THEN
        ALTER TABLE questions ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;

    -- Add to practice_sets table
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'practice_sets' AND column_name = 'is_deleted'
    ) THEN
        ALTER TABLE practice_sets ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;

    -- Add to user_answers table
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'user_answers' AND column_name = 'is_deleted'
    ) THEN
        ALTER TABLE user_answers ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;

    -- Add to user_progress table
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'user_progress' AND column_name = 'is_deleted'
    ) THEN
        ALTER TABLE user_progress ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;

    -- Add to user_activity table
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'user_activity' AND column_name = 'is_deleted'
    ) THEN
        ALTER TABLE user_activity ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;

    -- Add to payments table
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'payments' AND column_name = 'is_deleted'
    ) THEN
        ALTER TABLE payments ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;

    -- Add to subscriptions table
    IF NOT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_name = 'subscriptions' AND column_name = 'is_deleted'
    ) THEN
        ALTER TABLE subscriptions ADD COLUMN is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;
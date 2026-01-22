-- Migration: Rename mол (Cyrillic) to mol (English) in Company and Client tables
-- This migration renames the Cyrillic column name to English for better compatibility

-- Rename mол to mol in Company table
DO $$ 
BEGIN
    -- Check if mол column exists and mol doesn't exist
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Company' 
        AND column_name = 'mол'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Company' 
        AND column_name = 'mol'
    ) THEN
        ALTER TABLE "Company" RENAME COLUMN "mол" TO "mol";
        RAISE NOTICE 'Renamed mол to mol in Company table';
    ELSIF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Company' 
        AND column_name = 'mol'
    ) THEN
        RAISE NOTICE 'Column mol already exists in Company table';
    ELSE
        RAISE NOTICE 'Column mол does not exist in Company table';
    END IF;
END $$;

-- Rename mол to mol in Client table
DO $$ 
BEGIN
    -- Check if mол column exists and mol doesn't exist
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Client' 
        AND column_name = 'mол'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Client' 
        AND column_name = 'mol'
    ) THEN
        ALTER TABLE "Client" RENAME COLUMN "mол" TO "mol";
        RAISE NOTICE 'Renamed mол to mol in Client table';
    ELSIF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'Client' 
        AND column_name = 'mol'
    ) THEN
        RAISE NOTICE 'Column mol already exists in Client table';
    ELSE
        RAISE NOTICE 'Column mол does not exist in Client table';
    END IF;
END $$;

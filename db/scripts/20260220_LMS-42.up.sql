-- Add 'waiting_list' to entity_type enum
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'waiting_list' 
        AND enumtypid = 'lockerhub.entity_type'::regtype
    ) THEN
        ALTER TYPE lockerhub.entity_type ADD VALUE 'waiting_list';
    END IF;
END $$;

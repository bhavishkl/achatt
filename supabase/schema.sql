CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public insert for new users" ON users FOR INSERT WITH CHECK (true);

-- WARNING: This is a permissive policy for development purposes.
-- For production, you should implement a more secure policy that only allows users to select their own data.
CREATE POLICY "Allow individual select access" ON users FOR SELECT USING (true);

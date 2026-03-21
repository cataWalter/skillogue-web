-- Seed data for Skillogue application

-- Insert Passions
INSERT INTO passions (id, name) VALUES
    (1, 'Photography'),
    (2, 'Travel'),
    (3, 'Cooking'),
    (4, 'Music'),
    (5, 'Sports'),
    (6, 'Reading'),
    (7, 'Gaming'),
    (8, 'Art'),
    (9, 'Technology'),
    (10, 'Fitness'),
    (11, 'Movies'),
    (12, 'Dancing'),
    (13, 'Writing'),
    (14, 'Nature'),
    (15, 'Fashion'),
    (16, 'Yoga'),
    (17, 'Hiking'),
    (18, 'Swimming'),
    (19, 'Cycling'),
    (20, 'Meditation')
ON CONFLICT (name) DO NOTHING;

-- Insert Languages
INSERT INTO languages (id, name) VALUES
    (1, 'English'),
    (2, 'Spanish'),
    (3, 'French'),
    (4, 'German'),
    (5, 'Italian'),
    (6, 'Portuguese'),
    (7, 'Chinese'),
    (8, 'Japanese'),
    (9, 'Korean'),
    (10, 'Arabic'),
    (11, 'Russian'),
    (12, 'Turkish'),
    (13, 'Dutch'),
    (14, 'Polish'),
    (15, 'Swedish')
ON CONFLICT (name) DO NOTHING;

-- Insert Locations
INSERT INTO locations (city, region, country) VALUES
    ('New York', 'New York', 'USA'),
    ('Los Angeles', 'California', 'USA'),
    ('London', 'England', 'UK'),
    ('Paris', 'Ile-de-France', 'France'),
    ('Tokyo', 'Tokyo', 'Japan'),
    ('Berlin', 'Berlin', 'Germany'),
    ('Sydney', 'New South Wales', 'Australia'),
    ('Toronto', 'Ontario', 'Canada'),
    ('Istanbul', 'Istanbul', 'Turkey'),
    ('Barcelona', 'Catalonia', 'Spain'),
    ('Amsterdam', 'North Holland', 'Netherlands'),
    ('Rome', 'Lazio', 'Italy'),
    ('Dubai', 'Dubai', 'UAE'),
    ('Singapore', 'Singapore', 'Singapore'),
    ('Mumbai', 'Maharashtra', 'India');

-- Create a test user profile (optional - requires auth user to exist first)
-- This is commented out because it requires an authenticated user
-- INSERT INTO profiles (id, first_name, last_name, about_me, age, gender, verified)
-- VALUES (
--     '00000000-0000-0000-0000-000000000000',  -- Replace with actual user UUID from auth.users
--     'Test',
--     'User',
--     'This is a test profile',
--     25,
--     'Other',
--     false
-- );
-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.blocks
(
    user_id         uuid                     NOT NULL,
    blocked_user_id uuid                     NOT NULL,
    created_at      timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT blocks_pkey PRIMARY KEY (user_id, blocked_user_id),
    CONSTRAINT blocks_blocked_user_id_fkey FOREIGN KEY (blocked_user_id) REFERENCES public.profiles (id),
    CONSTRAINT blocks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles (id)
);
CREATE TABLE public.follows
(
    follower_id  uuid                     NOT NULL,
    following_id uuid                     NOT NULL,
    created_at   timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT follows_pkey PRIMARY KEY (follower_id, following_id),
    CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.profiles (id),
    CONSTRAINT follows_following_id_fkey FOREIGN KEY (following_id) REFERENCES public.profiles (id)
);
CREATE TABLE public.languages
(
    id         bigint                   NOT NULL DEFAULT nextval('languages_id_seq'::regclass),
    name       text                     NOT NULL UNIQUE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT languages_pkey PRIMARY KEY (id)
);
CREATE TABLE public.messages
(
    id          bigint                   NOT NULL DEFAULT nextval('messages_id_seq'::regclass),
    created_at  timestamp with time zone NOT NULL DEFAULT now(),
    sender_id   uuid                     NOT NULL,
    receiver_id uuid                     NOT NULL,
    content     text                     NOT NULL,
    is_read     boolean                           DEFAULT false,
    CONSTRAINT messages_pkey PRIMARY KEY (id),
    CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.profiles (id),
    CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles (id)
);
CREATE TABLE public.notifications
(
    id         bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    user_id    uuid                                NOT NULL,
    actor_id   uuid                                NOT NULL,
    type       text                                NOT NULL,
    target_id  text,
    read       boolean                  DEFAULT false,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT notifications_pkey PRIMARY KEY (id),
    CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles (id),
    CONSTRAINT notifications_actor_id_fkey FOREIGN KEY (actor_id) REFERENCES public.profiles (id)
);
CREATE TABLE public.passions
(
    id         bigint                   NOT NULL DEFAULT nextval('passions_id_seq'::regclass),
    name       text                     NOT NULL UNIQUE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT passions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.profile_languages
(
    id          bigint NOT NULL DEFAULT nextval('profile_languages_id_seq'::regclass),
    profile_id  uuid   NOT NULL,
    language_id bigint NOT NULL,
    CONSTRAINT profile_languages_pkey PRIMARY KEY (id),
    CONSTRAINT profile_languages_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles (id),
    CONSTRAINT profile_languages_language_id_fkey FOREIGN KEY (language_id) REFERENCES public.languages (id)
);
CREATE TABLE public.profile_passions
(
    id         bigint NOT NULL DEFAULT nextval('profile_passions_id_seq'::regclass),
    profile_id uuid   NOT NULL,
    passion_id bigint NOT NULL,
    CONSTRAINT profile_passions_pkey PRIMARY KEY (id),
    CONSTRAINT profile_passions_passion_id_fkey FOREIGN KEY (passion_id) REFERENCES public.passions (id),
    CONSTRAINT profile_passions_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles (id)
);
CREATE TABLE public.profiles
(
    id         uuid                     NOT NULL,
    first_name text,
    last_name  text,
    about_me   text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    gender     text,
    location   text,
    age        integer,
    verified   boolean                  NOT NULL DEFAULT false,
    role       text                              DEFAULT 'user'::text,
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users (id)
);
CREATE TABLE public.reports
(
    id               bigint                   NOT NULL DEFAULT nextval('reports_id_seq'::regclass),
    reporter_id      uuid                     NOT NULL,
    reported_user_id uuid                     NOT NULL,
    reason           text                     NOT NULL,
    created_at       timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT reports_pkey PRIMARY KEY (id),
    CONSTRAINT reports_reported_user_id_fkey FOREIGN KEY (reported_user_id) REFERENCES public.profiles (id),
    CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.profiles (id)
);
CREATE TABLE public.user_passions
(
    user_id    uuid   NOT NULL,
    passion_id bigint NOT NULL,
    CONSTRAINT user_passions_pkey PRIMARY KEY (user_id, passion_id)
);
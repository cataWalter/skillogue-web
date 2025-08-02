--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Drop existing objects using CASCADE to handle dependencies
--

DROP TABLE IF EXISTS public.messages CASCADE;
DROP TABLE IF EXISTS public.passions CASCADE;
DROP TABLE IF EXISTS public.profile_passions CASCADE;
DROP TABLE IF EXISTS public.reports CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public;
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
insert into public.profiles (id, first_name, last_name)
values (new.id, new.raw_user_meta_data->>'first_name', new.raw_user_meta_data->>'last_name');
return new;
end;
$$;


SET default_tablespace = '';

SET default_table_access_method = "heap";

--
-- Name: profiles; Type: TABLE; Schema: public;
-- Note: Creating profiles table first as other tables depend on it.
--

CREATE TABLE public.profiles (
                                 "id" uuid NOT NULL,
                                 "first_name" text,
                                 "last_name" text,
                                 "about_me" text,
                                 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
                                 "gender" text,
                                 "location" text,
                                 "age" integer,
                                 "languages" text[],
                                 "verified" boolean DEFAULT false NOT NULL
);


--
-- Name: messages; Type: TABLE; Schema: public;
--

CREATE TABLE public.messages (
                                 "id" bigint NOT NULL,
                                 "created_at" timestamp with time zone DEFAULT now() NOT NULL,
                                 "sender_id" uuid NOT NULL,
                                 "receiver_id" uuid NOT NULL,
                                 "content" text NOT NULL
);


--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public;
--

CREATE SEQUENCE public.messages_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public;
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: passions; Type: TABLE; Schema: public;
--

CREATE TABLE public.passions (
                                 "id" bigint NOT NULL,
                                 "name" text NOT NULL,
                                 "created_at" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: passions_id_seq; Type: SEQUENCE; Schema: public;
--

CREATE SEQUENCE public.passions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: passions_id_seq; Type: SEQUENCE OWNED BY; Schema: public;
--

ALTER SEQUENCE public.passions_id_seq OWNED BY public.passions.id;


--
-- Name: profile_passions; Type: TABLE; Schema: public;
--

CREATE TABLE public.profile_passions (
                                         "id" bigint NOT NULL,
                                         "profile_id" uuid NOT NULL,
                                         "passion_id" bigint NOT NULL
);


--
-- Name: profile_passions_id_seq; Type: SEQUENCE; Schema: public;
--

CREATE SEQUENCE public.profile_passions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: profile_passions_id_seq; Type: SEQUENCE OWNED BY; Schema: public;
--

ALTER SEQUENCE public.profile_passions_id_seq OWNED BY public.profile_passions.id;


--
-- Name: reports; Type: TABLE; Schema: public;
--

CREATE TABLE public.reports (
                                "id" bigint NOT NULL,
                                "reporter_id" uuid NOT NULL,
                                "reported_user_id" uuid NOT NULL,
                                "reason" text NOT NULL,
                                "created_at" timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: reports_id_seq; Type: SEQUENCE; Schema: public;
--

CREATE SEQUENCE public.reports_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reports_id_seq; Type: SEQUENCE OWNED BY; Schema: public;
--

ALTER SEQUENCE public.reports_id_seq OWNED BY public.reports.id;


--
-- Name: messages id; Type: DEFAULT; Schema: public;
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: passions id; Type: DEFAULT; Schema: public;
--

ALTER TABLE ONLY public.passions ALTER COLUMN id SET DEFAULT nextval('public.passions_id_seq'::regclass);


--
-- Name: profile_passions id; Type: DEFAULT; Schema: public;
--

ALTER TABLE ONLY public.profile_passions ALTER COLUMN id SET DEFAULT nextval('public.profile_passions_id_seq'::regclass);


--
-- Name: reports id; Type: DEFAULT; Schema: public;
--

ALTER TABLE ONLY public.reports ALTER COLUMN id SET DEFAULT nextval('public.reports_id_seq'::regclass);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: passions passions_name_key; Type: CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.passions
    ADD CONSTRAINT passions_name_key UNIQUE (name);


--
-- Name: passions passions_pkey; Type: CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.passions
    ADD CONSTRAINT passions_pkey PRIMARY KEY (id);


--
-- Name: profile_passions profile_passions_pkey; Type: CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.profile_passions
    ADD CONSTRAINT profile_passions_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: reports reports_pkey; Type: CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_pkey PRIMARY KEY (id);


--
-- Name: messages messages_receiver_id_fkey; Type: FK CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_receiver_id_fkey FOREIGN KEY (receiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profile_passions profile_passions_passion_id_fkey; Type: FK CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.profile_passions
    ADD CONSTRAINT profile_passions_passion_id_fkey FOREIGN KEY (passion_id) REFERENCES public.passions(id) ON DELETE CASCADE;


--
-- Name: profile_passions profile_passions_profile_id_fkey; Type: FK CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.profile_passions
    ADD CONSTRAINT profile_passions_profile_id_fkey FOREIGN KEY (profile_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: reports reports_reported_user_id_fkey; Type: FK CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reported_user_id_fkey FOREIGN KEY (reported_user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: reports reports_reporter_id_fkey; Type: FK CONSTRAINT; Schema: public;
--

ALTER TABLE ONLY public.reports
    ADD CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES public.profiles(id) ON DELETE CASCADE;


--
-- Name: messages Enable read access for users to their own messages; Type: POLICY; Schema: public;
--

CREATE POLICY "Enable read access for users to their own messages" ON public.messages FOR SELECT USING (((auth.uid() = sender_id) OR (auth.uid() = receiver_id)));


--
-- Name: passions Enable read access for all users; Type: POLICY; Schema: public;
--

CREATE POLICY "Enable read access for all users" ON public.passions FOR SELECT USING (true);


--
-- Name: profile_passions Enable read access for all users; Type: POLICY; Schema: public;
--

CREATE POLICY "Enable read access for all users" ON public.profile_passions FOR SELECT USING (true);


--
-- Name: profiles Public profiles are viewable by everyone.; Type: POLICY; Schema: public;
--

CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);


--
-- Name: reports Users can create reports; Type: POLICY; Schema: public;
--

CREATE POLICY "Users can create reports" ON public.reports FOR INSERT WITH CHECK ((auth.uid() = reporter_id));


--
-- Name: profile_passions Users can insert their own passions; Type: POLICY; Schema: public;
--

CREATE POLICY "Users can insert their own passions" ON public.profile_passions FOR INSERT WITH CHECK ((auth.uid() = profile_id));


--
-- Name: messages Users can send messages; Type: POLICY; Schema: public;
--

CREATE POLICY "Users can send messages" ON public.messages FOR INSERT WITH CHECK ((auth.uid() = sender_id));


--
-- Name: profiles Users can update own profile.; Type: POLICY; Schema: public;
--

CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING ((auth.uid() = id));


--
-- Name: messages; Type: ROW SECURITY; Schema: public;
--

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;


--
-- Name: passions; Type: ROW SECURITY; Schema: public;
--

ALTER TABLE public.passions ENABLE ROW LEVEL SECURITY;


--
-- Name: profile_passions; Type: ROW SECURITY; Schema: public;
--

ALTER TABLE public.profile_passions ENABLE ROW LEVEL SECURITY;


--
-- Name: profiles; Type: ROW SECURITY; Schema: public;
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;


--
-- Name: reports; Type: ROW SECURITY; Schema: public;
--

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;


--
-- PostgreSQL database dump complete
--
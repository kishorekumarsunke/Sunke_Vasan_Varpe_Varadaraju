--
-- PostgreSQL database dump
--

\restrict pfSUsilpqu5iPT3vpf3IYqyfbInsYnmgs3v7sAvNi3oTX8if99QCbDXhaXibrQT

-- Dumped from database version 18.0
-- Dumped by pg_dump version 18.0

-- Started on 2025-11-25 01:55:45

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 5367 (class 1262 OID 29554)
-- Name: TutorTogether; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE "TutorTogether" WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'English_United States.1252';


ALTER DATABASE "TutorTogether" OWNER TO postgres;

\unrestrict pfSUsilpqu5iPT3vpf3IYqyfbInsYnmgs3v7sAvNi3oTX8if99QCbDXhaXibrQT
\connect "TutorTogether"
\restrict pfSUsilpqu5iPT3vpf3IYqyfbInsYnmgs3v7sAvNi3oTX8if99QCbDXhaXibrQT

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 7 (class 2615 OID 2200)
-- Name: public; Type: SCHEMA; Schema: -; Owner: pg_database_owner
--

CREATE SCHEMA public;


ALTER SCHEMA public OWNER TO pg_database_owner;

--
-- TOC entry 5368 (class 0 OID 0)
-- Dependencies: 7
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: pg_database_owner
--

COMMENT ON SCHEMA public IS 'standard public schema';


--
-- TOC entry 323 (class 1255 OID 30900)
-- Name: update_tutor_rating(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_tutor_rating() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- Update tutor_profiles with new aggregated rating data
    UPDATE tutor_profiles 
    SET 
        rating = (
            SELECT ROUND(AVG(rating)::numeric, 2) 
            FROM reviews 
            WHERE tutor_id = COALESCE(NEW.tutor_id, OLD.tutor_id)
        ),
        total_reviews = (
            SELECT COUNT(*) 
            FROM reviews 
            WHERE tutor_id = COALESCE(NEW.tutor_id, OLD.tutor_id)
        ),
        updated_at = CURRENT_TIMESTAMP
    WHERE account_id = COALESCE(NEW.tutor_id, OLD.tutor_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.update_tutor_rating() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 224 (class 1259 OID 29882)
-- Name: accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accounts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username public.citext NOT NULL,
    email public.citext NOT NULL,
    password_hash text NOT NULL,
    account_type character varying(20) DEFAULT 'user'::character varying NOT NULL,
    is_active boolean DEFAULT true,
    email_verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    full_name text,
    phone_number text,
    bio text,
    location_city text,
    location_state text,
    profile_image text,
    status character varying(20) DEFAULT 'offline'::character varying
);


ALTER TABLE public.accounts OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 31004)
-- Name: ai_chat_messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_chat_messages (
    id integer NOT NULL,
    user_id uuid NOT NULL,
    role character varying(20) NOT NULL,
    message text NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT ai_chat_messages_role_check CHECK (((role)::text = ANY ((ARRAY['user'::character varying, 'assistant'::character varying, 'system'::character varying])::text[])))
);


ALTER TABLE public.ai_chat_messages OWNER TO postgres;

--
-- TOC entry 5369 (class 0 OID 0)
-- Dependencies: 238
-- Name: TABLE ai_chat_messages; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.ai_chat_messages IS 'Stores conversation history between users and the AI assistant';


--
-- TOC entry 5370 (class 0 OID 0)
-- Dependencies: 238
-- Name: COLUMN ai_chat_messages.role; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_chat_messages.role IS 'Message sender: user, assistant, or system';


--
-- TOC entry 5371 (class 0 OID 0)
-- Dependencies: 238
-- Name: COLUMN ai_chat_messages.message; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON COLUMN public.ai_chat_messages.message IS 'The actual message content';


--
-- TOC entry 237 (class 1259 OID 31003)
-- Name: ai_chat_messages_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.ai_chat_messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.ai_chat_messages_id_seq OWNER TO postgres;

--
-- TOC entry 5372 (class 0 OID 0)
-- Dependencies: 237
-- Name: ai_chat_messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.ai_chat_messages_id_seq OWNED BY public.ai_chat_messages.id;


--
-- TOC entry 234 (class 1259 OID 30604)
-- Name: bookings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.bookings (
    id integer NOT NULL,
    student_id uuid NOT NULL,
    tutor_id uuid NOT NULL,
    booking_date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    duration_minutes integer NOT NULL,
    subject character varying(100) NOT NULL,
    session_type character varying(50) NOT NULL,
    meeting_type character varying(20) NOT NULL,
    location text,
    hourly_rate numeric(10,2) NOT NULL,
    total_amount numeric(10,2) NOT NULL,
    student_notes text,
    tutor_notes text,
    session_notes text,
    payment_status character varying(20) DEFAULT 'pending'::character varying,
    status character varying(20) DEFAULT 'scheduled'::character varying,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp without time zone,
    tutor_response_message text,
    responded_at timestamp without time zone,
    review_submitted boolean DEFAULT false,
    review_submitted_at timestamp without time zone,
    CONSTRAINT bookings_payment_status_check CHECK (((payment_status)::text = ANY ((ARRAY['pending'::character varying, 'paid'::character varying, 'refunded'::character varying])::text[]))),
    CONSTRAINT bookings_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'scheduled'::character varying, 'completed'::character varying, 'cancelled'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.bookings OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 30603)
-- Name: bookings_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.bookings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.bookings_id_seq OWNER TO postgres;

--
-- TOC entry 5373 (class 0 OID 0)
-- Dependencies: 233
-- Name: bookings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.bookings_id_seq OWNED BY public.bookings.id;


--
-- TOC entry 225 (class 1259 OID 29921)
-- Name: messages; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.messages (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    sender_id uuid NOT NULL,
    recipient_id uuid NOT NULL,
    content text NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    is_read boolean DEFAULT false
);


ALTER TABLE public.messages OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 29593)
-- Name: migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migrations (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    executed_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.migrations OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 29599)
-- Name: migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.migrations_id_seq OWNER TO postgres;

--
-- TOC entry 5374 (class 0 OID 0)
-- Dependencies: 223
-- Name: migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.migrations_id_seq OWNED BY public.migrations.id;


--
-- TOC entry 226 (class 1259 OID 29934)
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.password_reset_tokens (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    token character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    used_at timestamp with time zone
);


ALTER TABLE public.password_reset_tokens OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 30856)
-- Name: reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reviews (
    id integer NOT NULL,
    booking_id integer NOT NULL,
    student_id uuid NOT NULL,
    tutor_id uuid NOT NULL,
    rating integer NOT NULL,
    review_text text,
    would_recommend boolean DEFAULT true,
    session_quality_rating integer,
    communication_rating integer,
    punctuality_rating integer,
    helpfulness_rating integer,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reviews_communication_rating_check CHECK (((communication_rating >= 1) AND (communication_rating <= 5))),
    CONSTRAINT reviews_helpfulness_rating_check CHECK (((helpfulness_rating >= 1) AND (helpfulness_rating <= 5))),
    CONSTRAINT reviews_punctuality_rating_check CHECK (((punctuality_rating >= 1) AND (punctuality_rating <= 5))),
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5))),
    CONSTRAINT reviews_session_quality_rating_check CHECK (((session_quality_rating >= 1) AND (session_quality_rating <= 5)))
);


ALTER TABLE public.reviews OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 30855)
-- Name: reviews_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reviews_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reviews_id_seq OWNER TO postgres;

--
-- TOC entry 5375 (class 0 OID 0)
-- Dependencies: 235
-- Name: reviews_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reviews_id_seq OWNED BY public.reviews.id;


--
-- TOC entry 227 (class 1259 OID 29943)
-- Name: student_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.student_profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    account_id uuid NOT NULL,
    current_school text,
    graduation_year integer,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    bio text,
    grade_level character varying(20),
    subjects_of_interest text[],
    learning_goals text,
    total_sessions integer DEFAULT 0
);


ALTER TABLE public.student_profiles OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 30299)
-- Name: subjects; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.subjects (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    category character varying(50) DEFAULT 'academic'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.subjects OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 30234)
-- Name: tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tasks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    title character varying(255) NOT NULL,
    description text,
    subject character varying(100) NOT NULL,
    priority character varying(20) DEFAULT 'medium'::character varying,
    estimated_time character varying(50),
    due_date date NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying,
    progress integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT tasks_priority_check CHECK (((priority)::text = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying])::text[]))),
    CONSTRAINT tasks_progress_check CHECK (((progress >= 0) AND (progress <= 100))),
    CONSTRAINT tasks_status_check CHECK (((status)::text = ANY ((ARRAY['pending'::character varying, 'started'::character varying, 'in-progress'::character varying, 'completed'::character varying])::text[])))
);


ALTER TABLE public.tasks OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 30326)
-- Name: tutor_availability; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tutor_availability (
    id integer NOT NULL,
    tutor_id uuid NOT NULL,
    date date NOT NULL,
    start_time time without time zone NOT NULL,
    end_time time without time zone NOT NULL,
    duration_minutes integer DEFAULT 60 NOT NULL,
    hourly_rate numeric(10,2) NOT NULL,
    is_booked boolean DEFAULT false,
    booking_id integer,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


ALTER TABLE public.tutor_availability OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 30325)
-- Name: tutor_availability_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tutor_availability_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tutor_availability_id_seq OWNER TO postgres;

--
-- TOC entry 5376 (class 0 OID 0)
-- Dependencies: 231
-- Name: tutor_availability_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tutor_availability_id_seq OWNED BY public.tutor_availability.id;


--
-- TOC entry 228 (class 1259 OID 29982)
-- Name: tutor_profiles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tutor_profiles (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    account_id uuid NOT NULL,
    hourly_rate numeric(6,2),
    subjects_taught text[],
    is_verified boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    bio text,
    rating numeric(3,2) DEFAULT 0.0,
    total_reviews integer DEFAULT 0,
    total_sessions integer DEFAULT 0,
    response_time_avg integer DEFAULT 0,
    is_online boolean DEFAULT false,
    available_days text[] DEFAULT '{}'::text[],
    approval_status character varying(20) DEFAULT 'pending'::character varying,
    admin_notes text,
    approved_at timestamp without time zone,
    approved_by uuid,
    CONSTRAINT tutor_profiles_approval_status_check CHECK (((approval_status)::text = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying])::text[])))
);


ALTER TABLE public.tutor_profiles OWNER TO postgres;

--
-- TOC entry 5108 (class 2604 OID 31007)
-- Name: ai_chat_messages id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_chat_messages ALTER COLUMN id SET DEFAULT nextval('public.ai_chat_messages_id_seq'::regclass);


--
-- TOC entry 5098 (class 2604 OID 30607)
-- Name: bookings id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings ALTER COLUMN id SET DEFAULT nextval('public.bookings_id_seq'::regclass);


--
-- TOC entry 5054 (class 2604 OID 30034)
-- Name: migrations id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations ALTER COLUMN id SET DEFAULT nextval('public.migrations_id_seq'::regclass);


--
-- TOC entry 5104 (class 2604 OID 30859)
-- Name: reviews id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews ALTER COLUMN id SET DEFAULT nextval('public.reviews_id_seq'::regclass);


--
-- TOC entry 5093 (class 2604 OID 30329)
-- Name: tutor_availability id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutor_availability ALTER COLUMN id SET DEFAULT nextval('public.tutor_availability_id_seq'::regclass);


--
-- TOC entry 5128 (class 2606 OID 30036)
-- Name: accounts accounts_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_email_key UNIQUE (email);


--
-- TOC entry 5130 (class 2606 OID 30038)
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- TOC entry 5132 (class 2606 OID 30040)
-- Name: accounts accounts_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_username_key UNIQUE (username);


--
-- TOC entry 5193 (class 2606 OID 31018)
-- Name: ai_chat_messages ai_chat_messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_chat_messages
    ADD CONSTRAINT ai_chat_messages_pkey PRIMARY KEY (id);


--
-- TOC entry 5179 (class 2606 OID 30630)
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- TOC entry 5141 (class 2606 OID 30048)
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- TOC entry 5124 (class 2606 OID 29642)
-- Name: migrations migrations_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_name_key UNIQUE (name);


--
-- TOC entry 5126 (class 2606 OID 29644)
-- Name: migrations migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migrations
    ADD CONSTRAINT migrations_pkey PRIMARY KEY (id);


--
-- TOC entry 5145 (class 2606 OID 30050)
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- TOC entry 5147 (class 2606 OID 30052)
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- TOC entry 5189 (class 2606 OID 30878)
-- Name: reviews reviews_booking_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_booking_id_key UNIQUE (booking_id);


--
-- TOC entry 5191 (class 2606 OID 30876)
-- Name: reviews reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 5151 (class 2606 OID 30054)
-- Name: student_profiles student_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT student_profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 5168 (class 2606 OID 30313)
-- Name: subjects subjects_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_name_key UNIQUE (name);


--
-- TOC entry 5170 (class 2606 OID 30311)
-- Name: subjects subjects_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.subjects
    ADD CONSTRAINT subjects_pkey PRIMARY KEY (id);


--
-- TOC entry 5164 (class 2606 OID 30254)
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- TOC entry 5175 (class 2606 OID 30344)
-- Name: tutor_availability tutor_availability_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutor_availability
    ADD CONSTRAINT tutor_availability_pkey PRIMARY KEY (id);


--
-- TOC entry 5177 (class 2606 OID 30346)
-- Name: tutor_availability tutor_availability_tutor_id_date_start_time_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutor_availability
    ADD CONSTRAINT tutor_availability_tutor_id_date_start_time_key UNIQUE (tutor_id, date, start_time);


--
-- TOC entry 5157 (class 2606 OID 30062)
-- Name: tutor_profiles tutor_profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutor_profiles
    ADD CONSTRAINT tutor_profiles_pkey PRIMARY KEY (id);


--
-- TOC entry 5133 (class 1259 OID 30073)
-- Name: idx_accounts_email; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_accounts_email ON public.accounts USING btree (email);


--
-- TOC entry 5134 (class 1259 OID 30074)
-- Name: idx_accounts_type; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_accounts_type ON public.accounts USING btree (account_type);


--
-- TOC entry 5135 (class 1259 OID 30075)
-- Name: idx_accounts_username; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_accounts_username ON public.accounts USING btree (username);


--
-- TOC entry 5194 (class 1259 OID 31025)
-- Name: idx_ai_chat_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_chat_created_at ON public.ai_chat_messages USING btree (created_at DESC);


--
-- TOC entry 5195 (class 1259 OID 31026)
-- Name: idx_ai_chat_user_created; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_chat_user_created ON public.ai_chat_messages USING btree (user_id, created_at DESC);


--
-- TOC entry 5196 (class 1259 OID 31024)
-- Name: idx_ai_chat_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_ai_chat_user_id ON public.ai_chat_messages USING btree (user_id);


--
-- TOC entry 5180 (class 1259 OID 30661)
-- Name: idx_bookings_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_status ON public.bookings USING btree (status);


--
-- TOC entry 5181 (class 1259 OID 30659)
-- Name: idx_bookings_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_student_id ON public.bookings USING btree (student_id);


--
-- TOC entry 5182 (class 1259 OID 30660)
-- Name: idx_bookings_tutor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_bookings_tutor_id ON public.bookings USING btree (tutor_id);


--
-- TOC entry 5136 (class 1259 OID 30081)
-- Name: idx_messages_conversation; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_conversation ON public.messages USING btree (sender_id, recipient_id);


--
-- TOC entry 5137 (class 1259 OID 30082)
-- Name: idx_messages_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_created_at ON public.messages USING btree (created_at);


--
-- TOC entry 5138 (class 1259 OID 30083)
-- Name: idx_messages_recipient; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_recipient ON public.messages USING btree (recipient_id);


--
-- TOC entry 5139 (class 1259 OID 30084)
-- Name: idx_messages_sender; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_messages_sender ON public.messages USING btree (sender_id);


--
-- TOC entry 5142 (class 1259 OID 30085)
-- Name: idx_password_reset_tokens_token; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_reset_tokens_token ON public.password_reset_tokens USING btree (token);


--
-- TOC entry 5143 (class 1259 OID 30086)
-- Name: idx_password_reset_tokens_user; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_password_reset_tokens_user ON public.password_reset_tokens USING btree (user_id);


--
-- TOC entry 5183 (class 1259 OID 30896)
-- Name: idx_reviews_booking_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_booking_id ON public.reviews USING btree (booking_id);


--
-- TOC entry 5184 (class 1259 OID 30898)
-- Name: idx_reviews_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_created_at ON public.reviews USING btree (created_at);


--
-- TOC entry 5185 (class 1259 OID 30897)
-- Name: idx_reviews_rating; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_rating ON public.reviews USING btree (rating);


--
-- TOC entry 5186 (class 1259 OID 30895)
-- Name: idx_reviews_student_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_student_id ON public.reviews USING btree (student_id);


--
-- TOC entry 5187 (class 1259 OID 30894)
-- Name: idx_reviews_tutor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_reviews_tutor_id ON public.reviews USING btree (tutor_id);


--
-- TOC entry 5148 (class 1259 OID 30087)
-- Name: idx_student_profiles_account; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_student_profiles_account ON public.student_profiles USING btree (account_id);


--
-- TOC entry 5149 (class 1259 OID 30088)
-- Name: idx_student_profiles_school; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_student_profiles_school ON public.student_profiles USING btree (current_school);


--
-- TOC entry 5165 (class 1259 OID 30315)
-- Name: idx_subjects_category; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subjects_category ON public.subjects USING btree (category);


--
-- TOC entry 5166 (class 1259 OID 30314)
-- Name: idx_subjects_name; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_subjects_name ON public.subjects USING btree (name);


--
-- TOC entry 5158 (class 1259 OID 30264)
-- Name: idx_tasks_created_at; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_created_at ON public.tasks USING btree (created_at);


--
-- TOC entry 5159 (class 1259 OID 30263)
-- Name: idx_tasks_due_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_due_date ON public.tasks USING btree (due_date);


--
-- TOC entry 5160 (class 1259 OID 30262)
-- Name: idx_tasks_priority; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_priority ON public.tasks USING btree (priority);


--
-- TOC entry 5161 (class 1259 OID 30261)
-- Name: idx_tasks_status; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_status ON public.tasks USING btree (status);


--
-- TOC entry 5162 (class 1259 OID 30260)
-- Name: idx_tasks_user_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tasks_user_id ON public.tasks USING btree (user_id);


--
-- TOC entry 5171 (class 1259 OID 30401)
-- Name: idx_tutor_availability_date; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tutor_availability_date ON public.tutor_availability USING btree (date);


--
-- TOC entry 5172 (class 1259 OID 30402)
-- Name: idx_tutor_availability_is_booked; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tutor_availability_is_booked ON public.tutor_availability USING btree (is_booked);


--
-- TOC entry 5173 (class 1259 OID 30400)
-- Name: idx_tutor_availability_tutor_id; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tutor_availability_tutor_id ON public.tutor_availability USING btree (tutor_id);


--
-- TOC entry 5152 (class 1259 OID 30096)
-- Name: idx_tutor_profiles_account; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX idx_tutor_profiles_account ON public.tutor_profiles USING btree (account_id);


--
-- TOC entry 5153 (class 1259 OID 30097)
-- Name: idx_tutor_profiles_rate; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tutor_profiles_rate ON public.tutor_profiles USING btree (hourly_rate);


--
-- TOC entry 5154 (class 1259 OID 30098)
-- Name: idx_tutor_profiles_subjects; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tutor_profiles_subjects ON public.tutor_profiles USING gin (subjects_taught);


--
-- TOC entry 5155 (class 1259 OID 30099)
-- Name: idx_tutor_profiles_verified; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX idx_tutor_profiles_verified ON public.tutor_profiles USING btree (is_verified);


--
-- TOC entry 5212 (class 2620 OID 30986)
-- Name: reviews trigger_update_tutor_rating_delete; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_tutor_rating_delete AFTER DELETE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_tutor_rating();


--
-- TOC entry 5213 (class 2620 OID 30984)
-- Name: reviews trigger_update_tutor_rating_insert; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_tutor_rating_insert AFTER INSERT ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_tutor_rating();


--
-- TOC entry 5214 (class 2620 OID 30985)
-- Name: reviews trigger_update_tutor_rating_update; Type: TRIGGER; Schema: public; Owner: postgres
--

CREATE TRIGGER trigger_update_tutor_rating_update AFTER UPDATE ON public.reviews FOR EACH ROW EXECUTE FUNCTION public.update_tutor_rating();


--
-- TOC entry 5211 (class 2606 OID 31019)
-- Name: ai_chat_messages ai_chat_messages_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_chat_messages
    ADD CONSTRAINT ai_chat_messages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- TOC entry 5206 (class 2606 OID 30631)
-- Name: bookings bookings_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- TOC entry 5207 (class 2606 OID 30636)
-- Name: bookings bookings_tutor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- TOC entry 5204 (class 2606 OID 30651)
-- Name: tutor_availability fk_tutor_availability_booking; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutor_availability
    ADD CONSTRAINT fk_tutor_availability_booking FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL;


--
-- TOC entry 5197 (class 2606 OID 30132)
-- Name: messages messages_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- TOC entry 5198 (class 2606 OID 30137)
-- Name: messages messages_sender_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- TOC entry 5199 (class 2606 OID 30142)
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- TOC entry 5208 (class 2606 OID 30879)
-- Name: reviews reviews_booking_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_booking_id_fkey FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;


--
-- TOC entry 5209 (class 2606 OID 30884)
-- Name: reviews reviews_student_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_student_id_fkey FOREIGN KEY (student_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- TOC entry 5210 (class 2606 OID 30889)
-- Name: reviews reviews_tutor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reviews
    ADD CONSTRAINT reviews_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- TOC entry 5200 (class 2606 OID 30147)
-- Name: student_profiles student_profiles_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.student_profiles
    ADD CONSTRAINT student_profiles_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- TOC entry 5203 (class 2606 OID 30255)
-- Name: tasks tasks_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- TOC entry 5205 (class 2606 OID 30347)
-- Name: tutor_availability tutor_availability_tutor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutor_availability
    ADD CONSTRAINT tutor_availability_tutor_id_fkey FOREIGN KEY (tutor_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- TOC entry 5201 (class 2606 OID 30162)
-- Name: tutor_profiles tutor_profiles_account_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutor_profiles
    ADD CONSTRAINT tutor_profiles_account_id_fkey FOREIGN KEY (account_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- TOC entry 5202 (class 2606 OID 31029)
-- Name: tutor_profiles tutor_profiles_approved_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tutor_profiles
    ADD CONSTRAINT tutor_profiles_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.accounts(id);


-- Completed on 2025-11-25 01:55:45

--
-- PostgreSQL database dump complete
--

\unrestrict pfSUsilpqu5iPT3vpf3IYqyfbInsYnmgs3v7sAvNi3oTX8if99QCbDXhaXibrQT


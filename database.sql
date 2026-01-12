BEGIN;


CREATE TABLE IF NOT EXISTS public.calendar_events
(
    id serial NOT NULL,
    pet_id integer NOT NULL,
    type_id integer,
    title text COLLATE pg_catalog."default" NOT NULL,
    description text COLLATE pg_catalog."default",
    start_date date NOT NULL,
    end_date date,
    repeat_rule_min integer,
    remind_before_min integer,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT calendar_events_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.favorite_locations
(
    user_id uuid NOT NULL,
    location_id integer NOT NULL,
    created_at timestamp without time zone NOT NULL DEFAULT now(),
    CONSTRAINT favorite_locations_pkey PRIMARY KEY (user_id, location_id)
);

CREATE TABLE IF NOT EXISTS public.locations
(
    id serial NOT NULL,
    location_id integer,
    name text COLLATE pg_catalog."default" NOT NULL,
    longitude double precision NOT NULL,
    latitude double precision NOT NULL,
    phone_num text COLLATE pg_catalog."default",
    address text COLLATE pg_catalog."default",
    description text COLLATE pg_catalog."default",
    CONSTRAINT locations_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.pet_medication
(
    id serial NOT NULL,
    pet_id integer NOT NULL,
    med_name text COLLATE pg_catalog."default" NOT NULL,
    medication_date date NOT NULL,
    expire_date date,
    notes text COLLATE pg_catalog."default",
    costs numeric(10, 2),
    CONSTRAINT pet_medication_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.pet_vaccination
(
    id serial NOT NULL,
    pet_id integer NOT NULL,
    vac_name text COLLATE pg_catalog."default" NOT NULL,
    vaccination_date date NOT NULL,
    expire_date date,
    notes text COLLATE pg_catalog."default",
    costs numeric(10, 2),
    CONSTRAINT pet_vaccination_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.pets
(
    id serial NOT NULL,
    owner_id uuid NOT NULL,
    name text COLLATE pg_catalog."default" NOT NULL,
    type text COLLATE pg_catalog."default",
    breed text COLLATE pg_catalog."default",
    sex text COLLATE pg_catalog."default",
    birthdate date,
    notes text COLLATE pg_catalog."default",
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT pets_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.route
(
    id serial NOT NULL,
    pet_id integer NOT NULL,
    user_id uuid NOT NULL,
    started_at timestamp with time zone NOT NULL,
    ended_at timestamp with time zone NOT NULL,
    distance_m integer,
    duration_s integer,
    avg_speed_mps numeric(8, 3),
    CONSTRAINT route_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.user_session
(
    id serial NOT NULL,
    user_id uuid NOT NULL,
    platform text COLLATE pg_catalog."default",
    session_time timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT user_session_pkey PRIMARY KEY (id)
);

CREATE TABLE IF NOT EXISTS public.users
(
    id uuid NOT NULL DEFAULT uuid_generate_v4(),
    email text COLLATE pg_catalog."default" NOT NULL,
    username text COLLATE pg_catalog."default" NOT NULL,
    name text COLLATE pg_catalog."default",
    password_hash text COLLATE pg_catalog."default" NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    last_activity timestamp with time zone,
    CONSTRAINT users_pkey PRIMARY KEY (id),
    CONSTRAINT users_email_key UNIQUE (email),
    CONSTRAINT users_username_key UNIQUE (username)
);

CREATE TABLE IF NOT EXISTS public.vet_visit_types
(
    id serial NOT NULL,
    name text COLLATE pg_catalog."default" NOT NULL,
    CONSTRAINT vet_visit_types_pkey PRIMARY KEY (id),
    CONSTRAINT vet_visit_types_name_key UNIQUE (name)
);

CREATE TABLE IF NOT EXISTS public.vet_visits
(
    id serial NOT NULL,
    pet_id integer NOT NULL,
    vet_name text COLLATE pg_catalog."default",
    location text COLLATE pg_catalog."default",
    type_id integer,
    visit_date date NOT NULL,
    notes text COLLATE pg_catalog."default",
    costs numeric(10, 2),
    CONSTRAINT vet_visits_pkey PRIMARY KEY (id)
);

ALTER TABLE IF EXISTS public.calendar_events
    ADD CONSTRAINT calendar_events_pet_id_fkey FOREIGN KEY (pet_id)
    REFERENCES public.pets (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS public.favorite_locations
    ADD CONSTRAINT fk_favorite_location FOREIGN KEY (location_id)
    REFERENCES public.locations (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS public.favorite_locations
    ADD CONSTRAINT fk_favorite_user FOREIGN KEY (user_id)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS public.pet_medication
    ADD CONSTRAINT pet_medication_pet_id_fkey FOREIGN KEY (pet_id)
    REFERENCES public.pets (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS public.pet_vaccination
    ADD CONSTRAINT pet_vaccination_pet_id_fkey FOREIGN KEY (pet_id)
    REFERENCES public.pets (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS public.pets
    ADD CONSTRAINT pets_owner_id_fkey FOREIGN KEY (owner_id)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS public.route
    ADD CONSTRAINT route_pet_id_fkey FOREIGN KEY (pet_id)
    REFERENCES public.pets (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS public.route
    ADD CONSTRAINT route_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS public.user_session
    ADD CONSTRAINT user_session_user_id_fkey FOREIGN KEY (user_id)
    REFERENCES public.users (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS public.vet_visits
    ADD CONSTRAINT vet_visits_pet_id_fkey FOREIGN KEY (pet_id)
    REFERENCES public.pets (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE CASCADE;


ALTER TABLE IF EXISTS public.vet_visits
    ADD CONSTRAINT vet_visits_type_id_fkey FOREIGN KEY (type_id)
    REFERENCES public.vet_visit_types (id) MATCH SIMPLE
    ON UPDATE NO ACTION
    ON DELETE NO ACTION;

END;
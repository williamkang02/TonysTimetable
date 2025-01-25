revoke delete on table "public"."Users" from "anon";

revoke insert on table "public"."Users" from "anon";

revoke references on table "public"."Users" from "anon";

revoke select on table "public"."Users" from "anon";

revoke trigger on table "public"."Users" from "anon";

revoke truncate on table "public"."Users" from "anon";

revoke update on table "public"."Users" from "anon";

revoke delete on table "public"."Users" from "authenticated";

revoke insert on table "public"."Users" from "authenticated";

revoke references on table "public"."Users" from "authenticated";

revoke select on table "public"."Users" from "authenticated";

revoke trigger on table "public"."Users" from "authenticated";

revoke truncate on table "public"."Users" from "authenticated";

revoke update on table "public"."Users" from "authenticated";

revoke delete on table "public"."Users" from "service_role";

revoke insert on table "public"."Users" from "service_role";

revoke references on table "public"."Users" from "service_role";

revoke select on table "public"."Users" from "service_role";

revoke trigger on table "public"."Users" from "service_role";

revoke truncate on table "public"."Users" from "service_role";

revoke update on table "public"."Users" from "service_role";

alter table "public"."Classes" drop constraint "Classes_end_time_check";

alter table "public"."Classes" drop constraint "Classes_time_check";

alter table "public"."Staff" drop constraint "Staff_university_email_key";

alter table "public"."Users" drop constraint "Users_email_key";

alter table "public"."Users" drop constraint "Users_id_key";

drop function if exists "public"."handle_new_user"();

alter table "public"."Users" drop constraint "Users_pkey";

drop index if exists "public"."Staff_university_email_key";

drop index if exists "public"."Users_email_key";

drop index if exists "public"."Users_id_key";

drop index if exists "public"."Users_pkey";

drop table "public"."Users";

alter table "public"."Classes" drop column "end_time";

alter table "public"."Classes" add column "duration_30mins" bigint not null;

alter table "public"."Classes" alter column "staff_id" set not null;

alter table "public"."Classes" alter column "start_time" set data type bigint using "start_time"::bigint;

alter table "public"."Courses" add column "course_code" character varying;

alter table "public"."Staff" alter column "university_email" drop not null;

alter table "public"."StudentSubject" disable row level security;

alter table "public"."Students" drop column "personal_email";

alter table "public"."Students" alter column "university_email" drop not null;

alter table "public"."Subjects" alter column "semester" drop not null;

alter table "public"."Subjects" alter column "year" drop not null;

alter table "public"."Classes" add constraint "Classes_start_time_check" CHECK (((0 <= start_time) AND (start_time < 336))) not valid;

alter table "public"."Classes" validate constraint "Classes_start_time_check";



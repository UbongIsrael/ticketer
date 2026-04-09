import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1775196281904 implements MigrationInterface {
    name = 'InitialSchema1775196281904'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying, "phone" character varying, "name" character varying, "avatar_url" character varying, "auth_provider" character varying, "capabilities" character varying array NOT NULL DEFAULT '{BUYER}', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "host_id" uuid NOT NULL, "title" character varying NOT NULL, "description" text NOT NULL, "slug" character varying NOT NULL, "cover_image_url" character varying, "venue_name" character varying NOT NULL, "venue_address" character varying NOT NULL, "latitude" double precision, "longitude" double precision, "city" character varying NOT NULL, "state" character varying NOT NULL, "event_type" character varying NOT NULL, "starts_at" TIMESTAMP WITH TIME ZONE NOT NULL, "ends_at" TIMESTAMP WITH TIME ZONE NOT NULL, "status" character varying NOT NULL, "currency" character varying NOT NULL DEFAULT 'NGN', "metadata" jsonb, "search_vector" tsvector, "published_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_05bd884c03d3f424e2204bd14cd" UNIQUE ("slug"), CONSTRAINT "PK_40731c7151fe4be3116e45ddf73" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_events_city_date" ON "events" ("city", "starts_at") `);
        await queryRunner.query(`CREATE INDEX "idx_events_search" ON "events" ("search_vector") `);
        await queryRunner.query(`CREATE TABLE "ticket_tiers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_id" uuid NOT NULL, "name" character varying NOT NULL, "price_minor" integer NOT NULL, "total_quantity" integer NOT NULL, "sold_count" integer NOT NULL DEFAULT '0', "description" text, "perks" jsonb, "sale_starts_at" TIMESTAMP WITH TIME ZONE, "sale_ends_at" TIMESTAMP WITH TIME ZONE, "sort_order" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_917cfec124fa5e8ce04d1e7b865" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "tickets" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_id" uuid NOT NULL, "tier_id" uuid NOT NULL, "owner_id" uuid, "ticket_code" character varying, "status" character varying NOT NULL, "qr_payload" character varying, "payment_id" uuid, "refund_id" uuid, "reserved_at" TIMESTAMP WITH TIME ZONE, "paid_at" TIMESTAMP WITH TIME ZONE, "issued_at" TIMESTAMP WITH TIME ZONE, "validated_at" TIMESTAMP WITH TIME ZONE, "voided_at" TIMESTAMP WITH TIME ZONE, "expires_at" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_40e7b62bf74bc61a7d74d682936" UNIQUE ("ticket_code"), CONSTRAINT "PK_343bc942ae261cf7a1377f48fd0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "idx_tickets_owner" ON "tickets" ("owner_id") `);
        await queryRunner.query(`CREATE INDEX "idx_tickets_code" ON "tickets" ("ticket_code") `);
        await queryRunner.query(`CREATE INDEX "idx_tickets_reserved" ON "tickets" ("expires_at") WHERE status = 'reserved'`);
        await queryRunner.query(`CREATE INDEX "idx_tickets_event_status" ON "tickets" ("event_id", "status") `);
        await queryRunner.query(`CREATE TABLE "refunds" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ticket_id" uuid NOT NULL, "user_id" uuid NOT NULL, "type" character varying NOT NULL, "original_amount_minor" integer NOT NULL, "refund_amount_minor" integer NOT NULL, "platform_margin_minor" integer NOT NULL, "status" character varying NOT NULL, "provider" character varying NOT NULL, "provider_reference" character varying, "failure_reason" character varying, "retry_count" integer NOT NULL DEFAULT '0', "settled_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5106efb01eeda7e49a78b869738" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "payment_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "provider_reference" character varying NOT NULL, "event_type" character varying NOT NULL, "payload" jsonb NOT NULL, "processed_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_0f379b016b911717365790dcc68" UNIQUE ("provider_reference"), CONSTRAINT "PK_9f1d16fc78b33e676940a32e8b5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "ticket_id" uuid NOT NULL, "ticket_price_minor" integer NOT NULL, "buyer_service_fee_minor" integer NOT NULL, "total_charged_minor" integer NOT NULL, "currency" character varying NOT NULL DEFAULT 'NGN', "provider" character varying NOT NULL, "provider_reference" character varying NOT NULL, "status" character varying NOT NULL, "payment_channel" character varying NOT NULL, "provider_metadata" jsonb, "completed_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_de9cb5e46ac2a317daf1e201d24" UNIQUE ("provider_reference"), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "kyc_records" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "provider" character varying NOT NULL, "provider_reference" character varying NOT NULL, "status" character varying NOT NULL, "id_type" character varying NOT NULL, "verification_data" jsonb, "bank_account_number" character varying, "bank_code" character varying, "bank_name" character varying, "verified_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_f64f4ece81b8b256d296999858d" UNIQUE ("provider_reference"), CONSTRAINT "PK_116991f893d637ee173b9de8ed0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "notification_log" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "user_id" uuid NOT NULL, "channel" character varying NOT NULL, "type" character varying NOT NULL, "status" character varying NOT NULL, "provider_message_id" character varying, "payload" jsonb, "sent_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_6f761cfbbd064e0f326960877d6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "event_announcements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_id" uuid NOT NULL, "author_id" uuid NOT NULL, "title" character varying NOT NULL, "body" text NOT NULL, "channel" character varying NOT NULL, "sent_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b065d05dce58443282430cfd345" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "approval_requests" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_id" uuid NOT NULL, "requester_id" uuid NOT NULL, "change_type" character varying NOT NULL, "proposed_changes" jsonb NOT NULL, "status" character varying NOT NULL, "reviewer_id" uuid, "review_notes" text, "reviewed_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_484806bb8ff331b851fc75973c0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "platform_config" ("key" character varying NOT NULL, "value" jsonb NOT NULL, "description" text, "updated_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e288d39f7103fdc2a057f96b62e" PRIMARY KEY ("key"))`);
        await queryRunner.query(`CREATE TABLE "host_settlements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "event_id" uuid NOT NULL, "host_id" uuid NOT NULL, "gross_revenue_minor" integer NOT NULL, "host_commission_minor" integer NOT NULL, "net_payout_minor" integer NOT NULL, "partial_payout_minor" integer NOT NULL DEFAULT '0', "final_payout_minor" integer NOT NULL DEFAULT '0', "commission_tier" character varying NOT NULL, "commission_rate" numeric NOT NULL, "status" character varying NOT NULL, "provider_reference" character varying, "partial_paid_at" TIMESTAMP WITH TIME ZONE, "settled_at" TIMESTAMP WITH TIME ZONE, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_01e5fd10a3cf3d1dfe310416ae6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "events" ADD CONSTRAINT "FK_a612b523901cc5dd938ff3bdb03" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ticket_tiers" ADD CONSTRAINT "FK_73e479ba60b35caae8249e94c81" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tickets" ADD CONSTRAINT "FK_bd5387c23fb40ae7e3526ad75ea" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tickets" ADD CONSTRAINT "FK_0d8702c7e22f523bcd004d58219" FOREIGN KEY ("tier_id") REFERENCES "ticket_tiers"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tickets" ADD CONSTRAINT "FK_5051ef7bf7d664ad1d081a110e6" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "refunds" ADD CONSTRAINT "FK_c76fa2e3f5368258258e78fadf8" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "refunds" ADD CONSTRAINT "FK_3be163f822a41931bb73c243d82" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_427785468fb7d2733f59e7d7d39" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_aac3e9d7b82ecaeb355f2f4e0d1" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "kyc_records" ADD CONSTRAINT "FK_d20b5a5f164a27f1a823596d192" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notification_log" ADD CONSTRAINT "FK_2318594e750647311b24da4ae5f" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event_announcements" ADD CONSTRAINT "FK_2df1df8ffbc22c818c2ffd6af81" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event_announcements" ADD CONSTRAINT "FK_bdddd77f72d2767c59fe394b65b" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "approval_requests" ADD CONSTRAINT "FK_87d792647b4b794891a093790bb" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "approval_requests" ADD CONSTRAINT "FK_f4a45b5db5843bfa288d63e2ff4" FOREIGN KEY ("requester_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "approval_requests" ADD CONSTRAINT "FK_de19c7d19cfbcf9130d1f6e837f" FOREIGN KEY ("reviewer_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "platform_config" ADD CONSTRAINT "FK_b2b12e88196a0d6ee61a359542c" FOREIGN KEY ("updated_by") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "host_settlements" ADD CONSTRAINT "FK_95e24dbd4b6d72b41014f4746dd" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "host_settlements" ADD CONSTRAINT "FK_83b2c428d2d6f0356bf544c9a90" FOREIGN KEY ("host_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "host_settlements" DROP CONSTRAINT "FK_83b2c428d2d6f0356bf544c9a90"`);
        await queryRunner.query(`ALTER TABLE "host_settlements" DROP CONSTRAINT "FK_95e24dbd4b6d72b41014f4746dd"`);
        await queryRunner.query(`ALTER TABLE "platform_config" DROP CONSTRAINT "FK_b2b12e88196a0d6ee61a359542c"`);
        await queryRunner.query(`ALTER TABLE "approval_requests" DROP CONSTRAINT "FK_de19c7d19cfbcf9130d1f6e837f"`);
        await queryRunner.query(`ALTER TABLE "approval_requests" DROP CONSTRAINT "FK_f4a45b5db5843bfa288d63e2ff4"`);
        await queryRunner.query(`ALTER TABLE "approval_requests" DROP CONSTRAINT "FK_87d792647b4b794891a093790bb"`);
        await queryRunner.query(`ALTER TABLE "event_announcements" DROP CONSTRAINT "FK_bdddd77f72d2767c59fe394b65b"`);
        await queryRunner.query(`ALTER TABLE "event_announcements" DROP CONSTRAINT "FK_2df1df8ffbc22c818c2ffd6af81"`);
        await queryRunner.query(`ALTER TABLE "notification_log" DROP CONSTRAINT "FK_2318594e750647311b24da4ae5f"`);
        await queryRunner.query(`ALTER TABLE "kyc_records" DROP CONSTRAINT "FK_d20b5a5f164a27f1a823596d192"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_aac3e9d7b82ecaeb355f2f4e0d1"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_427785468fb7d2733f59e7d7d39"`);
        await queryRunner.query(`ALTER TABLE "refunds" DROP CONSTRAINT "FK_3be163f822a41931bb73c243d82"`);
        await queryRunner.query(`ALTER TABLE "refunds" DROP CONSTRAINT "FK_c76fa2e3f5368258258e78fadf8"`);
        await queryRunner.query(`ALTER TABLE "tickets" DROP CONSTRAINT "FK_5051ef7bf7d664ad1d081a110e6"`);
        await queryRunner.query(`ALTER TABLE "tickets" DROP CONSTRAINT "FK_0d8702c7e22f523bcd004d58219"`);
        await queryRunner.query(`ALTER TABLE "tickets" DROP CONSTRAINT "FK_bd5387c23fb40ae7e3526ad75ea"`);
        await queryRunner.query(`ALTER TABLE "ticket_tiers" DROP CONSTRAINT "FK_73e479ba60b35caae8249e94c81"`);
        await queryRunner.query(`ALTER TABLE "events" DROP CONSTRAINT "FK_a612b523901cc5dd938ff3bdb03"`);
        await queryRunner.query(`DROP TABLE "host_settlements"`);
        await queryRunner.query(`DROP TABLE "platform_config"`);
        await queryRunner.query(`DROP TABLE "approval_requests"`);
        await queryRunner.query(`DROP TABLE "event_announcements"`);
        await queryRunner.query(`DROP TABLE "notification_log"`);
        await queryRunner.query(`DROP TABLE "kyc_records"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`DROP TABLE "payment_events"`);
        await queryRunner.query(`DROP TABLE "refunds"`);
        await queryRunner.query(`DROP INDEX "public"."idx_tickets_event_status"`);
        await queryRunner.query(`DROP INDEX "public"."idx_tickets_reserved"`);
        await queryRunner.query(`DROP INDEX "public"."idx_tickets_code"`);
        await queryRunner.query(`DROP INDEX "public"."idx_tickets_owner"`);
        await queryRunner.query(`DROP TABLE "tickets"`);
        await queryRunner.query(`DROP TABLE "ticket_tiers"`);
        await queryRunner.query(`DROP INDEX "public"."idx_events_search"`);
        await queryRunner.query(`DROP INDEX "public"."idx_events_city_date"`);
        await queryRunner.query(`DROP TABLE "events"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}

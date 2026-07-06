CREATE TABLE "user_exp_events" (
  "user_exp_event_id" SERIAL NOT NULL,
  "user_id" INTEGER NOT NULL,
  "action" VARCHAR(50) NOT NULL,
  "amount" INTEGER NOT NULL,
  "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "user_exp_events_pkey" PRIMARY KEY ("user_exp_event_id")
);

CREATE INDEX "user_exp_events_user_id_created_at_idx" ON "user_exp_events"("user_id", "created_at");

ALTER TABLE "user_exp_events"
  ADD CONSTRAINT "user_exp_events_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("user_id")
  ON DELETE CASCADE ON UPDATE CASCADE;

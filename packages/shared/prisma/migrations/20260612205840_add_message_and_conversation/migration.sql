-- CreateTable
CREATE TABLE "messages" (
    "message_id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "message_text" TEXT NOT NULL,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "user_id" INTEGER NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("message_id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "conversation_id" SERIAL NOT NULL,
    "public_id" UUID NOT NULL,
    "user_one_id" INTEGER NOT NULL,
    "user_two_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("conversation_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "messages_public_id_key" ON "messages"("public_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_idx" ON "messages"("conversation_id");

-- CreateIndex
CREATE INDEX "messages_user_id_idx" ON "messages"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_public_id_key" ON "conversations"("public_id");

-- CreateIndex
CREATE INDEX "conversations_user_one_id_idx" ON "conversations"("user_one_id");

-- CreateIndex
CREATE INDEX "conversations_user_two_id_idx" ON "conversations"("user_two_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversations_user_one_id_user_two_id_key" ON "conversations"("user_one_id", "user_two_id");

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("conversation_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_one_id_fkey" FOREIGN KEY ("user_one_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user_two_id_fkey" FOREIGN KEY ("user_two_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

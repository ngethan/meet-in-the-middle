import { db, trips } from "@/database/client";

export async function POST(request: Request) {
  const body = await request.json();

  const data = await db.insert(trips).values({
    id: body.newTripId,
    conversationId: body.chatId,
    creatorId: body.id,
    name: body.newTripName,
    createdAt: new Date(),
    startDate: body.startDate.toISOString(), // ✅ Store start date with time
    endDate: body.endDate.toISOString(), // ✅ Store end date with time
  });
}

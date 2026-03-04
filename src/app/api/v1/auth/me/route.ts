import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/server/auth/getUserFromRequest";
import { getUserById } from "@/server/inmemory/usersRepo";

export async function GET() {
  const userId = await getUserFromRequest();
  if (!userId) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }
  const user = getUserById(userId);
  if (!user) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }
  return NextResponse.json(
    { userId: user.userId, login: user.login },
    { status: 200 }
  );
}

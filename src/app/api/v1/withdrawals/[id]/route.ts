import { NextResponse } from "next/server";
import { getWithdrawal } from "@/server/inmemory/withdrawalsRepo";
import { getUserFromRequest } from "@/server/auth/getUserFromRequest";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const userId = await getUserFromRequest();
  if (!userId) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  const { id } = await params;
  const result = getWithdrawal(id, userId);
  if (result.type === "not_found") {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }
  return NextResponse.json(result.data, { status: 200 });
}

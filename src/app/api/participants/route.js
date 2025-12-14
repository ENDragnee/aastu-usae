import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import db from "@/lib/db";
import fs from "fs";
import path from "path";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Get total count for pagination
    const [countResult] = await db.query(
      "SELECT COUNT(*) as total FROM participant WHERE university = ?",
      [session.user.id],
    );
    const totalParticipants = countResult[0].total;

    // Get paginated participants
    const [participants] = await db.query(
      `SELECT p.*, u.name as university_name 
       FROM participant p 
       LEFT JOIN university u ON p.university = u.id 
       WHERE p.university = ? 
       ORDER BY p.id DESC
       LIMIT ? OFFSET ?`,
      [session.user.id, limit, offset],
    );

    return NextResponse.json({
      participants,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalParticipants / limit),
        totalItems: totalParticipants,
      },
    });
  } catch (error) {
    console.error("Error fetching participants:", error);
    return NextResponse.json(
      { error: "Failed to fetch participants" },
      { status: 500 },
    );
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    const [participant] = await db.query(
      "SELECT photo FROM participant WHERE id = ?",
      [id],
    );

    if (!participant || participant.length === 0) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 },
      );
    }

    const photoPath = participant[0].photo;

    const [result] = await db.query("DELETE FROM participant WHERE id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return NextResponse.json(
        { error: "Participant not found" },
        { status: 404 },
      );
    }

    if (photoPath) {
      // Check if it's a base64 string or file path before deleting
      if (!photoPath.startsWith("data:")) {
        const fullPhotoPath = path.join(process.cwd(), "public", photoPath);
        if (fs.existsSync(fullPhotoPath)) {
          fs.unlink(fullPhotoPath, (err) => {
            if (err)
              console.error(`Error deleting photo: ${fullPhotoPath}`, err);
          });
        }
      }
    }

    return NextResponse.json({ message: "Participant deleted successfully" });
  } catch (error) {
    console.error("Error deleting participant:", error);
    return NextResponse.json(
      { error: "Failed to delete participant" },
      { status: 500 },
    );
  }
}


import { NextRequest, NextResponse } from "next/server";
import { getClient } from "@/app/lib/db";

export async function POST(req: NextRequest) {
    let client;

    try {
        const body = await req.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: "Email required" }, { status: 400 });
        }

        client = await getClient();

        // 1. Find User (using "User" table)
        const userRes = await client.query(
            'SELECT id, name FROM "User" WHERE LOWER(email) = LOWER($1)',
            [email.trim()]
        );

        if (userRes.rows.length === 0) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        const userId = userRes.rows[0].id;
        const userName = userRes.rows[0].name;

        // 2. Get recent Quizzes (limit 5)
        // Note: Using "Quiz" table
        const quizRes = await client.query(
            'SELECT title FROM "Quiz" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 5',
            [userId]
        );

        // 3. Get recent Flashcard Sets (limit 5)
        // Note: Using "FlashcardSet" table
        const flashcardRes = await client.query(
            'SELECT title FROM "FlashcardSet" WHERE "userId" = $1 ORDER BY "createdAt" DESC LIMIT 5',
            [userId]
        );

        return NextResponse.json({
            userName,
            quizCount: quizRes.rowCount, // This is just the fetched count, but shows we found some
            quizzes: quizRes.rows.map(r => r.title),
            flashcards: flashcardRes.rows.map(r => r.title)
        });

    } catch (error: any) {
        console.error("Summary error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to fetch summary" },
            { status: 500 }
        );
    } finally {
        if (client) client.release();
    }
}

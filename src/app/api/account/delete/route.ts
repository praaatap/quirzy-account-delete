import { NextRequest, NextResponse } from "next/server";
import { getClient } from "@/app/lib/db";

export async function POST(req: NextRequest) {
    let client;

    try {
        // Parse request body with error handling
        let body;
        try {
            const text = await req.text();
            if (!text || text.trim() === "") {
                return NextResponse.json(
                    { error: "Request body is empty" },
                    { status: 400 }
                );
            }
            body = JSON.parse(text);
        } catch (parseError) {
            return NextResponse.json(
                { error: "Invalid JSON in request body" },
                { status: 400 }
            );
        }

        const { email, method, reasons, customReason } = body;

        // Validate email
        if (!email || typeof email !== "string" || !email.includes("@")) {
            return NextResponse.json(
                { error: "A valid email is required" },
                { status: 400 }
            );
        }

        // Get database client
        try {
            client = await getClient();
        } catch (dbError) {
            console.error("Database connection error:", dbError);
            return NextResponse.json(
                { error: "Unable to connect to database. Please try again later." },
                { status: 503 }
            );
        }

        // Start transaction
        await client.query("BEGIN");

        console.log(`Searching for user with email: ${email.trim()}`);
        // 1. Find the user by email (Using "User" to match Prisma schema)
        const userResult = await client.query(
            'SELECT id, name, email FROM "User" WHERE LOWER(email) = LOWER($1)',
            [email.trim()]
        );

        if (userResult.rows.length === 0) {
            console.log("User not found in DB");
            await client.query("ROLLBACK");
            return NextResponse.json(
                { error: "No account found with this email address" },
                { status: 404 }
            );
        }

        const user = userResult.rows[0];
        const userId = user.id;

        console.log(`Found user: ${user.email} (ID: ${userId}). Proceeding with deletion...`);

        // 2. Log deletion request for compliance
        try {
            // Ensure log table exists (Putting raw query in DB as requested)
            await client.query(`
        CREATE TABLE IF NOT EXISTS "DeletionLog" (
          id SERIAL PRIMARY KEY,
          "userId" INTEGER,
          email TEXT,
          reasons JSONB,
          "customReason" TEXT,
          "deletedAt" TIMESTAMP DEFAULT NOW()
        )
      `);

            await client.query(
                `INSERT INTO "DeletionLog" ("userId", email, reasons, "customReason", "deletedAt")
         VALUES ($1, $2, $3, $4, NOW())`,
                [userId, email, JSON.stringify(reasons || []), customReason || null]
            );
        } catch (logError) {
            console.log("Error logging deletion:", logError);
            // Don't block deletion if logging fails
        }

        // 3. Anonymize User (Soft Delete) to preserve content
        // We do NOT delete Quizzes, Flashcards, or Results as requested.
        // We only scrub the user's personal identity.

        // A. Clean up active social/transient data that shouldn't persist
        try {
            await client.query(
                'DELETE FROM "Challenge" WHERE "challengerId" = $1 OR "opponentId" = $1',
                [userId]
            );
            await client.query('DELETE FROM "UserSettings" WHERE "userId" = $1', [userId]);
            // Optional: Delete FCM tokens or other transient sessions
        } catch (e) {
            console.log('Error cleaning transient data:', e);
        }

        // B. Anonymize the User Record
        // - Change Name to "Deleted User"
        // - Scramble Email to ensure uniqueness but remove personal info
        // - Nuke Password
        // - Remove tokens
        const anonymizedEmail = `deleted_${userId}_${Date.now()}@quirzy.app`;

        await client.query(
            `UPDATE "User" 
       SET 
         name = 'Deleted User',
         email = $1,
         password = 'DELETED_ACCOUNT', 
         "fcmToken" = NULL,
         "deletionCode" = NULL
       WHERE id = $2`,
            [anonymizedEmail, userId]
        );

        // Commit transaction
        await client.query("COMMIT");

        console.log(`Successfully anonymized account: ${email} -> ${anonymizedEmail}`);

        return NextResponse.json({
            success: true,
            message: "Account deleted successfully",
        });
    } catch (error: any) {
        // Rollback on error
        if (client) {
            try {
                await client.query("ROLLBACK");
            } catch (rollbackError) {
                console.error("Rollback error:", rollbackError);
            }
        }
        console.error("Delete account error:", error);
        return NextResponse.json(
            { error: error.message || "Failed to delete account" },
            { status: 500 }
        );
    } finally {
        // Release client back to pool
        if (client) {
            try {
                client.release();
            } catch (releaseError) {
                console.error("Client release error:", releaseError);
            }
        }
    }
}

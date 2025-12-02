import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getClient } from "@/app/lib/db";

export async function POST(req: Request) {
  const client = await getClient();
  
  try {
    const { email, password, fullName, method } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    await client.query('BEGIN'); // Start Transaction

    // 1. Find User
    const findUserSql = 'SELECT id, name, password FROM "User" WHERE "email" = $1';
    const userRes = await client.query(findUserSql, [email]);
    
    if (userRes.rowCount === 0) {
      await client.query('ROLLBACK');
      return NextResponse.json({ error: "No account found with this email" }, { status: 404 });
    }

    const user = userRes.rows[0];

    // 2. VERIFICATION LOGIC
    if (method === 'password') {
      // --- METHOD A: PASSWORD VERIFICATION ---
      if (!password) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: "Password is required" }, { status: 400 });
      }
      
      // If user has no password stored (Google Sign-In only), they must use name method
      if (!user.password || user.password.trim() === "") {
         await client.query('ROLLBACK');
         return NextResponse.json({ error: "This account uses Google Sign-In. Please switch to the 'Google / No Password' option." }, { status: 400 });
      }

      // Verify Password (BCRYPT)
      // Note: If you don't use bcrypt, change this line to: if (password !== user.password)
      const isValid = await bcrypt.compare(password, user.password);
      
      if (!isValid) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
      }

    } else {
      // --- METHOD B: NAME VERIFICATION (Google Users) ---
      if (!fullName) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: "Full Name is required" }, { status: 400 });
      }

      // Case-insensitive comparison
      const dbName = user.name.trim().toLowerCase();
      const inputName = fullName.trim().toLowerCase();

      if (dbName !== inputName) {
        await client.query('ROLLBACK');
        return NextResponse.json({ error: "Name does not match our records" }, { status: 401 });
      }
    }

    // 3. CASCADE DELETE (Safe Deletion of all user data)
    const userId = user.id;

    // Delete Challenges
    await client.query('DELETE FROM "Challenge" WHERE "challengerId" = $1 OR "opponentId" = $1', [userId]);
    // Delete Results
    await client.query('DELETE FROM "QuizResult" WHERE "userId" = $1', [userId]);
    // Delete Settings
    await client.query('DELETE FROM "UserSettings" WHERE "userId" = $1', [userId]);
    // Delete Questions in User's Quizzes
    await client.query('DELETE FROM "Question" WHERE "quizId" IN (SELECT id FROM "Quiz" WHERE "userId" = $1)', [userId]);
    // Delete User's Quizzes
    await client.query('DELETE FROM "Quiz" WHERE "userId" = $1', [userId]);
    // Delete User
    await client.query('DELETE FROM "User" WHERE id = $1', [userId]);

    await client.query('COMMIT'); // Commit Transaction

    return NextResponse.json({ success: true });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error("Delete Error:", error);
    return NextResponse.json({ error: "Server error during deletion" }, { status: 500 });
  } finally {
    client.release();
  }
}
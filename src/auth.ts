import NextAuth from "next-auth"
import Google from "next-auth/providers/google"

export const { handlers, signIn, signOut, auth } = NextAuth({
    providers: [Google],
    theme: {
        logo: "https://quirzy.app/logo.png", // Replace with your actual logo URL
        brandColor: "#5B13EC",
    },
    callbacks: {
        async session({ session, token }) {
            if (session?.user) {
                // Add user ID from token to session
                (session.user as any).id = token.sub;
            }
            return session;
        },
    },
})

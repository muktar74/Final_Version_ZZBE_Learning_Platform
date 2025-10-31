// services/config.ts

// --- IMPORTANT SECURITY NOTICE ---
// It is strongly recommended NOT to hardcode your secret keys directly in the source code.
// Anyone who can see your code will also see your secrets, which can lead to security breaches.
//
// BEST PRACTICE: Use environment variables via a `.env` file that is NOT committed to version control.
//
// For this project, as requested, we are placing variables here.
// PLEASE REPLACE THE PLACEHOLDERS BELOW WITH YOUR ACTUAL KEYS BEFORE RUNNING.

export const SUPABASE_URL = "https://fpffhshknnjfukxljryv.supabase.co";
export const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZwZmZoc2hrbm5qZnVreGxqcnl2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE1NDIyMjcsImV4cCI6MjA3NzExODIyN30.t7XeZXxGjErP2w-JYLeSzfpmLqQLj0sriFgwp0V-bVI";

// Replace this with your actual key from Google AI Studio
export const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";

// A check to remind you to add your Gemini API Key.
if (GEMINI_API_KEY === "YOUR_GEMINI_API_KEY_HERE") {
    console.warn("Gemini API Key is missing. Please add it to services/config.ts to enable AI features.");
}

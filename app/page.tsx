import { LoginForm } from "@/components/LoginForm";
import { Workspace } from "@/components/Workspace";
import { getAppPassword, hasValidSession } from "@/lib/auth";

// The gate is decided per request, so the app must never be served from a cache.
export const dynamic = "force-dynamic";

// Only a server-side session check decides what gets rendered. Nothing from the app
// is in the HTML until the cookie verifies.
export default async function Page() {
  if (!getAppPassword()) {
    return (
      <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-5 py-10">
        <div className="rounded-2xl border border-line bg-surface p-6 text-[15px] leading-relaxed text-ink-text shadow-sm sm:p-8">
          This prototype is not configured. Set APP_PASSWORD on the server and restart it.
        </div>
      </main>
    );
  }
  if (await hasValidSession()) {
    return <Workspace />;
  }
  return <LoginForm />;
}

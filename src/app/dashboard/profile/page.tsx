import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { requireDashboardUser } from "@/lib/data";

export default async function DashboardProfilePage() {
  const { profile } = await requireDashboardUser();

  return (
    <main className="section-shell py-8">
      <div className="space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
            Profile
          </p>
          <h1 className="mt-2 text-3xl font-semibold text-slate-950 sm:text-4xl">
            Edit your public profile
          </h1>
        </div>

        <ProfileForm
          initialProfile={{
            id: profile.id,
            name: profile.name,
            bio: profile.bio,
            username: profile.username,
            profile_photo: profile.profile_photo,
          }}
        />
      </div>
    </main>
  );
}

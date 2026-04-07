"use client";

import Image from "next/image";
import { useState, useTransition } from "react";
import { getBrowserSupabaseClient } from "@/lib/supabase-browser";

type ProfileFormProps = {
  initialProfile: {
    id: string;
    name: string;
    bio: string | null;
    username: string;
    profile_photo: string | null;
  };
};

export function ProfileForm({ initialProfile }: ProfileFormProps) {
  const [name, setName] = useState(initialProfile.name);
  const [bio, setBio] = useState(initialProfile.bio ?? "");
  const [photoPreview, setPhotoPreview] = useState(
    initialProfile.profile_photo ?? "",
  );
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  return (
    <form
      className="space-y-6 rounded-[2rem] border border-slate-200 bg-white p-6 shadow-[0_30px_90px_-60px_rgba(15,23,42,0.45)] sm:p-8"
      onSubmit={(event) => {
        event.preventDefault();
        setMessage("");

        startTransition(async () => {
          const supabase = getBrowserSupabaseClient();
          let profilePhoto = initialProfile.profile_photo;

          if (photoFile) {
            const extension = photoFile.name.split(".").pop() || "jpg";
            const fileName = `${initialProfile.id}/${Date.now()}.${extension}`;
            const { error: uploadError } = await supabase.storage
              .from("profiles")
              .upload(fileName, photoFile, { upsert: true });

            if (uploadError) {
              setMessage(uploadError.message);
              return;
            }

            const { data: publicUrl } = supabase.storage
              .from("profiles")
              .getPublicUrl(fileName);

            profilePhoto = publicUrl.publicUrl;
          }

          const { error } = await supabase
            .from("users")
            .update({
              name: name.trim(),
              bio: bio.trim(),
              profile_photo: profilePhoto,
            })
            .eq("id", initialProfile.id);

          setMessage(error ? error.message : "Profile updated successfully.");
        });
      }}
    >
      <div className="grid gap-6 md:grid-cols-[200px,1fr]">
        <div className="mx-auto w-full max-w-[220px] space-y-4 md:mx-0 md:max-w-none">
          <div className="aspect-square overflow-hidden rounded-[1.5rem] bg-slate-100">
            {photoPreview ? (
              <Image
                src={photoPreview}
                alt={initialProfile.name}
                width={384}
                height={384}
                unoptimized
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                No photo yet
              </div>
            )}
          </div>

          <label className="block cursor-pointer rounded-full border border-slate-200 px-4 py-3 text-center text-sm font-medium text-slate-700 transition hover:border-slate-950 hover:text-slate-950">
            Upload photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0] ?? null;
                setPhotoFile(file);

                if (file) {
                  setPhotoPreview(URL.createObjectURL(file));
                }
              }}
            />
          </label>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Name</label>
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              required
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">Bio</label>
            <textarea
              value={bio}
              onChange={(event) => setBio(event.target.value)}
              rows={6}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-900 focus:bg-white"
              placeholder="Tell clients what you know, who you help, and why they should trust you."
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-slate-700">
              Username
            </label>
            <input
              value={`@${initialProfile.username}`}
              disabled
              className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-4 py-3 text-sm text-slate-500"
            />
          </div>

          <div className="stack-actions">
            <span className="text-sm text-slate-500">{message}</span>
            <button
              type="submit"
              disabled={isPending}
              className="button-block-mobile rounded-full bg-slate-950 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Saving..." : "Save profile"}
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}

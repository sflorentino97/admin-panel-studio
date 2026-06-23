"use client";

import { useState, useTransition } from "react";
import { updateProfile, uploadAvatar } from "./actions";

type Profile = {
  full_name: string;
  role: string;
  job_title: string;
  phone: string;
  bio: string;
  email: string;
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  member: "Equipe",
  client: "Cliente",
};

export function ProfileView({
  profile,
  avatarUrl,
}: {
  profile: Profile;
  avatarUrl: string | null;
}) {
  const [name, setName] = useState(profile.full_name);
  const [jobTitle, setJobTitle] = useState(profile.job_title);
  const [phone, setPhone] = useState(profile.phone);
  const [bio, setBio] = useState(profile.bio);
  const [avatar, setAvatar] = useState(avatarUrl);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const fd = new FormData();
    fd.set("full_name", name);
    fd.set("job_title", jobTitle);
    fd.set("phone", phone);
    fd.set("bio", bio);

    startTransition(async () => {
      const result = await updateProfile(fd);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
      } else {
        setMessage({ type: "success", text: "Perfil atualizado!" });
      }
    });
  }

  function handleAvatarUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage(null);

    const fd = new FormData();
    fd.append("file", file);

    const previewUrl = URL.createObjectURL(file);
    setAvatar(previewUrl);

    startTransition(async () => {
      const result = await uploadAvatar(fd);
      if (result.error) {
        setMessage({ type: "error", text: result.error });
        setAvatar(avatarUrl);
      } else {
        setMessage({ type: "success", text: "Foto atualizada!" });
      }
    });

    e.target.value = "";
  }

  const initials = name
    ? name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()
    : "?";

  return (
    <div className="mx-auto max-w-2xl animate-fade-in">
      <h1 className="text-[22px] font-bold tracking-tight text-gray-900">Meu Perfil</h1>
      <p className="mt-0.5 text-[13px] text-gray-500">{ROLE_LABELS[profile.role] ?? profile.role}</p>

      {message && (
        <div className={`mt-4 rounded-lg px-4 py-3 text-[13px] font-medium ${
          message.type === "success"
            ? "bg-emerald-50 text-emerald-700"
            : "bg-red-50 text-red-700"
        }`}>
          {message.text}
        </div>
      )}

      <div className="mt-6 rounded-xl border border-gray-200/80 bg-white p-6">
        {/* Avatar */}
        <div className="flex items-center gap-5">
          <div className="relative group">
            {avatar ? (
              <img
                src={avatar}
                alt={name}
                className="h-20 w-20 rounded-full object-cover ring-2 ring-gray-100"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand to-accent text-xl font-bold text-white ring-2 ring-gray-100">
                {initials}
              </div>
            )}
            <label className="absolute inset-0 flex cursor-pointer items-center justify-center rounded-full bg-black/40 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleAvatarUpload}
                disabled={isPending}
              />
            </label>
          </div>
          <div>
            <p className="text-[15px] font-semibold text-gray-900">{name || "Sem nome"}</p>
            <p className="text-[13px] text-gray-500">{profile.email}</p>
            {jobTitle && <p className="mt-0.5 text-[12px] text-gray-400">{jobTitle}</p>}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSave} className="mt-6 space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="full_name" className="block text-[13px] font-medium text-gray-700">
                Nome completo <span className="text-red-400">*</span>
              </label>
              <input
                id="full_name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] transition-all duration-150 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
            </div>
            <div>
              <label htmlFor="job_title" className="block text-[13px] font-medium text-gray-700">
                Cargo / Função
              </label>
              <input
                id="job_title"
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="Ex: Designer, Gerente de Projeto"
                className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] transition-all duration-150 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className="block text-[13px] font-medium text-gray-700">
                Telefone
              </label>
              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
                className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] transition-all duration-150 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10"
              />
            </div>
            <div>
              <label className="block text-[13px] font-medium text-gray-700">E-mail</label>
              <input
                type="email"
                value={profile.email}
                disabled
                className="mt-1.5 block w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-[13px] text-gray-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label htmlFor="bio" className="block text-[13px] font-medium text-gray-700">
              Bio
            </label>
            <textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Uma breve descrição sobre você..."
              className="mt-1.5 block w-full rounded-lg border border-gray-200 px-3 py-2.5 text-[13px] transition-all duration-150 placeholder:text-gray-400 focus:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900/10 resize-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-brand px-5 py-2.5 text-[13px] font-medium text-white shadow-sm transition-all duration-150 hover:bg-brand-hover active:bg-brand-active disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isPending && (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              )}
              {isPending ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

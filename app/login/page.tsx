"use client";

import { useState } from "react";

export default function LoginPage() {
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    const res = await fetch("/api/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        login,
        password,
      }),
    });

    if (res.ok) {
      window.location.href = "/";
    } else {
      alert("Неверный логин или пароль");
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-100 p-6">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow"
      >
        <h1 className="mb-6 text-2xl font-semibold">
          Вход в каталог
        </h1>
<input
  type="text"
  placeholder="Логин"
  value={login}
  onChange={(e) => setLogin(e.target.value)}
  className="mb-4 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-400"
/>

<input
  type="password"
  placeholder="Пароль"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  className="mb-4 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-400"
/>

        <button className="w-full rounded-xl bg-black px-4 py-3 text-white">
          Войти
        </button>
      </form>
    </main>
  );
}
"use client";
import { FormEvent } from "react";

export default function LoginPage() {

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const email = formData.get("email");
    const password = formData.get("password");

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

  
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid grid-flow-row w-fit p-10 gap-5 bg-blue-400">
        <input
          className="text-yellow-500"
          type="email"
          name="email"
          placeholder="Email"
          required
        />
        <input
          type="password"
          name="password"
          placeholder="Password"
          required
        />
        <button type="submit" className="bg-rose-200 p-5 text-black">
          Login
        </button>
      </div>
    </form>
  );
}

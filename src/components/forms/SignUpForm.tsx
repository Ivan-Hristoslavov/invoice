"use client";
import { useRef, useState } from "react";
import Link from "next/link";

export default function SignUpForm() {
  const [error, setError] = useState<string>();
  const ref = useRef<HTMLFormElement>(null);

  return (
    <div className="w-full h-full p-10 z-10 flex items-center justify-center flex-col">
      <form
        ref={ref}
        className="flex flex-col justify-between items-center gap-4 w-full"
      >
        {error && <div className="text-red-500 text-sm">{error}</div>}
        <h1 className="text-4xl font-bold text-white text-center mb-6">
          Register
        </h1>
        <div className="relative w-full">
          <label htmlFor="email" className="block text-sm text-gray-400">
            Email
          </label>
          <div className="relative mt-1">
            <input
              type="email"
              id="email"
              className="w-full rounded-lg bg-gray-800 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600"
            />
          </div>
        </div>
        <div className="relative w-full">
          <label htmlFor="email" className="block text-sm text-gray-400">
            Password
          </label>
          <div className="relative mt-1">
            <input
              type="password"
              id="password"
              className="w-full rounded-lg bg-gray-800 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600"
            />
          </div>
        </div>
        <div className="relative w-full">
          <label htmlFor="email" className="block text-sm text-gray-400">
            Confirm password
          </label>
          <div className="relative mt-1">
            <input
              type="password"
              id="password"
              className="w-full rounded-lg bg-gray-800 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600"
            />
          </div>
        </div>
        <button
          className="w-full bg-blue-600 text-white py-2 rounded-md
                transition duration-300 ease-in-out hover:bg-blue-700"
        >
          Sign up
        </button>
        <Link
          href="/signin"
          className="text-sm text-white hover:underline mt-4"
        >
          Sign in in your account
        </Link>
      </form>
    </div>
  );
}
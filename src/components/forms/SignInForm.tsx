"use client";
import { FormEvent, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import google from '../../../public/google-logo.svg'

export default function SignInForm() {
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full h-full p-10 z-10 flex items-center justify-center flex-col"
    >
      <h1 className="text-4xl font-bold text-white text-center mb-6">Login</h1>
      <div className="flex flex-col gap-4 w-full items-start justify-start">
        {error && (
          <div
            className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
            role="alert"
          >
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="flex flex-row gap-5">
          <div>
            <label htmlFor="text" className="block text-sm text-gray-400">
              First Name
            </label>
            <div className="relative mt-1">
              <input
                type="text"
                id="text"
                className="w-full rounded-lg bg-gray-800 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600"
              />
            </div>
          </div>

          <div>
            <label htmlFor="text" className="block text-sm text-gray-400">
              Last Name
            </label>
            <div className="relative mt-1">
              <input
                type="text"
                id="text"
                className="w-full rounded-lg bg-gray-800 text-white px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gray-600"
              />
            </div>
          </div>
        </div>
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
        <button
          type="submit"
          className="hover:duration-1000 w-full bg-blue-600 text-white py-2 rounded-md transition duration-300 ease-in-out hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
        >
          Sign in
        </button>
        <div className="w-full h-fit flex gap-10">
          <div className="w-1/2 h-fit">
            <button
              type="button"
              className="flex flex-row justify-center items-center hover:duration-1000 w-full bg-white text-black py-1 rounded-md transition duration-300 ease-in-out hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              <Image src={google} alt="test" width={30} height={30} />
            </button>
          </div>
          <div className="w-1/2 h-fit">
            <button
              type="button"
              className="flex flex-row justify-center items-center hover:duration-1000 w-full bg-white text-black py-1 rounded-md transition duration-300 ease-in-out hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            >
              <Image src={google} alt="test" width={30} height={30} />
            </button>
          </div>
        </div>
      </div>
      <Link href="/signup" className="text-sm text-white hover:underline mt-4">
        Sign up your account
      </Link>
    </form>
  );
}
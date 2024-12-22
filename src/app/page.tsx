"use client";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import forest from "../../public/forest.jpg";
import Image from "next/image";
export default function Page() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-red">
      <Image src={forest} alt="test" className="absolute top-0" />
    </div>
  );
}
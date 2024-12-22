"use client";
import { useState } from "react";
import forest from "../../public/forest.jpg";
import Image from "next/image";
export default function Page() {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center">
      <Image src={forest} alt="Forest" className="absolute top-0" />
    </div>
  );
}
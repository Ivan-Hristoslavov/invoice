import Image from "next/image";
import forest from "../../../public/grayforest.png";
import elen from "../../../public/elen.png";
import nature from "../../../public/nature.jpg";

export default function AuthLayout({
  children,
}: React.PropsWithChildren<unknown>) {
  return (
    <div className="flex flex-col items-center justify-center h-screen w-screen relative overflow-hidden bg-gray-900">
      <div className="z-10 w-6/12 h-4/6 flex flex-col items-start justify-center relative drop-shadow-2xl">
        <div className="w-1/2 h-4/6 ml-10 z-10">{children}</div>
          <Image
            src={forest}
            alt="test"
            className="h-fit w-fit absolute rounded-3xl shadow-2xl "
          />
      </div>
    </div>
  );
}


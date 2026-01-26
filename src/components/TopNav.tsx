import Image from "next/image";
import UserButtonClient from "@/components/UserButtonClient";

export default function TopNav() {
  return (
    <nav
      className="sticky top-0 z-50 w-full flex justify-between items-center px-6 h-16"
      style={{ backgroundColor: "#252728" }}
    >
      <Image
        src="/logo.svg"
        alt="Spitfire Labs Logo"
        width={104}
        height={21}
        priority
      />
      <UserButtonClient />
    </nav>
  );
}

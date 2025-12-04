"use client";

import { UserButton } from "@clerk/nextjs";

export default function UserButtonClient() {
  // You can pass props to UserButton here if needed, like afterSignOutUrl
  return <UserButton afterSignOutUrl="/sign-in" />;
}

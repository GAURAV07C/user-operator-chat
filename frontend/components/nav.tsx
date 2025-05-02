"use client";

import Link from "next/link";
import React from "react";
import { useSession } from "next-auth/react";
import { Button } from "./ui/button";
import { ModeToggle } from "./mode-toggle";
import Logout from "./log-out";

const Nav = () => {
  const { data: session } = useSession();

  return (
    <div className="absolute top-4 right-4 flex space-x-2">
      <ModeToggle />
      <Link href="/">
        <Button variant="outline" size="sm">
          Home
        </Button>
      </Link>

      {session?.accessToken ? (
        <Logout />
      ) : (
        <Link href="/login">
          <Button variant="outline" size="sm">
            Login
          </Button>
        </Link>
      )}
    </div>
  );
};

export default Nav;

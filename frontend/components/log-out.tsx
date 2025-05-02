"use client";

import React from "react";
import { signOut } from "next-auth/react";

const Logout = () => {
  const handleLogout = () => {
    signOut({ callbackUrl: "/login" }); // redirect to /login after logout
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
    >
      Logout
    </button>
  );
};

export default Logout;

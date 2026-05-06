"use client";

import { createContext, useContext, useMemo } from "react";
import { useDb } from "@/lib/data/hooks";
import type { Team, User } from "@/lib/types";

type AuthContextValue = {
  user: User | null;
  activeTeam: Team | null;
  teams: Team[];
  isImpersonating: boolean;
  impersonator: User | null;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  activeTeam: null,
  teams: [],
  isImpersonating: false,
  impersonator: null,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const db = useDb();
  const value = useMemo<AuthContextValue>(() => {
    const user = db.session.userId ? db.users[db.session.userId] ?? null : null;
    if (!user) {
      return { user: null, activeTeam: null, teams: [], isImpersonating: false, impersonator: null };
    }
    const teams =
      user.role === "admin"
        ? Object.values(db.teams)
        : user.teamIds.map((id) => db.teams[id]).filter(Boolean);
    const activeTeam =
      (db.session.activeTeamId && db.teams[db.session.activeTeamId]) ||
      teams[0] ||
      null;
    const impersonator = db.session.impersonatorId
      ? db.users[db.session.impersonatorId] ?? null
      : null;
    return {
      user,
      activeTeam,
      teams,
      isImpersonating: !!impersonator,
      impersonator,
    };
  }, [db]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

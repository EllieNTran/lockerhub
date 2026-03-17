import React, { createContext, useContext, useState } from "react";

type ViewMode = "user" | "admin";

interface ViewModeContextType {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  isAdmin: boolean;
}

const ViewModeContext = createContext<ViewModeContextType>({
  viewMode: "user",
  setViewMode: () => {},
  isAdmin: false,
});

// eslint-disable-next-line react-refresh/only-export-components
export const useViewMode = () => useContext(ViewModeContext);

export const ViewModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [viewMode, setViewMode] = useState<ViewMode>("user");

  return (
    <ViewModeContext.Provider
      value={{ viewMode, setViewMode, isAdmin: viewMode === "admin" }}
    >
      {children}
    </ViewModeContext.Provider>
  );
};

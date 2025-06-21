"use client";
import { createContext, useContext, useState } from "react";

interface RouteData {
  polyline: string;
  routeType: string;
  distance: number;
  start: { lat: number; lng: number };
  end: { lat: number; lng: number };
  mode: string;
}

interface RouteContextType {
  routeData: RouteData | null;
  setRouteData: (data: RouteData) => void;
}

const RouteContext = createContext<RouteContextType | undefined>(undefined);

export const RouteProvider = ({ children }: { children: React.ReactNode }) => {
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  return (
    <RouteContext.Provider value={{ routeData, setRouteData }}>
      {children}
    </RouteContext.Provider>
  );
};

export const useRoute = () => {
  const context = useContext(RouteContext);
  if (!context) throw new Error("useRoute must be used within a RouteProvider");
  return context;
};

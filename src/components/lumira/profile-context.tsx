import { createContext, useContext, useState, type ReactNode } from "react";

export type Gender = "male" | "female";

export interface ProfileData {
  name: string;
  skinTone: string; // hex color
  weight: number; // kg
  height: number; // cm
  gender: Gender;
  uploadedPhoto: string | null; // data URL
}

interface ProfileCtx extends ProfileData {
  setName: (v: string) => void;
  setSkinTone: (v: string) => void;
  setWeight: (v: number) => void;
  setHeight: (v: number) => void;
  setGender: (v: Gender) => void;
  setUploadedPhoto: (v: string | null) => void;
}

const Ctx = createContext<ProfileCtx | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [name, setName] = useState("Islam Ali");
  const [skinTone, setSkinTone] = useState("#d9a37a");
  const [weight, setWeight] = useState(75);
  const [height, setHeight] = useState(178);
  const [gender, setGender] = useState<Gender>("male");
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);

  return (
    <Ctx.Provider
      value={{
        name, skinTone, weight, height, gender, uploadedPhoto,
        setName, setSkinTone, setWeight, setHeight, setGender, setUploadedPhoto,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProfile must be used inside ProfileProvider");
  return ctx;
}

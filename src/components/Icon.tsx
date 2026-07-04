import React from "react";
import { Ionicons } from "@expo/vector-icons";

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface Props {
  name: IoniconsName;
  size?: number;
  color?: string;
}

export function Icon({ name, size = 20, color = "#000" }: Props) {
  return <Ionicons name={name} size={size} color={color} />;
}

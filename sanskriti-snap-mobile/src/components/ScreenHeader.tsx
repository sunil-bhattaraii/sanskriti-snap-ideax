import React from "react";
import AppHeader from "./AppHeader";

interface ScreenHeaderProps {
  title: string;
}

export default function ScreenHeader({ title }: ScreenHeaderProps) {
  return <AppHeader title={title} showBack />;
}

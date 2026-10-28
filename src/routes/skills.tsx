import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/skills")({
  component: SkillsLayout,
});

function SkillsLayout() {
  return <Outlet />;
}

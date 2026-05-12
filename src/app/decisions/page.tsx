import { Suspense } from "react";
import DecisionsWorkspace from "./DecisionsWorkspace";

export default function DecisionsPage() {
  return (
    <Suspense>
      <DecisionsWorkspace />
    </Suspense>
  );
}

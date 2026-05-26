"use client";

import { Mascot } from "@/components/ui/mascot";

/**
 * Mascot scene wrappers. Each renders the mascot positioned relative
 * to its CLOSEST RELATIVE ANCESTOR — drop them inside the same wrapper
 * that contains the centre book so positions track the book, not the
 * outer hero container.
 *
 * Both use size="sm" (96 px) so the mascot reads as on/around the book
 * rather than dwarfing it.
 */

export function TeacherSittingOnBook() {
  // Teacher straddles the top edge of the book — bottom of the mascot
  // overlaps the top of the book by ~30 px so the legs appear to dangle
  // over the front cover edge.
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 z-30 pointer-events-auto"
      style={{ bottom: "calc(100% - 30px)" }}
    >
      <Mascot name="teacher" size="sm" withLimbs label="Teacher companion" />
    </div>
  );
}

export function StudentHangingFromBook() {
  // Student hangs from the bottom of the book — top of the mascot
  // overlaps the bottom of the book by ~24 px so the arms appear to
  // grip the bottom edge.
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 z-30 pointer-events-auto"
      style={{ top: "calc(100% - 24px)" }}
    >
      <Mascot name="student" size="sm" withLimbs label="Student companion" />
    </div>
  );
}

"use client";

import { Mascot } from "@/components/ui/mascot";

/**
 * Mascot scenes — composed positions of mascots interacting with the
 * layered book hero. Both `StudentHangingFromBook` and
 * `TeacherSittingOnBook` are absolute-positioned overlays meant to be
 * dropped inside <LayeredBookHero>.
 *
 * Both characters get `withLimbs` so the legs/arms dangle naturally.
 * Coupon chip is visible on hover (the underlying Mascot keeps its
 * Easter-egg).
 */

export function StudentHangingFromBook() {
  // Bottom-centre of the centre book — student visible from the
  // middle down, arms gripping the book edge above the head.
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 z-30 pointer-events-auto"
      style={{ bottom: "-40px" }}
    >
      <Mascot name="student" size="md" withLimbs label="Student companion" />
    </div>
  );
}

export function TeacherSittingOnBook() {
  // Top-centre of the centre book — teacher sits with limbs hanging.
  return (
    <div
      className="absolute left-1/2 -translate-x-1/2 z-30 pointer-events-auto"
      style={{ top: "-140px" }}
    >
      <Mascot name="teacher" size="md" withLimbs label="Teacher companion" />
    </div>
  );
}

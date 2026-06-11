"use server";

/**
 * Pincode → city / state lookup (#117). Uses the free India Post API
 * (api.postalpincode.in — no key, no cost). Resolved server-side so the
 * checkout form can auto-fill City + State from a pincode. Manual entry
 * always remains possible; this is a convenience, not a gate.
 *
 * A pincode can map to several localities (post offices); we return the
 * district as the city and the de-duped locality names for an optional
 * dropdown.
 */

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export interface PincodeInfo {
  city: string;
  state: string;
  country: string;
  localities: string[];
}

const PINCODE_RE = /^[1-9][0-9]{5}$/;

export async function lookupPincode(pincode: string): Promise<ActionResult<PincodeInfo>> {
  if (!PINCODE_RE.test(pincode)) {
    return { success: false, error: "Enter a valid 6-digit pincode." };
  }

  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`, {
      // Cache at the edge for a day — pincode→city mappings don't change.
      next: { revalidate: 86400 },
    });
    if (!res.ok) return { success: false, error: "Couldn't look up that pincode." };

    const json = (await res.json()) as Array<{
      Status?: string;
      PostOffice?: Array<{ Name?: string; District?: string; State?: string; Country?: string }> | null;
    }>;
    const entry = Array.isArray(json) ? json[0] : null;
    if (!entry || entry.Status !== "Success" || !entry.PostOffice?.length) {
      return { success: false, error: "Pincode not found." };
    }

    const offices = entry.PostOffice;
    const first = offices[0];
    const localities = [...new Set(offices.map((o) => o.Name).filter(Boolean) as string[])];

    return {
      success: true,
      data: {
        city: first.District ?? "",
        state: first.State ?? "",
        country: first.Country ?? "India",
        localities,
      },
    };
  } catch {
    return { success: false, error: "Couldn't reach the pincode service." };
  }
}

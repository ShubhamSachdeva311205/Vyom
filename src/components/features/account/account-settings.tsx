"use client";

import { useState, useTransition } from "react";
import { Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { changeEmail, changePassword, updateDisplayName } from "@/actions/account";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Stack, Row } from "@/components/layouts/stack";

export function AccountSettings({
  initialName,
  email,
}: {
  initialName: string;
  email: string;
}) {
  return (
    <Stack gap={4}>
      <NameSection initialName={initialName} />
      <EmailSection currentEmail={email} />
      <PasswordSection />
    </Stack>
  );
}

function NameSection({ initialName }: { initialName: string }) {
  const [name, setName] = useState(initialName);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaved(false);
    const fd = new FormData();
    fd.set("fullName", name);
    start(async () => {
      const r = await updateDisplayName(fd);
      if (!r.success) { toast.error(r.error); return; }
      setSaved(true);
      toast.success("Name updated.");
    });
  }

  return (
    <Card variant="surface" padding="lg">
      <form onSubmit={onSubmit}>
        <Stack gap={3}>
          <span className="text-eyebrow">Display name</span>
          <FormField label="Full name">
            <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={120} required />
          </FormField>
          <Row gap={2} align="center">
            <Button type="submit" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              Save name
            </Button>
            {saved ? (
              <span className="inline-flex items-center gap-1 text-sm text-success">
                <Check className="size-4" aria-hidden="true" /> Saved
              </span>
            ) : null}
          </Row>
        </Stack>
      </form>
    </Card>
  );
}

function EmailSection({ currentEmail }: { currentEmail: string }) {
  const [emailValue, setEmailValue] = useState("");
  const [pending, start] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("email", emailValue);
    start(async () => {
      const r = await changeEmail(fd);
      if (!r.success) { toast.error(r.error); return; }
      toast.success("Confirmation sent — open the link in your new inbox to finish.");
      setEmailValue("");
    });
  }

  return (
    <Card variant="surface" padding="lg">
      <form onSubmit={onSubmit}>
        <Stack gap={3}>
          <span className="text-eyebrow">Email</span>
          <p className="text-caption text-muted-foreground">
            Current: <span className="font-medium text-foreground">{currentEmail}</span>. Changing
            it sends a confirmation link to the new address; the change applies once you click it.
          </p>
          <FormField label="New email">
            <Input
              type="email"
              value={emailValue}
              onChange={(e) => setEmailValue(e.target.value)}
              placeholder="new@example.com"
              required
            />
          </FormField>
          <Row>
            <Button type="submit" variant="outline" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              Send confirmation
            </Button>
          </Row>
        </Stack>
      </form>
    </Card>
  );
}

function PasswordSection() {
  const [pending, start] = useTransition();
  const [done, setDone] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setDone(false);
    const form = e.currentTarget;
    const fd = new FormData(form);
    start(async () => {
      const r = await changePassword(fd);
      if (!r.success) { toast.error(r.error); return; }
      setDone(true);
      form.reset();
      toast.success("Password updated.");
    });
  }

  return (
    <Card variant="surface" padding="lg">
      <form onSubmit={onSubmit}>
        <Stack gap={3}>
          <span className="text-eyebrow">Password</span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <FormField label="New password" description="At least 8 characters.">
              <Input name="password" type="password" autoComplete="new-password" required />
            </FormField>
            <FormField label="Confirm new password">
              <Input name="confirm" type="password" autoComplete="new-password" required />
            </FormField>
          </div>
          <Row gap={2} align="center">
            <Button type="submit" variant="outline" disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : null}
              Update password
            </Button>
            {done ? (
              <span className="inline-flex items-center gap-1 text-sm text-success">
                <Check className="size-4" aria-hidden="true" /> Updated
              </span>
            ) : null}
          </Row>
        </Stack>
      </form>
    </Card>
  );
}

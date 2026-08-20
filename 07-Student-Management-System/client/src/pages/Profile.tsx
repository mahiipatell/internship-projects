import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { Avatar, Badge, Button, Card, ErrorText, Field, Input, PageHeader, Spinner } from "../components/ui";
import { useToast } from "../components/toast";
import { IconProfile } from "../components/icons";

type Profile = {
  id: string;
  email: string;
  role: string;
  firstName: string | null;
  lastName: string | null;
  student?: {
    rollNumber?: string;
    section?: { name: string; class: { name: string } } | null;
    parent?: { firstName: string | null; lastName: string | null; email: string } | null;
  } | null;
};

export default function Profile() {
  const toast = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const [curPw, setCurPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwBusy, setPwBusy] = useState(false);

  useEffect(() => {
    api
      .get<Profile>("/profile")
      .then((p) => {
        setProfile(p);
        setFirstName(p.firstName ?? "");
        setLastName(p.lastName ?? "");
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, []);

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const updated = await api.patch<Profile>("/profile", { firstName, lastName });
      setProfile(updated);
      toast.success("Profile updated");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update");
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwBusy(true);
    try {
      await api.patch("/profile/password", { currentPassword: curPw, newPassword: newPw });
      toast.success("Password changed");
      setCurPw("");
      setNewPw("");
    } catch (err) {
      setPwError(err instanceof ApiError ? err.message : "Failed to change password");
    } finally {
      setPwBusy(false);
    }
  }

  if (loading) return <Spinner full />;

  const name = [firstName, lastName].filter(Boolean).join(" ") || profile?.email || "User";

  return (
    <div className="max-w-lg space-y-4">
      <PageHeader title="Profile" icon={<IconProfile className="h-5 w-5" />} />

      <Card className="flex items-center gap-4 p-5">
        <Avatar name={name} size="lg" />
        <div className="min-w-0">
          <p className="truncate font-semibold text-foreground">{name}</p>
          <p className="truncate text-sm text-muted-foreground">{profile?.email}</p>
        </div>
        <Badge tone="primary" className="ml-auto capitalize">{profile?.role.toLowerCase()}</Badge>
      </Card>

      {error && <ErrorText>{error}</ErrorText>}

      <Card className="space-y-3 p-5">
        <Field label="Email">
          <Input value={profile?.email ?? ""} disabled />
        </Field>
        {profile?.student?.section && (
          <Field label="Class & Section">
            <Input value={`${profile.student.section.class.name} - ${profile.student.section.name}`} disabled />
          </Field>
        )}
        {profile?.student?.rollNumber && (
          <Field label="Roll Number">
            <Input value={profile.student.rollNumber} disabled className="font-mono" />
          </Field>
        )}
        {profile?.student?.parent && (
          <Field label="Parent">
            <Input
              value={`${[profile.student.parent.firstName, profile.student.parent.lastName].filter(Boolean).join(" ")} (${profile.student.parent.email})`}
              disabled
            />
          </Field>
        )}
      </Card>

      <Card className="p-5">
        <form onSubmit={saveProfile} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="First name" htmlFor="p-fn">
              <Input id="p-fn" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </Field>
            <Field label="Last name" htmlFor="p-ln">
              <Input id="p-ln" value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </Field>
          </div>
          <div className="flex justify-end">
            <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
          </div>
        </form>
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 font-semibold">Change Password</h2>
        <form onSubmit={changePassword} className="space-y-3">
          <Field label="Current password" htmlFor="p-cur" required>
            <Input id="p-cur" type="password" value={curPw} onChange={(e) => setCurPw(e.target.value)} required />
          </Field>
          <Field label="New password" htmlFor="p-new" hint="At least 8 characters." required>
            <Input id="p-new" type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required minLength={8} />
          </Field>
          <ErrorText>{pwError}</ErrorText>
          <div className="flex justify-end">
            <Button type="submit" disabled={pwBusy}>{pwBusy ? "Updating…" : "Update Password"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

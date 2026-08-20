import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Avatar, Badge, Button, Card, EmptyState, ErrorText, Field, Input, Modal, PageHeader, Spinner, Table, Td, Th } from "../components/ui";
import { IconPlus, IconTeacher } from "../components/icons";

type Teacher = {
  id: string;
  firstName: string;
  lastName: string;
  user: { email: string };
  teacherAssignments: { subject: { name: string }; section: { name: string; class: { name: string } } }[];
};

export default function Teachers() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await api.get<Teacher[]>("/teachers"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load teachers");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-4">
      <PageHeader
        title="Teachers"
        description={rows.length ? `${rows.length} teacher${rows.length === 1 ? "" : "s"}` : undefined}
        icon={<IconTeacher className="h-5 w-5" />}
        actions={user?.role === "ADMIN" && <Button className="gap-1.5" onClick={() => setShowAdd(true)}><IconPlus className="h-4 w-4" /> Add Teacher</Button>}
      />

      {error && <ErrorText>{error}</ErrorText>}

      {loading ? (
        <Spinner full />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<IconTeacher className="h-5 w-5" />}
          title="No teachers yet"
          description="Add a teacher to get started."
          action={user?.role === "ADMIN" && <Button className="gap-1.5" onClick={() => setShowAdd(true)}><IconPlus className="h-4 w-4" /> Add Teacher</Button>}
        />
      ) : (
        <>
          <Table className="hidden sm:table">
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Assignments</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((t) => (
                <tr key={t.id} className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => navigate(`/teachers/${t.id}`)}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={`${t.firstName} ${t.lastName}`} size="sm" />
                      <span className="font-medium text-foreground">{t.firstName} {t.lastName}</span>
                    </div>
                  </Td>
                  <Td className="text-muted-foreground">{t.user.email}</Td>
                  <Td>
                    <Badge tone="slate">{t.teacherAssignments.length} subject{t.teacherAssignments.length === 1 ? "" : "s"}</Badge>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>

          <div className="space-y-2 sm:hidden">
            {rows.map((t) => (
              <Card key={t.id} className="flex items-center gap-3 p-3" onClick={() => navigate(`/teachers/${t.id}`)}>
                <Avatar name={`${t.firstName} ${t.lastName}`} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{t.firstName} {t.lastName}</p>
                  <p className="truncate text-xs text-muted-foreground">{t.user.email}</p>
                </div>
                <Badge tone="slate">{t.teacherAssignments.length}</Badge>
              </Card>
            ))}
          </div>
        </>
      )}

      {showAdd && <AddTeacherModal onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}

function AddTeacherModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/teachers", {
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        password: form.password,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create teacher");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Add Teacher" description="A temporary password is required; the teacher can change it later." onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Email" htmlFor="t-email" required>
          <Input id="t-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" htmlFor="t-fn" required>
            <Input id="t-fn" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
          </Field>
          <Field label="Last name" htmlFor="t-ln" required>
            <Input id="t-ln" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          </Field>
        </div>
        <Field label="Temp password" htmlFor="t-pw" hint="At least 8 characters." required>
          <Input id="t-pw" type="password" minLength={8} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        </Field>
        <ErrorText>{error}</ErrorText>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
        </div>
      </form>
    </Modal>
  );
}

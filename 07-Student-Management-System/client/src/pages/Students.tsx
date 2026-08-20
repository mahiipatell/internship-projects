import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Avatar, Badge, Button, Card, ErrorText, Field, Input, Modal, PageHeader, EmptyState, Select, Spinner, Table, Td, Th } from "../components/ui";
import { IconPlus, IconSearch, IconStudents } from "../components/icons";

type Section = { id: string; name: string; class: { name: string } };
type Student = {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  active: boolean;
  section: { name: string; class: { name: string } } | null;
  user: { email: string };
};

export default function Students() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Student[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const pageSize = 20;

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = new URLSearchParams({ page: String(page), pageSize: String(pageSize) });
      if (search) qs.set("search", search);
      const data = await api.get<{ data: Student[]; total: number }>(`/students?${qs}`);
      setRows(data.data);
      setTotal(data.total);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load students");
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <PageHeader
        title="Students"
        description={total ? `${total} student${total === 1 ? "" : "s"} enrolled` : undefined}
        icon={<IconStudents className="h-5 w-5" />}
        actions={user?.role === "ADMIN" && <Button onClick={() => setShowAdd(true)} className="gap-1.5"><IconPlus className="h-4 w-4" /> Add Student</Button>}
      />

      <div className="relative max-w-sm">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {error && <ErrorText>{error}</ErrorText>}

      {loading ? (
        <Spinner full />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<IconStudents className="h-5 w-5" />}
          title="No students found"
          description={search ? "Try a different search term." : "Add a student to get started."}
          action={user?.role === "ADMIN" && <Button className="gap-1.5" onClick={() => setShowAdd(true)}><IconPlus className="h-4 w-4" /> Add Student</Button>}
        />
      ) : (
        <>
          <Table className="hidden sm:table">
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Roll #</Th>
                <Th>Email</Th>
                <Th>Class / Section</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((s) => (
                <tr key={s.id} className="cursor-pointer transition-colors hover:bg-muted/50" onClick={() => navigate(`/students/${s.id}`)}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={`${s.firstName} ${s.lastName}`} size="sm" />
                      <span className="font-medium text-foreground">{s.firstName} {s.lastName}</span>
                    </div>
                  </Td>
                  <Td className="font-mono text-muted-foreground">{s.rollNumber}</Td>
                  <Td className="text-muted-foreground">{s.user.email}</Td>
                  <Td className="text-muted-foreground">
                    {s.section ? `${s.section.class.name} - ${s.section.name}` : "—"}
                    {!s.active && " · "}
                    {!s.active && <Badge tone="destructive">Inactive</Badge>}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>

          <div className="space-y-2 sm:hidden">
            {rows.map((s) => (
              <Card key={s.id} className="flex items-center gap-3 p-3" onClick={() => navigate(`/students/${s.id}`)}>
                <Avatar name={`${s.firstName} ${s.lastName}`} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">{s.firstName} {s.lastName}</p>
                  <p className="truncate text-xs text-muted-foreground">{s.user.email}</p>
                </div>
                <span className="shrink-0 text-xs font-mono text-muted-foreground">{s.rollNumber}</span>
                <span className="shrink-0 text-xs text-muted-foreground">{s.section ? `${s.section.class.name} - ${s.section.name}` : "—"}</span>
              </Card>
            ))}
          </div>

          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Page {page} of {totalPages}</span>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
              <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Next</Button>
            </div>
          </div>
        </>
      )}

      {showAdd && <AddStudentModal onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); setPage(1); load(); }} />}
    </div>
  );
}

function AddStudentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [sections, setSections] = useState<Section[]>([]);
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", rollNumber: "", dob: "", sectionId: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get<Section[]>("/sections").then(setSections).catch(() => setSections([]));
  }, []);

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/students", {
        email: form.email,
        firstName: form.firstName,
        lastName: form.lastName,
        rollNumber: form.rollNumber,
        dob: form.dob || undefined,
        sectionId: form.sectionId || undefined,
        password: form.password,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create student");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Add Student" description="A temporary password is required; the student can change it later." onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Email" htmlFor="s-email" required>
          <Input id="s-email" type="email" value={form.email} onChange={(e) => set("email", e.target.value)} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" htmlFor="s-fn" required>
            <Input id="s-fn" value={form.firstName} onChange={(e) => set("firstName", e.target.value)} required />
          </Field>
          <Field label="Last name" htmlFor="s-ln" required>
            <Input id="s-ln" value={form.lastName} onChange={(e) => set("lastName", e.target.value)} required />
          </Field>
        </div>
        <Field label="Roll number" htmlFor="s-roll" required hint="Unique within the student's section, e.g. 10A-01.">
          <Input id="s-roll" value={form.rollNumber} onChange={(e) => set("rollNumber", e.target.value)} required />
        </Field>
        <Field label="Date of birth" htmlFor="s-dob">
          <Input id="s-dob" type="date" value={form.dob} onChange={(e) => set("dob", e.target.value)} />
        </Field>
        <Field label="Section" htmlFor="s-sec">
          <Select id="s-sec" value={form.sectionId} onChange={(e) => set("sectionId", e.target.value)}>
            <option value="">— None —</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.class.name} - {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Temp password" htmlFor="s-pw" hint="At least 8 characters." required>
          <Input id="s-pw" type="password" minLength={8} required value={form.password} onChange={(e) => set("password", e.target.value)} />
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

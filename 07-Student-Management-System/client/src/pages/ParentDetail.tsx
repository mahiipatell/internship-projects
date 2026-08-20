import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { Avatar, Badge, Button, Card, ConfirmDialog, ErrorText, Field, IconButton, Input, Select, Spinner } from "../components/ui";
import { IconChevronLeft } from "../components/icons";

type Child = {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  user: { email: string };
  section: { name: string; class: { name: string } } | null;
};

type Parent = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  active: boolean;
  children: Child[];
};

type StudentOption = {
  id: string;
  firstName: string;
  lastName: string;
  rollNumber: string;
  user: { email: string };
  section: { name: string; class: { name: string } } | null;
};

const nameOf = (p: { firstName: string | null; lastName: string | null; email: string }) =>
  [p.firstName, p.lastName].filter(Boolean).join(" ") || p.email;

export default function ParentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [parent, setParent] = useState<Parent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    setError("");
    try {
      setParent(await api.get<Parent>(`/parents/${id}`));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load parent");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading) return <Spinner full />;
  if (error || !parent) return <ErrorText>{error || "Parent not found"}</ErrorText>;

  return (
    <div className="space-y-5">
      <IconButton aria-label="Back to parents" className="text-muted-foreground" onClick={() => navigate("/parents")}>
        <IconChevronLeft className="h-5 w-5" />
        <span className="ml-1 text-sm font-medium">Back</span>
      </IconButton>

      <Card className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <Avatar name={nameOf(parent)} size="lg" />
          <div>
            <h1 className="text-xl font-semibold text-foreground">{nameOf(parent)}</h1>
            <p className="text-sm text-muted-foreground">{parent.email}</p>
          </div>
        </div>
        {!parent.active && <Badge tone="destructive">Inactive</Badge>}
      </Card>

      <EditForm parent={parent} onSaved={load} />
      <ChildrenCard parent={parent} onChanged={load} />
    </div>
  );
}

function EditForm({ parent, onSaved }: { parent: Parent; onSaved: () => void }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: parent.firstName ?? "",
    lastName: parent.lastName ?? "",
    email: parent.email,
    active: parent.active,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.patch(`/parents/${parent.id}`, {
        firstName: form.firstName,
        lastName: form.lastName,
        email: form.email,
        active: form.active,
      });
      onSaved();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    setBusy(true);
    setError("");
    try {
      await api.del(`/parents/${parent.id}`);
      navigate("/parents");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete");
    } finally {
      setBusy(false);
      setShowDelete(false);
    }
  }

  return (
    <Card className="max-w-lg p-5">
      <form onSubmit={save} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" htmlFor="p-fn">
            <Input id="p-fn" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
          </Field>
          <Field label="Last name" htmlFor="p-ln">
            <Input id="p-ln" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
          </Field>
        </div>
        <Field label="Email" htmlFor="p-email">
          <Input id="p-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </Field>
        <label className="flex items-center gap-2 text-sm text-foreground">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm({ ...form, active: e.target.checked })}
            className="h-4 w-4 rounded border-input"
          />
          Active
        </label>
        <ErrorText>{error}</ErrorText>
        <div className="flex justify-end gap-2">
          <Button variant="danger" type="button" disabled={busy} onClick={() => setShowDelete(true)}>Delete</Button>
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
        </div>
      </form>

      {showDelete && (
        <ConfirmDialog
          title="Delete parent"
          message={`Delete ${nameOf(parent)} (${parent.email})? Their login will be removed. Linked children must be unlinked first.`}
          confirmLabel="Delete"
          onConfirm={remove}
          onClose={() => setShowDelete(false)}
        />
      )}
    </Card>
  );
}

function ChildrenCard({ parent, onChanged }: { parent: Parent; onChanged: () => void }) {
  const [students, setStudents] = useState<StudentOption[]>([]);
  const [toLink, setToLink] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api
      .get<{ data: StudentOption[] }>("/students?pageSize=500")
      .then((d) => setStudents(d.data))
      .catch(() => setStudents([]));
  }, []);

  const childIds = new Set(parent.children.map((c) => c.id));
  const linkable = students.filter((s) => !childIds.has(s.id));

  async function link(e: React.FormEvent) {
    e.preventDefault();
    if (!toLink) return;
    setBusy(true);
    setError("");
    try {
      await api.patch(`/students/${toLink}`, { parentId: parent.id });
      setToLink("");
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to link child");
    } finally {
      setBusy(false);
    }
  }

  async function unlink(childId: string) {
    setBusy(true);
    setError("");
    try {
      await api.patch(`/students/${childId}`, { parentId: null });
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to unlink child");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <h2 className="mb-3 font-semibold">Linked children ({parent.children.length})</h2>

      {parent.children.length === 0 ? (
        <p className="text-sm text-muted-foreground">No children linked to this parent yet.</p>
      ) : (
        <ul className="mb-4 divide-y divide-border text-sm">
          {parent.children.map((c) => (
            <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <p className="font-medium text-foreground">{c.firstName} {c.lastName}</p>
                <p className="text-muted-foreground">{c.user.email} · Roll {c.rollNumber}{c.section ? ` · ${c.section.class.name} - ${c.section.name}` : ""}</p>
              </div>
              <Button variant="ghost" size="sm" disabled={busy} onClick={() => unlink(c.id)}>Remove</Button>
            </li>
          ))}
        </ul>
      )}

      <form onSubmit={link} className="flex flex-wrap items-end gap-3">
        <Field label="Link a child" htmlFor="link-child" className="min-w-[14rem] grow">
          <Select id="link-child" value={toLink} onChange={(e) => setToLink(e.target.value)}>
            <option value="">Select a student…</option>
            {linkable.map((s) => (
              <option key={s.id} value={s.id}>
                {s.firstName} {s.lastName} ({s.rollNumber})
              </option>
            ))}
          </Select>
        </Field>
        <Button type="submit" disabled={busy || !toLink}>Link</Button>
      </form>
      <ErrorText>{error}</ErrorText>
    </Card>
  );
}

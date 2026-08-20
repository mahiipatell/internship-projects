import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { Avatar, Badge, Button, Card, EmptyState, ErrorText, Field, Input, Modal, PageHeader, Spinner, Table, Td, Th } from "../components/ui";
import { IconParents, IconPlus } from "../components/icons";

type Parent = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string;
  active: boolean;
  children: { id: string; firstName: string; lastName: string }[];
};

const nameOf = (p: Parent) => [p.firstName, p.lastName].filter(Boolean).join(" ") || p.email;

export default function Parents() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Parent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await api.get<Parent[]>("/parents"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load parents");
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
        title="Parents"
        description={rows.length ? `${rows.length} parent${rows.length === 1 ? "" : "s"}` : undefined}
        icon={<IconParents className="h-5 w-5" />}
        actions={user?.role === "ADMIN" && <Button className="gap-1.5" onClick={() => setShowAdd(true)}><IconPlus className="h-4 w-4" /> Add Parent</Button>}
      />

      {error && <ErrorText>{error}</ErrorText>}

      {loading ? (
        <Spinner full />
      ) : rows.length === 0 ? (
        <EmptyState
          icon={<IconParents className="h-5 w-5" />}
          title="No parents yet"
          description="Add a parent to link them to their children."
          action={user?.role === "ADMIN" && <Button className="gap-1.5" onClick={() => setShowAdd(true)}><IconPlus className="h-4 w-4" /> Add Parent</Button>}
        />
      ) : (
        <>
          <Table className="hidden sm:table">
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Children</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="cursor-pointer border-b border-border transition-colors hover:bg-muted/50" onClick={() => navigate(`/parents/${p.id}`)}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar name={nameOf(p)} size="sm" />
                      <span className="font-medium text-foreground">{nameOf(p)}</span>
                      {!p.active && <Badge tone="destructive">Inactive</Badge>}
                    </div>
                  </Td>
                  <Td className="text-muted-foreground">{p.email}</Td>
                  <Td className="text-muted-foreground">
                    {p.children.length ? p.children.map((c) => `${c.firstName} ${c.lastName}`).join(", ") : "—"}
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>

          <div className="space-y-2 sm:hidden">
            {rows.map((p) => (
              <Card key={p.id} className="flex items-center gap-3 p-3" onClick={() => navigate(`/parents/${p.id}`)}>
                <Avatar name={nameOf(p)} size="sm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-medium text-foreground">{nameOf(p)}</p>
                    {!p.active && <Badge tone="destructive">Inactive</Badge>}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{p.email}</p>
                  {p.children.length > 0 && (
                    <p className="truncate text-xs text-muted-foreground">{p.children.map((c) => `${c.firstName} ${c.lastName}`).join(", ")}</p>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {showAdd && <AddParentModal onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}

function AddParentModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState({ email: "", firstName: "", lastName: "", password: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/parents", form);
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create parent");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Add Parent" description="A temporary password is required; the parent can change it later." onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Email" htmlFor="p-email" required>
          <Input id="p-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" htmlFor="p-fn" required>
            <Input id="p-fn" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} required />
          </Field>
          <Field label="Last name" htmlFor="p-ln" required>
            <Input id="p-ln" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} required />
          </Field>
        </div>
        <Field label="Temp password" htmlFor="p-pw" hint="At least 8 characters." required>
          <Input id="p-pw" type="password" minLength={8} required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
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

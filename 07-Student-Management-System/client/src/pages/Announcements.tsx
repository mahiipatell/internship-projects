import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../components/toast";
import { Avatar, Badge, Button, Card, EmptyState, ErrorText, Field, Input, Modal, PageHeader, Select, Spinner, Textarea } from "../components/ui";
import { IconAnnouncements, IconPlus } from "../components/icons";

type Announcement = {
  id: string;
  title: string;
  body: string;
  scope: "INSTITUTION" | "SECTION";
  createdAt: string;
  author: { firstName: string | null; lastName: string | null };
  section?: { name: string; class: { name: string } } | null;
};

function authorName(a: Announcement["author"]) {
  return [a?.firstName, a?.lastName].filter(Boolean).join(" ") || "Unknown";
}

function fmtDate(s: string) {
  return new Date(s).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function Announcements() {
  const { user } = useAuth();
  const canPost = user?.role === "ADMIN" || user?.role === "TEACHER";

  const [items, setItems] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setItems(await api.get<Announcement[]>("/announcements"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load announcements");
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
        title="Announcements"
        description={items.length ? `${items.length} post${items.length === 1 ? "" : "s"}` : undefined}
        icon={<IconAnnouncements className="h-5 w-5" />}
        actions={canPost && <Button className="gap-1.5" onClick={() => setShowAdd(true)}><IconPlus className="h-4 w-4" /> Post Announcement</Button>}
      />
      {error && <ErrorText>{error}</ErrorText>}

      {loading ? (
        <Spinner full />
      ) : items.length === 0 ? (
        <EmptyState
          icon={<IconAnnouncements className="h-5 w-5" />}
          title="No announcements yet"
          description={canPost ? "Post an update for your school or section." : "Announcements will appear here."}
          action={canPost && <Button className="gap-1.5" onClick={() => setShowAdd(true)}><IconPlus className="h-4 w-4" /> Post Announcement</Button>}
        />
      ) : (
        <div className="space-y-3">
          {items.map((a) => (
            <Card key={a.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-semibold text-foreground">{a.title}</h2>
                <Badge tone={a.scope === "INSTITUTION" ? "primary" : "slate"}>
                  {a.scope === "INSTITUTION" ? "All" : `${a.section?.class.name} - ${a.section?.name}`}
                </Badge>
              </div>
              <p className="mt-1.5 whitespace-pre-wrap text-sm text-muted-foreground">{a.body}</p>
              <div className="mt-3 flex items-center gap-2">
                <Avatar name={authorName(a.author)} size="sm" />
                <p className="text-xs text-muted-foreground">
                  {authorName(a.author)} · {fmtDate(a.createdAt)}
                </p>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showAdd && <CreateAnnouncementModal onClose={() => setShowAdd(false)} onCreated={() => { setShowAdd(false); load(); }} />}
    </div>
  );
}

function CreateAnnouncementModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const toast = useToast();
  const { user } = useAuth();
  const [sections, setSections] = useState<{ id: string; name: string; class: { name: string } }[]>([]);
  const [form, setForm] = useState({ title: "", body: "", scope: "SECTION", sectionId: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get<{ id: string; name: string; class: { name: string } }[]>("/sections").then(setSections).catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/announcements", {
        title: form.title,
        body: form.body,
        scope: form.scope,
        sectionId: form.scope === "SECTION" ? form.sectionId : undefined,
      });
      toast.success("Announcement posted");
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to post");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Post Announcement" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Title" htmlFor="an-title" required>
          <Input id="an-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </Field>
        <Field label="Message" htmlFor="an-body" required>
          <Textarea id="an-body" value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} required />
        </Field>
        <Field label="Scope" htmlFor="an-scope">
          <Select
            id="an-scope"
            value={form.scope}
            onChange={(e) => setForm({ ...form, scope: e.target.value })}
            disabled={user?.role === "TEACHER"}
          >
            <option value="SECTION">My section</option>
            {user?.role === "ADMIN" && <option value="INSTITUTION">Whole institution</option>}
          </Select>
        </Field>
        {form.scope === "SECTION" && (
          <Field label="Section" htmlFor="an-sec" required>
            <Select id="an-sec" value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })} required>
              <option value="">Select section</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.class.name} - {s.name}
                </option>
              ))}
            </Select>
          </Field>
        )}
        <ErrorText>{error}</ErrorText>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? "Posting…" : "Post"}</Button>
        </div>
      </form>
    </Modal>
  );
}

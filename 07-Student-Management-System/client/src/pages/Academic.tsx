import { useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { Badge, Button, Card, ErrorText, Field, Input, PageHeader, Select, Spinner } from "../components/ui";
import { IconAcademic, IconBook, IconPlus } from "../components/icons";

type Class = { id: string; name: string };
type Section = { id: string; name: string; class: { name: string } };
type Subject = { id: string; name: string; code: string };

export default function Academic() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const [c, s, sub] = await Promise.all([
        api.get<Class[]>("/classes"),
        api.get<Section[]>("/sections"),
        api.get<Subject[]>("/subjects"),
      ]);
      setClasses(c);
      setSections(s);
      setSubjects(sub);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <Spinner full />;

  return (
    <div className="space-y-6">
      <PageHeader title="Classes & Subjects" description="Manage the academic structure of your school." icon={<IconAcademic className="h-5 w-5" />} />
      {error && <ErrorText>{error}</ErrorText>}

      <Card className="p-5">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <IconAcademic className="h-4 w-4 text-primary" /> Classes
        </h2>
        <div className="mb-3 flex flex-wrap gap-2">
          {classes.map((c) => (
            <Badge key={c.id} tone="primary">{c.name}</Badge>
          ))}
          {classes.length === 0 && <span className="text-sm text-muted-foreground">No classes yet</span>}
        </div>
        <AddForm
          placeholder="Class name (e.g. Grade 10)"
          onSubmit={async (name) => {
            await api.post("/classes", { name });
            load();
          }}
        />
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <IconAcademic className="h-4 w-4 text-primary" /> Sections
        </h2>
        <ul className="mb-3 divide-y divide-border">
          {sections.map((s) => (
            <li key={s.id} className="py-2 text-sm">
              {s.class.name} - <span className="font-medium text-foreground">{s.name}</span>
            </li>
          ))}
          {sections.length === 0 && <li className="text-sm text-muted-foreground">No sections yet</li>}
        </ul>
        <AddSectionForm
          classes={classes}
          onSubmit={async (classId, name) => {
            await api.post("/sections", { classId, name });
            load();
          }}
        />
      </Card>

      <Card className="p-5">
        <h2 className="mb-3 flex items-center gap-2 font-semibold">
          <IconBook className="h-4 w-4 text-primary" /> Subjects
        </h2>
        <ul className="mb-3 divide-y divide-border">
          {subjects.map((s) => (
            <li key={s.id} className="py-2 text-sm">
              <span className="font-medium text-foreground">{s.name}</span>{" "}
              <span className="text-muted-foreground">({s.code})</span>
            </li>
          ))}
          {subjects.length === 0 && <li className="text-sm text-muted-foreground">No subjects yet</li>}
        </ul>
        <AddSubjectForm
          onSubmit={async (name, code) => {
            await api.post("/subjects", { name, code });
            load();
          }}
        />
      </Card>

      <ClassSubjectsCard classes={classes} subjects={subjects} />
    </div>
  );
}

type ClassSubject = { id: string; subject: Subject };

// Which subjects a class teaches — the ClassSubject join table.
function ClassSubjectsCard({ classes, subjects }: { classes: Class[]; subjects: Subject[] }) {
  const [classId, setClassId] = useState("");
  const [rows, setRows] = useState<ClassSubject[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function load(id: string) {
    if (!id) return setRows([]);
    try {
      setRows(await api.get<ClassSubject[]>(`/classes/${id}/subjects`));
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed to load");
    }
  }

  useEffect(() => {
    load(classId);
  }, [classId]);

  async function run(fn: () => Promise<unknown>) {
    setBusy(true);
    setErr("");
    try {
      await fn();
      await load(classId);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  const unmapped = subjects.filter((s) => !rows.some((r) => r.subject.id === s.id));

  return (
    <Card className="p-5">
      <h2 className="mb-3 flex items-center gap-2 font-semibold">
        <IconBook className="h-4 w-4 text-primary" /> Subjects per Class
      </h2>
      <Select value={classId} onChange={(e) => setClassId(e.target.value)} className="mb-3 max-w-[12rem]">
        <option value="">Select class</option>
        {classes.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </Select>

      {classId && (
        <>
          <ul className="mb-3 divide-y divide-border">
            {rows.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>
                  <span className="font-medium text-foreground">{r.subject.name}</span>{" "}
                  <span className="text-muted-foreground">({r.subject.code})</span>
                </span>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={busy}
                  onClick={() => run(() => api.del(`/classes/${classId}/subjects/${r.subject.id}`))}
                >
                  Remove
                </Button>
              </li>
            ))}
            {rows.length === 0 && <li className="text-sm text-muted-foreground">No subjects mapped yet</li>}
          </ul>

          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!subjectId) return;
              run(() => api.post(`/classes/${classId}/subjects`, { subjectId })).then(() => setSubjectId(""));
            }}
          >
            <Select value={subjectId} onChange={(e) => setSubjectId(e.target.value)} className="max-w-[12rem]">
              <option value="">Select subject</option>
              {unmapped.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </Select>
            <Button type="submit" disabled={busy || !subjectId}>
              Add
            </Button>
          </form>
        </>
      )}
      <ErrorText>{err}</ErrorText>
    </Card>
  );
}

function AddForm({ placeholder, onSubmit }: { placeholder: string; onSubmit: (name: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setErr("");
    try {
      await onSubmit(name.trim());
      setName("");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Field error={err}>
      <form onSubmit={submit} className="flex gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder={placeholder} />
        <Button type="submit" disabled={busy} className="gap-1.5">
          <IconPlus className="h-4 w-4" /> Add
        </Button>
      </form>
    </Field>
  );
}

function AddSectionForm({
  classes,
  onSubmit,
}: {
  classes: Class[];
  onSubmit: (classId: string, name: string) => Promise<void>;
}) {
  const [classId, setClassId] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!classId || !name.trim()) return;
    setBusy(true);
    setErr("");
    try {
      await onSubmit(classId, name.trim());
      setName("");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Field error={err}>
      <form onSubmit={submit} className="flex flex-wrap gap-2">
        <Select value={classId} onChange={(e) => setClassId(e.target.value)} className="max-w-[10rem]">
          <option value="">Select class</option>
          {classes.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </Select>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Section (e.g. A)" className="max-w-[8rem]" />
        <Button type="submit" disabled={busy || !classId} className="gap-1.5">
          <IconPlus className="h-4 w-4" /> Add
        </Button>
      </form>
    </Field>
  );
}

function AddSubjectForm({ onSubmit }: { onSubmit: (name: string, code: string) => Promise<void> }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    setBusy(true);
    setErr("");
    try {
      await onSubmit(name.trim(), code.trim());
      setName("");
      setCode("");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Field error={err}>
      <form onSubmit={submit} className="flex flex-wrap gap-2">
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Subject name" className="max-w-[12rem]" />
        <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code (e.g. MATH)" className="max-w-[8rem]" />
        <Button type="submit" disabled={busy} className="gap-1.5">
          <IconPlus className="h-4 w-4" /> Add
        </Button>
      </form>
    </Field>
  );
}

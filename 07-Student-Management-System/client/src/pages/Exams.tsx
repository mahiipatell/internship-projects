import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../components/toast";
import { Badge, Button, Card, EmptyState, ErrorText, Field, Input, Modal, PageHeader, Select, Spinner, Table, Td, Th } from "../components/ui";
import { IconExams, IconPlus } from "../components/icons";

type Subject = { id: string; name: string; code: string };
type Section = { id: string; name: string; class: { name: string } };
type Exam = {
  id: string;
  name: string;
  maxMarks: number;
  subject: { name: string };
  section: { id: string; name: string; class: { name: string } };
  _count: { marks: number };
};
type Mark = { studentId: string; marksObtained: number | null; published: boolean; student: { firstName: string; lastName: string } };
type RosterStudent = { id: string; firstName: string; lastName: string };

export default function Exams() {
  const toast = useToast();
  const { user } = useAuth();
  const canEdit = user?.role === "ADMIN" || user?.role === "TEACHER";

  const [exams, setExams] = useState<Exam[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [selected, setSelected] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const loadExams = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setExams(await api.get<Exam[]>("/exams"));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load exams");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExams();
    api.get<Section[]>("/sections").then(setSections).catch(() => setSections([]));
    api.get<Subject[]>("/subjects").then(setSubjects).catch(() => setSubjects([]));
  }, [loadExams]);

  async function openExam(exam: Exam) {
    setSelected(exam);
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Exams & Marks"
        description={exams.length ? `${exams.length} exam${exams.length === 1 ? "" : "s"}` : undefined}
        icon={<IconExams className="h-5 w-5" />}
        actions={canEdit && <Button className="gap-1.5" onClick={() => setShowAdd(true)}><IconPlus className="h-4 w-4" /> Add Exam</Button>}
      />
      {error && <ErrorText>{error}</ErrorText>}

      {loading ? (
        <Spinner full />
      ) : exams.length === 0 ? (
        <EmptyState
          icon={<IconExams className="h-5 w-5" />}
          title="No exams yet"
          description="Create an exam to start recording marks."
          action={canEdit && <Button className="gap-1.5" onClick={() => setShowAdd(true)}><IconPlus className="h-4 w-4" /> Add Exam</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {exams.map((e) => (
            <Card
              key={e.id}
              className={`cursor-pointer p-4 transition-all ${selected?.id === e.id ? "ring-2 ring-primary" : ""}`}
              onClick={() => openExam(e)}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="font-semibold text-foreground">{e.name}</p>
                {e._count.marks > 0 && <Badge tone={e._count.marks > 0 ? "success" : "warning"}>{e._count.marks} marks</Badge>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {e.subject.name} · {e.section.class.name} - {e.section.name}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Max: {e.maxMarks}</p>
            </Card>
          ))}
        </div>
      )}

      {selected && (
        <MarksPanel exam={selected} canEdit={canEdit} onChanged={loadExams} onClose={() => setSelected(null)} toast={toast} />
      )}

      {showAdd && (
        <AddExamModal
          sections={sections}
          subjects={subjects}
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            loadExams();
          }}
        />
      )}
    </div>
  );
}

function MarksPanel({
  exam,
  canEdit,
  onChanged,
  onClose,
  toast,
}: {
  exam: Exam;
  canEdit: boolean;
  onChanged: () => void;
  onClose: () => void;
  toast: ReturnType<typeof useToast>;
}) {
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [marks, setMarks] = useState<Record<string, string>>({});
  const [published, setPublished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const markRes = await api.get<Mark[]>(`/exams/${exam.id}/marks`);
      const map: Record<string, string> = {};
      for (const m of markRes) map[m.studentId] = m.marksObtained != null ? String(m.marksObtained) : "";
      setMarks(map);
      setPublished(markRes.length > 0 ? markRes[0].published : false);
      // /students is admin+teacher only; students/parents derive the rows they
      // are allowed to see from their own marks.
      setRoster(
        canEdit
          ? (await api.get<{ data: RosterStudent[] }>(`/students?sectionId=${exam.section.id}&pageSize=200`)).data
          : markRes.map((m) => ({ id: m.studentId, ...m.student })),
      );
    } catch (err) {
      setRoster([]);
      setError(err instanceof ApiError ? err.message : "Failed to load marks");
    } finally {
      setLoading(false);
    }
  }, [exam.id, exam.section.id, canEdit]);

  useEffect(() => {
    load();
  }, [load]);

  async function submit() {
    setError("");
    try {
      await api.post(`/exams/${exam.id}/marks`, {
        records: roster.map((s) => ({
          studentId: s.id,
          marksObtained: marks[s.id] === "" ? null : Number(marks[s.id]),
        })),
      });
      toast.success("Marks saved");
      load();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save");
    }
  }

  async function publish() {
    setError("");
    try {
      await api.post(`/exams/${exam.id}/publish`, {});
      toast.success("Exam published");
      load();
      onChanged();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to publish");
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 className="flex items-center gap-2 font-semibold text-foreground">
            {exam.name}
            {published && <Badge tone="success">Published</Badge>}
          </h2>
          <p className="text-sm text-muted-foreground">
            {exam.subject.name} · Max {exam.maxMarks}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
      </div>

      {error && <ErrorText>{error}</ErrorText>}

      {loading ? (
        <Spinner />
      ) : error ? null : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Student</Th>
                <Th>Marks</Th>
              </tr>
            </thead>
            <tbody>
              {roster.map((s) => (
                <tr key={s.id} className="border-b border-border">
                  <Td className="font-medium text-foreground">{s.firstName} {s.lastName}</Td>
                  <Td>
                    {canEdit && !published ? (
                      <Input
                        type="number"
                        min={0}
                        max={exam.maxMarks}
                        value={marks[s.id] ?? ""}
                        onChange={(e) => setMarks((m) => ({ ...m, [s.id]: e.target.value }))}
                        className="max-w-[8rem]"
                      />
                    ) : (
                      <span className="text-muted-foreground">{marks[s.id] ? `${marks[s.id]} / ${exam.maxMarks}` : "—"}</span>
                    )}
                  </Td>
                </tr>
              ))}
              {roster.length === 0 && (
                <tr>
                  <Td colSpan={2} className="px-3 py-6 text-center text-muted-foreground">
                    {canEdit ? "No students in this section." : "No published results yet."}
                  </Td>
                </tr>
              )}
            </tbody>
          </Table>

          {canEdit && (
            <div className="mt-4 flex flex-wrap gap-2">
              {!published && <Button size="sm" onClick={submit}>Submit Marks</Button>}
              {!published && (
                <Button variant="secondary" size="sm" onClick={publish}>Publish</Button>
              )}
            </div>
          )}
        </>
      )}
    </Card>
  );
}

function AddExamModal({
  sections,
  subjects,
  onClose,
  onCreated,
}: {
  sections: Section[];
  subjects: Subject[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({ name: "", subjectId: "", sectionId: "", maxMarks: "", examDate: "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/exams", {
        name: form.name,
        subjectId: form.subjectId,
        sectionId: form.sectionId,
        maxMarks: Number(form.maxMarks),
        examDate: form.examDate || undefined,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create exam");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Add Exam" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Exam name" htmlFor="e-name" required>
          <Input id="e-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        </Field>
        <Field label="Subject" htmlFor="e-sub" required>
          <Select id="e-sub" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} required>
            <option value="">Select subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Section" htmlFor="e-sec" required>
          <Select id="e-sec" value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })} required>
            <option value="">Select section</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.class.name} - {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Max marks" htmlFor="e-max" required>
            <Input id="e-max" type="number" min={1} value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value })} required />
          </Field>
          <Field label="Exam date" htmlFor="e-date">
            <Input id="e-date" type="date" value={form.examDate} onChange={(e) => setForm({ ...form, examDate: e.target.value })} />
          </Field>
        </div>
        <ErrorText>{error}</ErrorText>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={busy}>{busy ? "Saving…" : "Save"}</Button>
        </div>
      </form>
    </Modal>
  );
}

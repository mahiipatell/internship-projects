import { useCallback, useEffect, useState } from "react";
import { api, ApiError } from "../lib/api";
import { useAuth } from "../lib/auth";
import { useToast } from "../components/toast";
import { Button, Card, ErrorText, Field, Input, Modal, PageHeader, Select, Spinner, Th, Td } from "../components/ui";
import { IconPlus, IconTimetable } from "../components/icons";

type Slot = {
  id: string;
  sectionId: string;
  dayOfWeek: number;
  period: number;
  subject: { name: string };
  teacher: { user: { firstName: string; lastName: string } };
  section?: { name: string; class: { name: string } };
};

const DAYS = [
  { n: 1, label: "Mon" },
  { n: 2, label: "Tue" },
  { n: 3, label: "Wed" },
  { n: 4, label: "Thu" },
  { n: 5, label: "Fri" },
  { n: 6, label: "Sat" },
];

export default function Timetable() {
  const toast = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [sections, setSections] = useState<{ id: string; name: string; class: { name: string } }[]>([]);
  const [subjects, setSubjects] = useState<{ id: string; name: string }[]>([]);
  const [teachers, setTeachers] = useState<{ id: string; user: { firstName: string; lastName: string } }[]>([]);
  const [showAdd, setShowAdd] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const qs = sectionFilter ? `?sectionId=${sectionFilter}` : "";
      const data = await api.get<Slot[]>(`/timetable${qs}`);
      setSlots(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load timetable");
    } finally {
      setLoading(false);
    }
  }, [sectionFilter]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (isAdmin) {
      api.get<{ id: string; name: string; class: { name: string } }[]>("/sections").then(setSections).catch(() => {});
      api.get<{ id: string; name: string }[]>("/subjects").then(setSubjects).catch(() => {});
      api.get<{ id: string; user: { firstName: string; lastName: string } }[]>("/teachers").then(setTeachers).catch(() => {});
    }
  }, [isAdmin]);

  const periods = Array.from(
    { length: Math.max(8, slots.reduce((m, s) => Math.max(m, s.period), 0)) },
    (_, i) => i + 1,
  );

  const cellMap = new Map<string, Slot>();
  for (const s of slots) cellMap.set(`${s.dayOfWeek}-${s.period}`, s);

  async function deleteSlot(id: string) {
    try {
      await api.del(`/timetable/${id}`);
      toast.success("Slot removed");
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete");
    }
  }

  return (
    <div className="space-y-4">
      <PageHeader
        title="Timetable"
        icon={<IconTimetable className="h-5 w-5" />}
        actions={
          isAdmin && (
            <div className="flex flex-wrap gap-2">
              <Select value={sectionFilter} onChange={(e) => setSectionFilter(e.target.value)} className="w-44">
                <option value="">All sections</option>
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.class.name} - {s.name}
                  </option>
                ))}
              </Select>
              <Button className="gap-1.5" onClick={() => setShowAdd(true)}><IconPlus className="h-4 w-4" /> Add Slot</Button>
            </div>
          )
        }
      />

      {error && <ErrorText>{error}</ErrorText>}
      {loading ? (
        <Spinner full />
      ) : (
        <Card className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-muted-foreground">
                <Th>Period</Th>
                {DAYS.map((d) => (
                  <Th key={d.n}>{d.label}</Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map((p) => (
                <tr key={p} className="border-b border-border">
                  <Td className="font-semibold text-muted-foreground">{p}</Td>
                  {DAYS.map((d) => {
                    const slot = cellMap.get(`${d.n}-${p}`);
                    return (
                      <Td key={d.n} className="align-top">
                        {slot ? (
                          <div className="rounded-md bg-primary/10 p-2 text-xs">
                            <div className="font-semibold text-primary">{slot.subject.name}</div>
                            <div className="text-primary/70">
                              {slot.teacher.user.firstName} {slot.teacher.user.lastName}
                            </div>
                            {isAdmin && (
                              <button
                                className="mt-1 font-medium text-destructive hover:underline"
                                onClick={() => deleteSlot(slot.id)}
                              >
                                Remove
                              </button>
                            )}
                          </div>
                        ) : null}
                      </Td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {showAdd && (
        <AddSlotModal
          sections={sections}
          subjects={subjects}
          teachers={teachers}
          onClose={() => setShowAdd(false)}
          onCreated={() => {
            setShowAdd(false);
            load();
          }}
        />
      )}
    </div>
  );
}

function AddSlotModal({
  sections,
  subjects,
  teachers,
  onClose,
  onCreated,
}: {
  sections: { id: string; name: string; class: { name: string } }[];
  subjects: { id: string; name: string }[];
  teachers: { id: string; user: { firstName: string; lastName: string } }[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [form, setForm] = useState({ sectionId: "", subjectId: "", teacherId: "", dayOfWeek: "1", period: "1" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.post("/timetable", {
        sectionId: form.sectionId,
        subjectId: form.subjectId,
        teacherId: form.teacherId,
        dayOfWeek: Number(form.dayOfWeek),
        period: Number(form.period),
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add slot");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Add Timetable Slot" onClose={onClose}>
      <form onSubmit={submit} className="space-y-3">
        <Field label="Section" htmlFor="ts-sec" required>
          <Select id="ts-sec" value={form.sectionId} onChange={(e) => setForm({ ...form, sectionId: e.target.value })} required>
            <option value="">Select section</option>
            {sections.map((s) => (
              <option key={s.id} value={s.id}>
                {s.class.name} - {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Subject" htmlFor="ts-sub" required>
          <Select id="ts-sub" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} required>
            <option value="">Select subject</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Teacher" htmlFor="ts-tea" required>
          <Select id="ts-tea" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} required>
            <option value="">Select teacher</option>
            {teachers.map((t) => (
              <option key={t.id} value={t.id}>
                {t.user.firstName} {t.user.lastName}
              </option>
            ))}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Day" htmlFor="ts-day">
            <Select id="ts-day" value={form.dayOfWeek} onChange={(e) => setForm({ ...form, dayOfWeek: e.target.value })}>
              {DAYS.map((d) => (
                <option key={d.n} value={d.n}>
                  {d.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Period" htmlFor="ts-per">
            <Input id="ts-per" type="number" min={1} value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} />
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

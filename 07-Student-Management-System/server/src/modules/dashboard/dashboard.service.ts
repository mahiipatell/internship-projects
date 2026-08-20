import { prisma } from "../../lib/prisma.js";
import type { Role } from "@prisma/client";

type Caller = { id: string; role: Role };

function todayRange() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);
  return { start, end, dayOfWeek: new Date().getDay() };
}

async function ownTeacherId(userId: string) {
  const t = await prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
  return t?.id;
}

export async function getDashboard(caller: Caller) {
  if (caller.role === "ADMIN") {
    const [totalStudents, totalTeachers, totalClasses, todayAtt] = await Promise.all([
      prisma.student.count({ where: { active: true } }),
      prisma.teacher.count(),
      prisma.class.count(),
      prisma.attendance.findMany({ where: { date: { gte: todayRange().start, lte: todayRange().end } } }),
    ]);
    const present = todayAtt.filter((a) => a.status === "PRESENT").length;
    return {
      totalStudents,
      totalTeachers,
      totalClasses,
      todayAttendancePct: todayAtt.length ? Math.round((present / todayAtt.length) * 100) : 0,
    };
  }

  if (caller.role === "TEACHER") {
    const teacherId = await ownTeacherId(caller.id);
    if (!teacherId) return { todayClasses: [], examsNeedingMarks: [] };

    const assignments = await prisma.teacherAssignment.findMany({
      where: { teacherId },
      select: { sectionId: true },
    });
    const sectionIds = assignments.map((a) => a.sectionId);

    const [slots, examsNeedingMarks] = await Promise.all([
      prisma.timetableSlot.findMany({
        where: { teacherId, dayOfWeek: todayRange().dayOfWeek },
        include: { subject: true, section: { include: { class: true } } },
        orderBy: { period: "asc" },
      }),
      // Exams in the teacher's sections with nothing published yet.
      prisma.exam.findMany({
        where: { sectionId: { in: sectionIds }, marks: { none: { published: true } } },
        include: { subject: true, section: { include: { class: true } }, _count: { select: { marks: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);
    return { todayClasses: slots, examsNeedingMarks };
  }

  if (caller.role === "STUDENT") {
    const student = await prisma.student.findUnique({
      where: { userId: caller.id },
      include: { section: { include: { class: true } }, attendances: true },
    });
    const sid = student?.id;
    const sectionId = student?.sectionId;
    const now = new Date();

    const [upcoming, todaySlots, exams, marks, announcements] = await Promise.all([
      sectionId
        ? prisma.assignment.findMany({
            where: { sectionId, dueDate: { gte: now } },
            include: { subject: true },
            orderBy: { dueDate: "asc" },
            take: 5,
          })
        : [],
      sectionId
        ? prisma.timetableSlot.findMany({
            where: { sectionId, dayOfWeek: todayRange().dayOfWeek },
            include: { subject: true },
            orderBy: { period: "asc" },
          })
        : [],
      sectionId
        ? prisma.exam.findMany({
            where: { sectionId, examDate: { gte: now } },
            include: { subject: true },
            orderBy: { examDate: "asc" },
            take: 5,
          })
        : [],
      sid
        ? prisma.mark.findMany({
            where: { studentId: sid, published: true },
            include: { exam: { include: { subject: true } } },
            orderBy: { exam: { createdAt: "desc" } },
            take: 5,
          })
        : [],
      prisma.announcement.findMany({
        where: { OR: [{ scope: "INSTITUTION" }, { sectionId: sectionId ?? "__none__" }] },
        include: { author: { select: { firstName: true, lastName: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
    ]);

    const att = student?.attendances ?? [];
    const present = att.filter((a) => a.status === "PRESENT").length;
    const absent = att.filter((a) => a.status === "ABSENT").length;
    const late = att.filter((a) => a.status === "LATE").length;
    const total = att.length;

    return {
      student: student
        ? {
            id: student.id,
            firstName: student.firstName,
            lastName: student.lastName,
            rollNumber: student.rollNumber,
            section: student.section
              ? { name: student.section.name, class: { name: student.section.class.name } }
              : null,
          }
        : null,
      attendance: {
        pct: total ? Math.round((present / total) * 100) : 0,
        present,
        absent,
        late,
        total,
      },
      attendancePct: total ? Math.round((present / total) * 100) : 0,
      upcomingAssignments: upcoming,
      todayTimetable: todaySlots,
      upcomingExams: exams,
      recentMarks: marks.map((m) => ({
        id: m.id,
        marksObtained: m.marksObtained,
        exam: { name: m.exam.name, maxMarks: m.exam.maxMarks, subject: { name: m.exam.subject.name } },
      })),
      recentAnnouncements: announcements.map((a) => ({
        id: a.id,
        title: a.title,
        body: a.body,
        createdAt: a.createdAt,
        scope: a.scope,
        author: a.author,
      })),
    };
  }

  // PARENT
  const children = await prisma.student.findMany({
    where: { parentId: caller.id },
    include: { section: { include: { class: true } }, attendances: true },
  });
  // One grouped query for every child instead of one query per child.
  const averages = children.length
    ? await prisma.mark.groupBy({
        by: ["studentId"],
        where: {
          studentId: { in: children.map((c) => c.id) },
          marksObtained: { not: null },
          published: true,
        },
        _avg: { marksObtained: true },
      })
    : [];
  const avgByStudent = new Map(averages.map((a) => [a.studentId, a._avg.marksObtained]));

  const summary = children.map((c) => {
    const present = c.attendances.filter((a) => a.status === "PRESENT").length;
    const avg = avgByStudent.get(c.id);
    return {
      id: c.id,
      name: `${c.firstName} ${c.lastName}`,
      rollNumber: c.rollNumber,
      section: c.section ? `${c.section.class.name} - ${c.section.name}` : "—",
      attendancePct: c.attendances.length ? Math.round((present / c.attendances.length) * 100) : 0,
      avgMarks: avg == null ? null : Math.round(avg),
    };
  });
  return { children: summary };
}

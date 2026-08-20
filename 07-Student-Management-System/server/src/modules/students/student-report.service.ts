import PDFDocument from "pdfkit";
import type { Role } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { getStudent, getStudentMarks } from "./students.service.js";

type Caller = { id: string; role: Role };

export type StudentReport = {
  student: {
    firstName: string;
    lastName: string;
    email: string;
    rollNumber: string;
    section: { name: string; class: { name: string } } | null;
    parent: { firstName: string | null; lastName: string | null; email: string } | null;
  };
  attendance: { present: number; absent: number; late: number; total: number; pct: number };
  marks: { examName: string; subject: string; examDate: string | null; marksObtained: number | null; maxMarks: number; percentage: number | null }[];
  assignments: { title: string; subject: string; dueDate: string; status: string; marksObtained: number | null; feedback: string | null }[];
  generatedAt: string;
};

// Builds the report payload. Reuses getStudent/getStudentMarks so the exact same
// RBAC that protects the student API also protects the report: admin sees any,
// teacher sees assigned sections, student sees self, parent sees own child, and
// everyone else is rejected. Student/parent marks are already published-only.
export async function buildStudentReportData(caller: Caller, id: string): Promise<StudentReport> {
  const student = await getStudent(caller, id);
  const [attendanceRows, marks, submissions] = await Promise.all([
    prisma.attendance.findMany({ where: { studentId: id }, orderBy: { date: "asc" } }),
    getStudentMarks(caller, id),
    prisma.submission.findMany({
      where: { studentId: id },
      include: { assignment: { include: { subject: true } } },
      orderBy: { submittedAt: "desc" },
    }),
  ]);

  const present = attendanceRows.filter((a) => a.status === "PRESENT").length;
  const absent = attendanceRows.filter((a) => a.status === "ABSENT").length;
  const late = attendanceRows.filter((a) => a.status === "LATE").length;
  const total = attendanceRows.length;

  return {
    student: {
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.user.email,
      rollNumber: student.rollNumber,
      section: student.section ? { name: student.section.name, class: { name: student.section.class.name } } : null,
      parent: student.parent
        ? { firstName: student.parent.firstName, lastName: student.parent.lastName, email: student.parent.email }
        : null,
    },
    attendance: { present, absent, late, total, pct: total ? Math.round((present / total) * 100) : 0 },
    marks: marks.map((m) => ({
      examName: m.exam.name,
      subject: m.exam.subject.name,
      examDate: m.exam.examDate ? m.exam.examDate.toISOString() : null,
      marksObtained: m.marksObtained,
      maxMarks: m.exam.maxMarks,
      percentage: m.marksObtained != null ? Math.round((m.marksObtained / m.exam.maxMarks) * 100) : null,
    })),
    assignments: submissions.map((s) => ({
      title: s.assignment.title,
      subject: s.assignment.subject.name,
      dueDate: s.assignment.dueDate.toISOString(),
      status: s.submittedAt ? (s.marksObtained != null ? "Graded" : "Submitted") : "Not submitted",
      marksObtained: s.marksObtained,
      feedback: s.feedback,
    })),
    generatedAt: new Date().toISOString(),
  };
}

// Renders the report to a PDF buffer. Kept separate from buildStudentReportData
// so the data (and its authorization) can be unit-tested without parsing a PDF.
export function renderStudentReportPdf(report: StudentReport): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: "A4" });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => chunks.push(c));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.fontSize(20).text("Student Management System", { align: "center" });
    doc.fontSize(12).fillColor("#475569").text("Student Report", { align: "center" });
    doc.moveDown();

    doc.fillColor("#000000").fontSize(15).text(`${report.student.firstName} ${report.student.lastName}`);
    doc.fontSize(10).font("Helvetica");
    doc.text(`Roll Number: ${report.student.rollNumber}`);
    doc.text(`Email: ${report.student.email}`);
    doc.text(`Class / Section: ${report.student.section ? `${report.student.section.class.name} - ${report.student.section.name}` : "—"}`);
    doc.text(`Parent: ${report.student.parent ? `${report.student.parent.firstName ?? ""} ${report.student.parent.lastName ?? ""} (${report.student.parent.email})` : "—"}`);
    doc.moveDown();

    section(doc, "Attendance Summary");
    if (report.attendance.total === 0) {
      doc.fontSize(10).text("No attendance recorded.");
    } else {
      doc.fontSize(10)
        .text(`Overall Attendance: ${report.attendance.pct}%`)
        .text(`Present: ${report.attendance.present}    Absent: ${report.attendance.absent}    Late: ${report.attendance.late}    Total: ${report.attendance.total}`);
    }
    doc.moveDown();

    section(doc, "Academic Performance");
    if (report.marks.length === 0) {
      doc.fontSize(10).text("No marks recorded.");
    } else {
      drawTable(
        doc,
        ["Exam", "Subject", "Date", "Marks", "%"],
        report.marks.map((m) => [
          m.examName,
          m.subject,
          m.examDate ? m.examDate.slice(0, 10) : "—",
          `${m.marksObtained ?? "—"} / ${m.maxMarks}`,
          m.percentage != null ? `${m.percentage}%` : "—",
        ]),
      );
    }
    doc.moveDown();

    section(doc, "Assignments");
    if (report.assignments.length === 0) {
      doc.fontSize(10).text("No assignments submitted.");
    } else {
      drawTable(
        doc,
        ["Assignment", "Subject", "Due", "Status", "Marks", "Feedback"],
        report.assignments.map((a) => [
          a.title,
          a.subject,
          a.dueDate.slice(0, 10),
          a.status,
          a.marksObtained != null ? String(a.marksObtained) : "—",
          a.feedback ?? "—",
        ]),
      );
    }

    doc.moveDown(2);
    doc.fontSize(9).fillColor("#94a3b8").text(`Generated on ${new Date(report.generatedAt).toLocaleString()}`, { align: "center" });

    doc.end();
  });
}

function section(doc: PDFKit.PDFDocument, title: string) {
  doc.fontSize(14).font("Helvetica-Bold").fillColor("#0f172a").text(title);
  doc.font("Helvetica").fillColor("#000000");
}

function drawTable(doc: PDFKit.PDFDocument, headers: string[], rows: string[][]) {
  const startX = doc.x;
  const pageWidth = doc.page.width - doc.page.margins.left - doc.page.margins.right;
  const colWidth = pageWidth / headers.length;
  const rowHeight = 18;

  const drawRow = (cells: string[], isHeader: boolean) => {
    const y = doc.y;
    doc.fontSize(9).font(isHeader ? "Helvetica-Bold" : "Helvetica");
    cells.forEach((cell, i) => {
      doc.text(cell, startX + i * colWidth, y, { width: colWidth - 4, height: rowHeight, ellipsis: true });
    });
    if (isHeader) {
      doc.moveTo(startX, y + rowHeight).lineTo(startX + pageWidth, y + rowHeight).stroke();
    }
    doc.y = y + rowHeight + 2;
  };

  drawRow(headers, true);
  rows.forEach((r) => drawRow(r, false));
}

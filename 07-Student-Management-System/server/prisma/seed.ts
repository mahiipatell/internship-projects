import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();
const PW = "password123";

async function main() {
  // Clear in dependency order so re-runs are safe and deterministic.
  await prisma.refreshToken.deleteMany();
  await prisma.mark.deleteMany();
  await prisma.submission.deleteMany();
  await prisma.assignment.deleteMany();
  await prisma.exam.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.timetableSlot.deleteMany();
  await prisma.teacherAssignment.deleteMany();
  await prisma.student.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.classSubject.deleteMany();
  await prisma.section.deleteMany();
  await prisma.class.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(PW, 10);

  const admin = await prisma.user.create({
    data: { email: "admin@sms.test", passwordHash, role: "ADMIN", firstName: "Site", lastName: "Admin" },
  });
  const parent = await prisma.user.create({
    data: { email: "parent@sms.test", passwordHash, role: "PARENT", firstName: "Piyush", lastName: "Patil" },
  });
  const parentMahi = await prisma.user.create({
    data: { email: "parent.mahi@sms.test", passwordHash, role: "PARENT", firstName: "Meera", lastName: "Mayani" },
  });
  const parentYug = await prisma.user.create({
    data: { email: "parent.yug@sms.test", passwordHash, role: "PARENT", firstName: "Yash", lastName: "Kashyap" },
  });
  const parentShruti = await prisma.user.create({
    data: { email: "parent.shruti@sms.test", passwordHash, role: "PARENT", firstName: "Sunita", lastName: "Kumari" },
  });

  const math = await prisma.subject.create({ data: { name: "Mathematics", code: "MATH" } });
  const eng = await prisma.subject.create({ data: { name: "English", code: "ENG" } });
  const sci = await prisma.subject.create({ data: { name: "Science", code: "SCI" } });

  const grade10 = await prisma.class.create({ data: { name: "Grade 10" } });
  const secA = await prisma.section.create({ data: { classId: grade10.id, name: "A" } });
  const secB = await prisma.section.create({ data: { classId: grade10.id, name: "B" } });

  for (const s of [math, eng, sci]) {
    await prisma.classSubject.create({ data: { classId: grade10.id, subjectId: s.id } });
  }

  const tMath = await prisma.user.create({
    data: { email: "teacher.math@sms.test", passwordHash, role: "TEACHER", firstName: "Roshni", lastName: "Math" },
  });
  const tEng = await prisma.user.create({
    data: { email: "teacher.eng@sms.test", passwordHash, role: "TEACHER", firstName: "Rohan", lastName: "Eng" },
  });
  const teacherMath = await prisma.teacher.create({ data: { userId: tMath.id, firstName: "Roshni", lastName: "Math" } });
  const teacherEng = await prisma.teacher.create({ data: { userId: tEng.id, firstName: "Rohan", lastName: "Eng" } });

  await prisma.teacherAssignment.createMany({
    data: [
      { teacherId: teacherMath.id, subjectId: math.id, sectionId: secA.id },
      { teacherId: teacherMath.id, subjectId: math.id, sectionId: secB.id },
      { teacherId: teacherMath.id, subjectId: sci.id, sectionId: secA.id },
      { teacherId: teacherEng.id, subjectId: eng.id, sectionId: secA.id },
      { teacherId: teacherEng.id, subjectId: eng.id, sectionId: secB.id },
    ],
  });

  const createStudent = (first: string, last: string, sectionId: string, parentId: string | null, rollNumber: string) =>
    prisma.user
      .create({
        data: {
          email: `${first.toLowerCase()}.${last.toLowerCase()}@sms.test`,
          passwordHash,
          role: "STUDENT",
          firstName: first,
          lastName: last,
        },
      })
      .then((u) =>
        prisma.student.create({
          data: { userId: u.id, firstName: first, lastName: last, sectionId, parentId, rollNumber, active: true },
        }),
      );

  const sa = [
    await createStudent("Arav", "Patel", secA.id, parent.id, "10A-01"),
    await createStudent("Mahi", "Mayani", secA.id, parentMahi.id, "10A-02"),
  ];
  const sb = [
    await createStudent("Yug", "Kashyap", secB.id, parentYug.id, "10B-01"),
    await createStudent("Shruti", "Kumari", secB.id, parentShruti.id, "10B-02"),
  ];

  const attDate = new Date("2026-08-01T00:00:00Z");
  for (const st of [...sa, ...sb]) {
    await prisma.attendance.create({
      data: {
        studentId: st.id,
        sectionId: st.sectionId!,
        date: attDate,
        status: st.id === sa[1].id ? "ABSENT" : "PRESENT",
      },
    });
  }

  const exam = await prisma.exam.create({
    data: {
      subjectId: math.id,
      sectionId: secA.id,
      name: "Midterm",
      maxMarks: 100,
      examDate: new Date("2026-07-15T00:00:00Z"),
    },
  });
  for (const st of sa) {
    await prisma.mark.create({
      data: { examId: exam.id, studentId: st.id, marksObtained: 70 + sa.indexOf(st) * 5, published: true },
    });
  }

  const assignment = await prisma.assignment.create({
    data: {
      subjectId: eng.id,
      sectionId: secA.id,
      teacherId: teacherEng.id,
      title: "Essay: My Summer",
      description: "Write 300 words about your summer.",
      dueDate: new Date("2026-08-20T00:00:00Z"),
      maxMarks: 50,
    },
  });
  await prisma.submission.create({
    data: {
      assignmentId: assignment.id,
      studentId: sa[0].id,
      textContent: "My summer was great.",
      submittedAt: new Date("2026-08-05T00:00:00Z"),
      marksObtained: 45,
      feedback: "Nice work.",
    },
  });

  await prisma.timetableSlot.createMany({
    data: [
      { sectionId: secA.id, subjectId: math.id, teacherId: teacherMath.id, dayOfWeek: 1, period: 1 },
      { sectionId: secA.id, subjectId: eng.id, teacherId: teacherEng.id, dayOfWeek: 1, period: 2 },
      { sectionId: secB.id, subjectId: math.id, teacherId: teacherMath.id, dayOfWeek: 2, period: 1 },
      { sectionId: secB.id, subjectId: eng.id, teacherId: teacherEng.id, dayOfWeek: 2, period: 2 },
    ],
  });

  await prisma.announcement.createMany({
    data: [
      { authorId: admin.id, scope: "INSTITUTION", title: "Welcome!", body: "New term starts August 10." },
      {
        authorId: tMath.id,
        scope: "SECTION",
        sectionId: secA.id,
        title: "Math books",
        body: "Bring your math books on Monday.",
      },
    ],
  });

  console.log("Seed complete. Demo password for all accounts:", PW);
  console.log({ admin: admin.email, parent: parent.email, teacherMath: tMath.email, teacherEng: tEng.email });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

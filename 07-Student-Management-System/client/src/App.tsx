import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./lib/auth";
import { Spinner } from "./components/ui";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Students from "./pages/Students";
import StudentDetail from "./pages/StudentDetail";
import Academic from "./pages/Academic";
import Teachers from "./pages/Teachers";
import TeacherDetail from "./pages/TeacherDetail";
import Parents from "./pages/Parents";
import ParentDetail from "./pages/ParentDetail";
import Attendance from "./pages/Attendance";
import MyAttendance from "./pages/MyAttendance";
import Exams from "./pages/Exams";
import Assignments from "./pages/Assignments";
import Timetable from "./pages/Timetable";
import Announcements from "./pages/Announcements";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";

function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return <Spinner full />;
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// Mirrors the server's requireRole guard so a role that cannot use a page
// never renders it (the API remains the real boundary).
function RequireRole({ roles }: { roles: string[] }) {
  const { user } = useAuth();
  if (user && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route
        path="/login"
        element={user ? <Navigate to="/dashboard" replace /> : <Login />}
      />
      <Route element={<RequireAuth />}>
        <Route element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route element={<RequireRole roles={["ADMIN", "TEACHER"]} />}>
            <Route path="students" element={<Students />} />
            <Route path="attendance" element={<Attendance />} />
          </Route>
          <Route element={<RequireRole roles={["ADMIN"]} />}>
            <Route path="teachers" element={<Teachers />} />
            <Route path="teachers/:id" element={<TeacherDetail />} />
            <Route path="parents" element={<Parents />} />
            <Route path="parents/:id" element={<ParentDetail />} />
            <Route path="academic" element={<Academic />} />
          </Route>
          <Route path="students/:id" element={<StudentDetail />} />
          <Route path="exams" element={<Exams />} />
          <Route path="assignments" element={<Assignments />} />
          <Route path="timetable" element={<Timetable />} />
          <Route path="my-attendance" element={<MyAttendance />} />
          <Route path="announcements" element={<Announcements />} />
          <Route path="profile" element={<Profile />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

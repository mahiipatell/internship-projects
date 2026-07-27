import Sidebar from './Sidebar';

export default function AppLayout({ children }) {
  return (
    <div style={{display:'flex',minHeight:'100vh'}}>
      <Sidebar />
      <main style={{marginLeft:'var(--sidebar-w)',flex:1,minHeight:'100vh',overflow:'auto'}}>
        {children}
      </main>
    </div>
  );
}

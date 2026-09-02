import Link from "next/link";
import { BrandMark } from "@/components/AppShell";
import { SERVICE } from "@/lib/data";

export default function Home() {
  return (
    <main className="landing">
      <BrandMark size={52} />
      <h1>Compass</h1>
      <p className="lede">
        An intelligent colleague for frontline homelessness services. One piece of information, recorded once,
        intelligently presented to each role.
      </p>

      <p className="landing-notice">
        <span className="demo-tag">Demo</span>
        Everything you see is invented. {SERVICE.name} is not a real service, and no resident, staff member or event on
        this site is a real person or a real event.
      </p>

      <div className="role-cards">
        <Link href="/worker" className="role-card">
          <h2>Project Worker view</h2>
          <p>
            What do I need to know, and what do I need to do for my clients today? Handover, caseload, actions and the
            smart case note.
          </p>
          <span className="who">Sign in as Aoife Brennan, Project Worker</span>
        </Link>
        <Link href="/manager" className="role-card">
          <h2>Manager view</h2>
          <p>
            What is happening in my service, what needs my attention, and where do I need to intervene? Oversight, risk
            and operations.
          </p>
          <span className="who">Sign in as Niamh Kavanagh, Deputy Manager</span>
        </Link>
      </div>

      <p className="landing-foot">
        Concept prototype built by SquareTwo for Project Compass. Not a live system. It holds no real records and is
        connected to no service.
      </p>
    </main>
  );
}

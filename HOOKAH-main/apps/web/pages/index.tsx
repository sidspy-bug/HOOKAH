import Head from "next/head";

const quickActions = [
  "Search Papers",
  "Literature Review",
  "Draft",
  "Diagrams",
  "Presentation",
];

export default function HomePage() {
  return (
    <>
      <Head>
        <title>GapForge | Research Assistant UI</title>
        <meta
          name="description"
          content="Clean research assistant interface for discovering research gaps."
        />
      </Head>

      <div className="shell">
        <aside className="leftRail" aria-label="Sidebar">
          <button className="railBtn">☰</button>
          <button className="railBtn">＋</button>
          <button className="railBtn">⌂</button>
          <button className="railBtn">⚙</button>
          <button className="railBtn">✎</button>
        </aside>

        <main className="appMain">
          <header className="topNav">
            <div className="brand">GapForge</div>
            <nav className="topLinks">
              <a href="#">Solutions</a>
              <a href="#">Pricing</a>
              <a href="#">Login</a>
              <button className="cta">Sign up for free</button>
            </nav>
          </header>

          <section className="centerStage">
            <p className="logoMark">◆</p>
            <h1>How can I help with your research?</h1>
            <p className="subtext">
              Handle everyday research tasks with reliable, citation-backed results.
            </p>

            <article className="promptCard">
              <textarea defaultValue="find research gap" aria-label="Prompt input" />

              <div className="promptFooter">
                <div className="leftControls">
                  <button className="iconBtn">＋</button>
                  <button className="softBtn">Auto ▾</button>
                  <button className="softBtn">Apps</button>
                </div>
                <button className="sendBtn" aria-label="Send">
                  ↑
                </button>
              </div>
            </article>

            <div className="actionRow">
              {quickActions.map((action) => (
                <button key={action} className="chip">
                  {action}
                </button>
              ))}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}

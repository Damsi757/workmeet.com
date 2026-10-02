const OWNER_EMAIL = "damilolakehinde575@gmail.com";
const OWNER_ALIASES = ["damilolakehinde575@gmail.com", "damilolakehonde575@gmail.com"];

const seedAds = () => [
  {
    id: "ad_megep",
    title: "MEGEP PRINTS Lagos",
    line: "Printing, customization and trading.",
    href: "https://damsi757.github.io/",
    tag: "Partner"
  },
  {
    id: "ad_antenna",
    title: "God's Antenna",
    line: "Tuned to Heaven. Broadcasting hope, Open Heavens and gospel songs.",
    href: "https://godsantenna.github.io/godsantenna.io/",
    tag: "Faith"
  },
  {
    id: "ad_workmeet",
    title: "WorkMeet for teams",
    line: "Hire faster. Post a slot and review applications in one place.",
    href: "#",
    tag: "WorkMeet"
  }
];

const seed = () => ({
  updatedAt: Date.now(),
  ads: seedAds(),
  users: [
    {
      id: "u_owner",
      name: "Damilola Kehinde",
      email: OWNER_EMAIL,
      password: "Damsi@123",
      role: "owner",
      company: "WorkMeet",
      headline: "Connecting employers and employees",
      location: "Nigeria",
      about: "I built WorkMeet so people can post roles, apply, and chat in one place.",
      skills: "Product, Hiring, Community",
      photo: "",
      phone: "",
      dateOfBirth: "",
      website: "",
      cvFile: null,
      certificates: [],
      updatedAt: Date.now(),
      experience: [
        { id: "e1", title: "Founder", company: "WorkMeet", start: "2026", end: "Present", description: "Building a simple job portal." }
      ],
      education: [
        { id: "ed1", school: "School", field: "Studies", start: "", end: "", description: "" }
      ]
    },
    {
      id: "u_emp",
      name: "Amina Bello",
      email: "amina@brightpath.test",
      password: "demo123",
      role: "employer",
      company: "BrightPath Foods",
      headline: "Hiring shop and delivery staff",
      location: "Lagos",
      about: "We run neighbourhood food shops.",
      skills: "Retail, Hiring",
      photo: "",
      cvFile: null,
      experience: [],
      education: []
    },
    {
      id: "u_seek",
      name: "Chidi Okafor",
      email: "chidi@mail.test",
      password: "demo123",
      role: "employee",
      company: "",
      headline: "Shop helper and weekend worker",
      location: "Lagos",
      about: "Reliable weekend worker looking for shop or delivery roles.",
      skills: "Customer service, Cash handling, Teamwork",
      photo: "",
      cvFile: null,
      experience: [
        { id: "e2", title: "Shop helper", company: "Family shop", start: "2024", end: "Present", description: "Helped customers and kept shelves tidy." }
      ],
      education: []
    }
  ],
  jobs: [
    {
      id: "j1",
      title: "Shop Assistant",
      company: "BrightPath Foods",
      location: "Lagos",
      type: "Part-time",
      description: "Help customers, keep shelves tidy, and support the till team on weekends.",
      employerId: "u_emp",
      status: "open",
      createdAt: Date.now() - 86400000
    },
    {
      id: "j2",
      title: "Junior Graphic Designer",
      company: "BrightPath Foods",
      location: "Abuja",
      type: "Full-time",
      description: "Create simple social posts and posters. Training will be given.",
      employerId: "u_emp",
      status: "open",
      createdAt: Date.now() - 3600000
    }
  ],
  applications: [],
  messages: []
});

function normalizeUser(u) {
  return {
    company: "",
    headline: "",
    location: "",
    about: "",
    skills: "",
    photo: "",
    phone: "",
    dateOfBirth: "",
    website: "",
    cvFile: null,
    experience: [],
    education: [],
    certificates: [],
    ...u,
    experience: Array.isArray(u.experience) ? u.experience : [],
    education: Array.isArray(u.education) ? u.education : [],
    certificates: Array.isArray(u.certificates) ? u.certificates : []
  };
}

function ensureOwner(data) {
  const owner = seed().users[0];
  const found = data.users.find((u) => OWNER_ALIASES.includes(String(u.email || "").toLowerCase()) || u.id === "u_owner");
  if (!found) {
    data.users.unshift(owner);
  } else {
    found.email = OWNER_EMAIL;
    found.name = found.name && found.name !== "Damilola Kehonde" ? found.name : "Damilola Kehinde";
    found.password = "Damsi@123";
    found.role = "owner";
  }
  return data;
}

function load() {
  const raw = localStorage.getItem(LOCAL_KEY) || localStorage.getItem("workmeet_cloud_v4") || localStorage.getItem("workmeet_cloud_v3");
  let data;
  if (!raw) {
    data = seed();
  } else {
    data = JSON.parse(raw);
    data.users = (data.users || []).map(normalizeUser);
    data.jobs = data.jobs || [];
    data.applications = data.applications || [];
    data.messages = data.messages || [];
    data.ads = data.ads && data.ads.length ? data.ads : seedAds();
    data.updatedAt = data.updatedAt || Date.now();
  }
  return ensureOwner(data);
}

function save(data) {
  data.updatedAt = Date.now();
  localStorage.setItem(LOCAL_KEY, JSON.stringify(data));
  if (typeof scheduleCloudPush === "function") scheduleCloudPush();
}

let db = load();
let session = JSON.parse(localStorage.getItem(SESSION_KEY) || localStorage.getItem("workmeet_session_v3") || "null");
let registerRole = "employee";
let jobQuery = { text: "", location: "", type: "" };
let activeChatPartner = null;
let viewingProfileId = null;

const $ = (id) => document.getElementById(id);

function showView(name) {
  document.querySelectorAll(".view").forEach((el) => el.classList.add("hidden"));
  $(name).classList.remove("hidden");
}

function setSession(user) {
  session = user ? { id: user.id } : null;
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  renderChrome();
}

function currentUser() {
  if (!session) return null;
  return db.users.find((u) => u.id === session.id) || null;
}

function uid(prefix) {
  return prefix + "_" + Math.random().toString(36).slice(2, 9);
}

function formatDate(ts) {
  return new Date(ts).toLocaleString();
}

function escapeHtml(str) {
  return String(str || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function publicRole(user) {
  if (user.role === "owner") return user.company ? "Employer" : "Member";
  return user.role.charAt(0).toUpperCase() + user.role.slice(1);
}

function canHire(user) {
  return user.role === "employer" || user.role === "owner";
}

function canApply(user) {
  return user.role === "employee" || user.role === "owner";
}

function statusBadge(status) {
  const map = {
    submitted: "badge",
    accepted: "badge badge-green",
    declined: "badge badge-red"
  };
  return `<span class="${map[status] || "badge badge-gray"}">${escapeHtml(status)}</span>`;
}

function renderChrome() {
  const user = currentUser();
  if (user) {
    $("guestActions").classList.add("hidden");
    $("userActions").classList.remove("hidden");
    $("whoName").textContent = user.name;
    $("whoRole").textContent = publicRole(user);
  } else {
    $("guestActions").classList.remove("hidden");
    $("userActions").classList.add("hidden");
  }
  if (typeof setCloudStatus === "function") setCloudStatus(navigator.onLine ? cloudStatus : "offline");
}

function goLanding() {
  showView("view-landing");
}

function goLogin() {
  $("loginError").textContent = "";
  showView("view-login");
}

function goRegister() {
  $("regError").textContent = "";
  setRegRole("employee");
  showView("view-register");
}

function setRegRole(role) {
  registerRole = role;
  $("pillEmployee").classList.toggle("active", role === "employee");
  $("pillEmployer").classList.toggle("active", role === "employer");
}

function login(email, password) {
  const target = email.toLowerCase();
  const user = db.users.find((u) => {
    const mail = String(u.email || "").toLowerCase();
    const ownerHit = OWNER_ALIASES.includes(target) && (OWNER_ALIASES.includes(mail) || u.id === "u_owner");
    return (mail === target || ownerHit) && u.password === password;
  });
  if (!user) {
    const exists = db.users.some((u) => u.email.toLowerCase() === email.toLowerCase());
    $("loginError").textContent = exists
      ? "That password is not correct."
      : "No account uses that email. Click Create account first.";
    return;
  }
  setSession(user);
  openDashboard();
}

function register() {
  const name = $("regName").value.trim();
  const email = $("regEmail").value.trim();
  const password = $("regPassword").value;
  const password2 = $("regPassword2").value;
  const company = $("regCompany").value.trim();

  if (!name || !email || !password) {
    $("regError").textContent = "Please fill in name, email and password.";
    return;
  }
  if (!email.includes("@") || !email.includes(".")) {
    $("regError").textContent = "Please enter a real-looking email address.";
    return;
  }
  if (password.length < 6) {
    $("regError").textContent = "Password must be at least 6 characters.";
    return;
  }
  if (password !== password2) {
    $("regError").textContent = "The two passwords do not match.";
    return;
  }
  if (db.users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
    $("regError").textContent = "That email already has an account. Please sign in instead.";
    return;
  }
  if (registerRole === "employer" && !company) {
    $("regError").textContent = "Employers need a company or business name.";
    return;
  }

  const user = normalizeUser({
    id: uid("u"),
    name,
    email,
    password,
    role: registerRole,
    company: registerRole === "employer" ? company : ""
  });
  db.users.push(user);
  save(db);
  setSession(user);
  openDashboard();
}

function logout() {
  setSession(null);
  activeChatPartner = null;
  viewingProfileId = null;
  goLanding();
}

function openDashboard() {
  const user = currentUser();
  if (!user) return goLogin();
  showView("view-app");
  renderApp("home");
}

function navHtml(items, active) {
  return items
    .map(
      ([key, label]) =>
        `<button class="nav-btn ${active === key ? "active" : ""}" data-nav="${key}">${label}</button>`
    )
    .join("");
}

function renderApp(tab) {
  const user = currentUser();
  const items = [["home", "Home"], ["jobs", "Jobs"]];
  if (canHire(user)) items.push(["post", "Post a role"], ["apps", "Applications"]);
  if (canApply(user)) items.push(["mine", "My applications"]);
  items.push(["network", "People"], ["messages", "Messaging"], ["profile", "My profile"], ["cloud", "Cloud"]);

  $("sideNav").innerHTML = navHtml(items, tab);
  $("sideNav").onclick = (e) => {
    const key = e.target.dataset.nav;
    if (key) renderApp(key);
  };

  if (tab === "home") return renderHome();
  if (tab === "jobs") return renderJobs();
  if (tab === "post") return renderPost();
  if (tab === "apps") return renderApps();
  if (tab === "mine") return renderMine();
  if (tab === "network") return renderNetwork();
  if (tab === "messages") return renderChat();
  if (tab === "profile") return renderProfile(user.id, true);
  if (tab === "cloud") return renderCloud();
}

function unique(list) {
  return [...new Set(list)];
}

function filteredJobs() {
  const t = jobQuery.text.toLowerCase();
  return db.jobs.filter((j) => {
    if (j.status !== "open") return false;
    const hay = `${j.title} ${j.company} ${j.description} ${j.location}`.toLowerCase();
    if (t && !hay.includes(t)) return false;
    if (jobQuery.location && j.location !== jobQuery.location) return false;
    if (jobQuery.type && j.type !== jobQuery.type) return false;
    return true;
  });
}

function adCard(ad) {
  return `
    <article class="ad-card">
      <span class="ad-tag">${escapeHtml(ad.tag || "Ad")}</span>
      <h3>${escapeHtml(ad.title)}</h3>
      <p class="muted">${escapeHtml(ad.line || "")}</p>
      <a class="btn btn-ghost btn-sm" href="${escapeHtml(ad.href || "#")}" target="_blank" rel="noopener">Visit</a>
    </article>
  `;
}

function renderHome() {
  const user = currentUser();
  const jobs = db.jobs.filter((j) => j.status === "open").slice(0, 4);
  const people = db.users.filter((u) => u.id !== user.id).slice(0, 6);
  const ads = (db.ads && db.ads.length ? db.ads : seedAds());
  $("mainArea").innerHTML = `
    <div class="toolbar">
      <div>
        <h2>Home</h2>
        <p class="muted">Jobs, people on WorkMeet, and partner ads. Data syncs to the live cloud when you are online.</p>
      </div>
      <span class="badge ${navigator.onLine ? "badge-green" : "badge-gray"}">${navigator.onLine ? "Online" : "Offline"}</span>
    </div>
    <div class="stats">
      <div class="card stat"><b>${db.jobs.filter((j) => j.status === "open").length}</b><span class="muted">Open jobs</span></div>
      <div class="card stat"><b>${db.users.length}</b><span class="muted">People using WorkMeet</span></div>
      <div class="card stat"><b>${db.applications.length}</b><span class="muted">Applications</span></div>
    </div>
    <h3 style="margin:8px 0 10px;">Jobs</h3>
    ${jobs.length ? jobs.map((job) => jobCard(job, user)).join("") : `<div class="card">No jobs yet. Employers can post a slot.</div>`}
    <div class="row-actions" style="margin:10px 0 22px;"><button class="btn btn-ghost btn-sm" id="moreJobs">See all jobs</button></div>
    <h3 style="margin:8px 0 10px;">People using the app</h3>
    <div class="people-grid">
      ${people.map((p) => `
        <div class="card person-tile">
          ${avatarHtml(p)}
          <div>
            <strong>${escapeHtml(p.name)}</strong>
            <div class="muted">${escapeHtml(p.headline || publicRole(p))}</div>
            <div class="row-actions">
              <button class="btn btn-ghost btn-sm" data-view="${p.id}">Profile</button>
              <button class="btn btn-ghost btn-sm" data-msg="${p.id}">Chat</button>
            </div>
          </div>
        </div>`).join("")}
    </div>
    <h3 style="margin:22px 0 10px;">Advertisements</h3>
    <div class="ad-grid">${ads.map(adCard).join("")}</div>
  `;
  const more = $("moreJobs");
  if (more) more.onclick = () => renderApp("jobs");
  $("mainArea").querySelectorAll("[data-apply]").forEach((btn) => {
    btn.onclick = () => applyToJob(btn.dataset.apply);
  });
  $("mainArea").querySelectorAll("[data-view]").forEach((btn) => {
    btn.onclick = () => renderProfile(btn.dataset.view, false);
  });
  $("mainArea").querySelectorAll("[data-msg]").forEach((btn) => {
    btn.onclick = () => {
      activeChatPartner = btn.dataset.msg;
      renderApp("messages");
    };
  });
}

function renderJobs() {
  const user = currentUser();
  const locations = unique(db.jobs.map((j) => j.location));
  const types = unique(db.jobs.map((j) => j.type));
  const jobs = filteredJobs();
  $("mainArea").innerHTML = `
    <div class="toolbar">
      <div>
        <h2>Jobs</h2>
        <p class="muted">Search roles and click Apply.</p>
      </div>
    </div>
    <div class="filters card">
      <input id="qText" placeholder="Search title or keyword" value="${escapeHtml(jobQuery.text)}">
      <select id="qLoc">
        <option value="">All locations</option>
        ${locations.map((l) => `<option ${jobQuery.location === l ? "selected" : ""}>${escapeHtml(l)}</option>`).join("")}
      </select>
      <select id="qType">
        <option value="">All types</option>
        ${types.map((t) => `<option ${jobQuery.type === t ? "selected" : ""}>${escapeHtml(t)}</option>`).join("")}
      </select>
      <button class="btn btn-ghost btn-sm" id="qGo">Filter</button>
    </div>
    ${jobs.length ? jobs.map((job) => jobCard(job, user)).join("") : `<div class="card">No jobs match those filters.</div>`}
  `;
  $("qGo").onclick = () => {
    jobQuery = { text: $("qText").value, location: $("qLoc").value, type: $("qType").value };
    renderApp("jobs");
  };
  $("mainArea").querySelectorAll("[data-apply]").forEach((btn) => {
    btn.onclick = () => applyToJob(btn.dataset.apply);
  });
}

function jobCard(job, user) {
  const already = db.applications.some((a) => a.jobId === job.id && a.employeeId === user.id);
  const showApply = canApply(user);
  return `
    <div class="card job">
      <div>
        <h3>${escapeHtml(job.title)}</h3>
        <div class="meta">${escapeHtml(job.company)} · ${escapeHtml(job.location)} · ${escapeHtml(job.type)}</div>
        <p class="job-desc">${escapeHtml(job.description)}</p>
      </div>
      <div>
        ${
          !showApply
            ? ""
            : already
              ? `<button class="btn btn-success" disabled>Applied</button>`
              : `<button class="btn btn-primary" data-apply="${job.id}">Apply</button>`
        }
      </div>
    </div>
  `;
}

function applyToJob(jobId) {
  const user = currentUser();
  const message = prompt("Optional short note for the employer:", "I would like to apply for this role.");
  if (message === null) return;
  db.applications.push({
    id: uid("a"),
    jobId,
    employeeId: user.id,
    message: message.trim(),
    createdAt: Date.now(),
    status: "submitted"
  });
  save(db);
  renderApp("jobs");
}

function renderPost() {
  const user = currentUser();
  const myJobs = db.jobs.filter((j) => j.employerId === user.id);
  $("mainArea").innerHTML = `
    <div class="card">
      <h2>Put out a job slot</h2>
      <div class="field"><label>Job title</label><input id="jobTitle" placeholder="e.g. Cashier"></div>
      <div class="field"><label>Location</label><input id="jobLocation" placeholder="e.g. Ibadan"></div>
      <div class="field">
        <label>Job type</label>
        <select id="jobType">
          <option>Full-time</option>
          <option>Part-time</option>
          <option>Weekend</option>
          <option>Internship</option>
        </select>
      </div>
      <div class="field"><label>Description</label><textarea id="jobDesc" placeholder="What will the person do?"></textarea></div>
      <p class="error" id="jobError"></p>
      <div style="margin-top:14px;"><button class="btn btn-primary" id="saveJob">Publish slot</button></div>
    </div>
    <h3 style="margin:18px 0 10px;">My published slots</h3>
    ${
      myJobs.length
        ? myJobs
            .map((job) => {
              const count = db.applications.filter((a) => a.jobId === job.id).length;
              return `<div class="card" style="margin-bottom:10px;"><strong>${escapeHtml(job.title)}</strong><div class="meta">${escapeHtml(job.location)} · ${count} application(s)</div></div>`;
            })
            .join("")
        : `<div class="card">No slots yet.</div>`
    }
  `;
  $("saveJob").onclick = () => {
    const title = $("jobTitle").value.trim();
    const location = $("jobLocation").value.trim();
    const type = $("jobType").value;
    const description = $("jobDesc").value.trim();
    if (!title || !location || !description) {
      $("jobError").textContent = "Please fill in title, location and description.";
      return;
    }
    db.jobs.unshift({
      id: uid("j"),
      title,
      company: user.company || user.name,
      location,
      type,
      description,
      employerId: user.id,
      status: "open",
      createdAt: Date.now()
    });
    save(db);
    renderApp("post");
  };
}

function setAppStatus(appId, status) {
  const app = db.applications.find((a) => a.id === appId);
  if (!app) return;
  app.status = status;
  const job = db.jobs.find((j) => j.id === app.jobId);
  db.messages.push({
    id: uid("m"),
    fromId: currentUser().id,
    toId: app.employeeId,
    text:
      status === "accepted"
        ? `Your application for ${job ? job.title : "the role"} was accepted.`
        : `Your application for ${job ? job.title : "the role"} was declined.`,
    createdAt: Date.now()
  });
  save(db);
}

function renderApps() {
  const user = currentUser();
  const myJobs = db.jobs.filter((j) => j.employerId === user.id);
  const rows = [];
  myJobs.forEach((job) => {
    const apps = db.applications.filter((a) => a.jobId === job.id);
    if (!apps.length) {
      rows.push(`<div class="card" style="margin-bottom:12px;"><strong>${escapeHtml(job.title)}</strong><p class="muted">No applications yet.</p></div>`);
    } else {
      apps.forEach((app) => {
        const seeker = db.users.find((u) => u.id === app.employeeId);
        rows.push(`
          <div class="card" style="margin-bottom:12px;">
            <strong>${escapeHtml(seeker ? seeker.name : "Applicant")}</strong>
            applied for <strong>${escapeHtml(job.title)}</strong>
            ${statusBadge(app.status)}
            <div class="meta">${seeker ? escapeHtml(seeker.email) : ""} · ${formatDate(app.createdAt)}</div>
            <p style="margin-top:8px;">${escapeHtml(app.message || "")}</p>
            ${seeker ? profileMini(seeker) : ""}
            <div class="row-actions">
              ${
                app.status === "submitted"
                  ? `<button class="btn btn-success btn-sm" data-accept="${app.id}">Accept</button>
                     <button class="btn btn-danger btn-sm" data-decline="${app.id}">Decline</button>`
                  : ""
              }
              <button class="btn btn-ghost btn-sm" data-view="${seeker ? seeker.id : ""}">View profile</button>
              <button class="btn btn-ghost btn-sm" data-msg="${seeker ? seeker.id : ""}">Message</button>
            </div>
          </div>
        `);
      });
    }
  });
  $("mainArea").innerHTML = `
    <h2>Applications</h2>
    <p class="muted" style="margin-bottom:14px;">Accept, decline, open the profile, or chat.</p>
    ${rows.join("") || `<div class="card">No applications yet. Post a role first.</div>`}
  `;
  $("mainArea").querySelectorAll("[data-accept]").forEach((btn) => {
    btn.onclick = () => {
      setAppStatus(btn.dataset.accept, "accepted");
      renderApp("apps");
    };
  });
  $("mainArea").querySelectorAll("[data-decline]").forEach((btn) => {
    btn.onclick = () => {
      setAppStatus(btn.dataset.decline, "declined");
      renderApp("apps");
    };
  });
  $("mainArea").querySelectorAll("[data-msg]").forEach((btn) => {
    if (!btn.dataset.msg) return;
    btn.onclick = () => {
      activeChatPartner = btn.dataset.msg;
      renderApp("messages");
    };
  });
  $("mainArea").querySelectorAll("[data-view]").forEach((btn) => {
    if (!btn.dataset.view) return;
    btn.onclick = () => renderProfile(btn.dataset.view, false);
  });
}

function profileMini(person) {
  return `
    <div class="cv-box">
      <div>${escapeHtml(person.headline || "No headline yet")}</div>
      <div class="muted">${escapeHtml(person.location || "")} · ${escapeHtml(person.skills || "No skills listed")}</div>
      ${person.cvFile ? `<div class="muted">CV uploaded: ${escapeHtml(person.cvFile.name)}</div>` : `<div class="muted">No CV file yet</div>`}
    </div>
  `;
}

function renderMine() {
  const user = currentUser();
  const mine = db.applications.filter((a) => a.employeeId === user.id);
  $("mainArea").innerHTML = `
    <h2>My applications</h2>
    ${
      mine.length
        ? mine
            .map((app) => {
              const job = db.jobs.find((j) => j.id === app.jobId);
              const employer = job ? db.users.find((u) => u.id === job.employerId) : null;
              return `<div class="card" style="margin-bottom:12px;">
                <strong>${escapeHtml(job ? job.title : "Job removed")}</strong>
                ${statusBadge(app.status)}
                <div class="meta">${job ? escapeHtml(job.company) : ""} · ${formatDate(app.createdAt)}</div>
                ${employer ? `<button class="btn btn-ghost btn-sm" style="margin-top:8px;" data-msg="${employer.id}">Message</button>` : ""}
              </div>`;
            })
            .join("")
        : `<div class="card">You have not applied yet.</div>`
    }
  `;
  $("mainArea").querySelectorAll("[data-msg]").forEach((btn) => {
    btn.onclick = () => {
      activeChatPartner = btn.dataset.msg;
      renderApp("messages");
    };
  });
}

function renderNetwork() {
  const me = currentUser();
  const people = db.users.filter((u) => u.id !== me.id);
  $("mainArea").innerHTML = `
    <h2>People</h2>
    <p class="muted" style="margin-bottom:14px;">Open any profile or start a chat. You can message anyone with an account.</p>
    ${people
      .map(
        (p) => `
      <div class="card job">
        <div class="person-row">
          ${avatarHtml(p)}
          <div>
            <h3>${escapeHtml(p.name)}</h3>
            <div class="meta">${escapeHtml(p.headline || publicRole(p))} · ${escapeHtml(p.location || "Location not set")}</div>
          </div>
        </div>
        <div class="row-actions">
          <button class="btn btn-ghost btn-sm" data-view="${p.id}">View profile</button>
          <button class="btn btn-primary btn-sm" data-msg="${p.id}">Message</button>
        </div>
      </div>
    `
      )
      .join("")}
  `;
  $("mainArea").querySelectorAll("[data-view]").forEach((btn) => {
    btn.onclick = () => renderProfile(btn.dataset.view, false);
  });
  $("mainArea").querySelectorAll("[data-msg]").forEach((btn) => {
    btn.onclick = () => {
      activeChatPartner = btn.dataset.msg;
      renderApp("messages");
    };
  });
}

function avatarHtml(p) {
  if (p.photo) return `<img class="avatar" src="${p.photo}" alt="">`;
  return `<div class="avatar fallback">${escapeHtml((p.name || "?").charAt(0).toUpperCase())}</div>`;
}

function thread(a, b) {
  return db.messages
    .filter(
      (m) =>
        (m.fromId === a && m.toId === b) || (m.fromId === b && m.toId === a)
    )
    .sort((x, y) => x.createdAt - y.createdAt);
}

function renderChat() {
  const me = currentUser();
  const people = db.users.filter((u) => u.id !== me.id);
  const partner = people.find((p) => p.id === activeChatPartner) || people[0] || null;
  if (partner) activeChatPartner = partner.id;
  const msgs = partner
    ? thread(me.id, partner.id)
        .map(
          (m) =>
            `<div class="bubble ${m.fromId === me.id ? "mine" : ""}">${escapeHtml(m.text)}<small>${formatDate(m.createdAt)}</small></div>`
        )
        .join("")
    : `<p class="muted">No one to chat with yet.</p>`;

  $("mainArea").innerHTML = `
    <div class="toolbar">
      <div>
        <h2>Messaging</h2>
        <p class="muted">Chat anyone who has an account.</p>
      </div>
    </div>
    <div class="chat-layout">
      <div class="card chat-list">
        ${people
          .map((p) => {
            const last = thread(me.id, p.id).slice(-1)[0];
            return `<button class="chat-person ${p.id === activeChatPartner ? "active" : ""}" data-chat="${p.id}">
              <strong>${escapeHtml(p.name)}</strong>
              <span class="muted">${escapeHtml(p.headline || publicRole(p))}</span>
              <span class="muted clip">${last ? escapeHtml(last.text) : "Start a chat"}</span>
            </button>`;
          })
          .join("")}
      </div>
      <div class="card chat-pane">
        <h3>${partner ? escapeHtml(partner.name) : "Select a person"}</h3>
        <div class="chat-thread" id="chatThread">${msgs}</div>
        ${
          partner
            ? `<div class="chat-compose">
                <input id="chatText" placeholder="Write a message">
                <button class="btn btn-primary" id="sendChat">Send</button>
              </div>`
            : ""
        }
      </div>
    </div>
  `;
  $("mainArea").querySelectorAll("[data-chat]").forEach((btn) => {
    btn.onclick = () => {
      activeChatPartner = btn.dataset.chat;
      renderChat();
    };
  });
  const sendBtn = $("sendChat");
  if (sendBtn) {
    sendBtn.onclick = () => {
      const text = $("chatText").value.trim();
      if (!text) return;
      db.messages.push({
        id: uid("m"),
        fromId: me.id,
        toId: partner.id,
        text,
        createdAt: Date.now()
      });
      save(db);
      renderChat();
    };
    $("chatText").addEventListener("keydown", (e) => {
      if (e.key === "Enter") sendBtn.click();
    });
    const threadEl = $("chatThread");
    threadEl.scrollTop = threadEl.scrollHeight;
  }
}

function renderProfile(userId, editable) {
  const person = db.users.find((u) => u.id === userId);
  if (!person) return renderApp("network");
  viewingProfileId = userId;
  const exp = person.experience || [];
  const edu = person.education || [];

  $("mainArea").innerHTML = `
    <div class="li-card">
      <div class="li-banner"></div>
      <div class="li-head">
        ${avatarHtml(person)}
        <div class="li-intro">
          <h2>${escapeHtml(person.name)}</h2>
          <p>${escapeHtml(person.headline || "Add a headline")}</p>
          <p class="muted">${escapeHtml(person.location || "Add a location")} · ${escapeHtml(person.company || publicRole(person))}</p>
          <p class="muted">${escapeHtml(person.email)}${person.phone ? " · " + escapeHtml(person.phone) : ""}</p>
        </div>
        ${
          editable
            ? ""
            : `<button class="btn btn-primary" data-msg="${person.id}">Message</button>`
        }
      </div>
    </div>

    ${
      editable
        ? `<div class="card">
            <h3>Edit intro</h3>
            <div class="field"><label>Profile picture</label><input id="pPhoto" type="file" accept="image/*"></div>
            <div class="field"><label>Full name</label><input id="pName" value="${escapeHtml(person.name)}"></div>
            <div class="field"><label>Headline</label><input id="pHeadline" value="${escapeHtml(person.headline)}" placeholder="e.g. Operations assistant"></div>
            <div class="field"><label>Email</label><input id="pEmail" type="email" value="${escapeHtml(person.email)}"></div>
            <div class="field"><label>Phone number</label><input id="pPhone" value="${escapeHtml(person.phone)}" placeholder="e.g. 0803 000 0000"></div>
            <div class="field"><label>Date of birth</label><input id="pDob" type="date" value="${escapeHtml(person.dateOfBirth)}"></div>
            <div class="field"><label>Location</label><input id="pLoc" value="${escapeHtml(person.location)}"></div>
            <div class="field"><label>Company / school</label><input id="pCo" value="${escapeHtml(person.company)}"></div>
            <div class="field"><label>Website</label><input id="pWeb" value="${escapeHtml(person.website)}" placeholder="https://"></div>
            <div class="field"><label>About</label><textarea id="pAbout">${escapeHtml(person.about)}</textarea></div>
            <div class="field"><label>Skills</label><input id="pSkills" value="${escapeHtml(person.skills)}" placeholder="Separate with commas"></div>
            <div class="field"><label>Upload CV (PDF, Word, or image)</label><input id="pCv" type="file" accept=".pdf,.doc,.docx,image/*"></div>
            <p class="muted">${person.cvFile ? "Current file: " + escapeHtml(person.cvFile.name) : "No CV uploaded yet."}</p>
            <div style="margin-top:12px;"><button class="btn btn-primary" id="saveIntro">Save profile</button></div>
          </div>`
        : `<div class="card">
             <h3>Contact and details</h3>
             <p>Email: ${escapeHtml(person.email)}</p>
             <p>Phone: ${escapeHtml(person.phone || "Not added")}</p>
             <p>Date of birth: ${escapeHtml(person.dateOfBirth || "Not added")}</p>
             <p>Website: ${person.website ? `<a href="${escapeHtml(person.website)}" target="_blank" rel="noopener">${escapeHtml(person.website)}</a>` : "Not added"}</p>
           </div>
           <div class="card"><h3>About</h3><p>${escapeHtml(person.about || "No about section yet.")}</p></div>
           <div class="card"><h3>Skills</h3><p>${escapeHtml(person.skills || "No skills listed.")}</p></div>
           ${person.cvFile ? `<div class="card"><h3>CV file</h3><a href="${person.cvFile.data}" download="${escapeHtml(person.cvFile.name)}">${escapeHtml(person.cvFile.name)}</a></div>` : ""}`
    }

    <div class="card">
      <h3>Experience</h3>
      ${
        exp.length
          ? exp
              .map(
                (item) => `<div class="slot">
                  <strong>${escapeHtml(item.title)}</strong>
                  <div class="muted">${escapeHtml(item.company)} · ${escapeHtml(item.start)} – ${escapeHtml(item.end || "Present")}</div>
                  <p>${escapeHtml(item.description)}</p>
                  ${editable ? `<button class="btn btn-danger btn-sm" data-del-exp="${item.id}">Remove</button>` : ""}
                </div>`
              )
              .join("")
          : `<p class="muted">No experience added yet.</p>`
      }
      ${
        editable
          ? `<div class="field"><label>Role title</label><input id="exTitle" placeholder="e.g. Cashier"></div>
             <div class="field"><label>Company</label><input id="exCo"></div>
             <div class="field"><label>Start year</label><input id="exStart" placeholder="2024"></div>
             <div class="field"><label>End year</label><input id="exEnd" placeholder="Present"></div>
             <div class="field"><label>What you did</label><textarea id="exDesc"></textarea></div>
             <button class="btn btn-ghost" id="addExp">Add experience</button>`
          : ""
      }
    </div>

    <div class="card">
      <h3>Education</h3>
      ${
        edu.length
          ? edu
              .map(
                (item) => `<div class="slot">
                  <strong>${escapeHtml(item.school)}</strong>
                  <div class="muted">${escapeHtml(item.field)} · ${escapeHtml(item.start)} – ${escapeHtml(item.end)}</div>
                  ${editable ? `<button class="btn btn-danger btn-sm" data-del-edu="${item.id}">Remove</button>` : ""}
                </div>`
              )
              .join("")
          : `<p class="muted">No education added yet.</p>`
      }
      ${
        editable
          ? `<div class="field"><label>School</label><input id="edSchool"></div>
             <div class="field"><label>Course / field</label><input id="edField"></div>
             <div class="field"><label>Start</label><input id="edStart"></div>
             <div class="field"><label>End</label><input id="edEnd"></div>
             <button class="btn btn-ghost" id="addEdu">Add education</button>`
          : ""
      }
    </div>

    <div class="card">
      <h3>Licences and certificates</h3>
      ${
        (person.certificates || []).length
          ? person.certificates
              .map(
                (item) => `<div class="slot">
                  <strong>${escapeHtml(item.name)}</strong>
                  <div class="muted">${escapeHtml(item.issuer || "")} · ${escapeHtml(item.year || "")}</div>
                  ${item.file ? `<a href="${item.file.data}" download="${escapeHtml(item.file.name)}">${escapeHtml(item.file.name)}</a>` : ""}
                  ${editable ? `<button class="btn btn-danger btn-sm" data-del-cert="${item.id}">Remove</button>` : ""}
                </div>`
              )
              .join("")
          : `<p class="muted">No certificates added yet.</p>`
      }
      ${
        editable
          ? `<div class="field"><label>Certificate name</label><input id="cName" placeholder="e.g. Health and Safety"></div>
             <div class="field"><label>Issued by</label><input id="cIssuer" placeholder="Organisation"></div>
             <div class="field"><label>Year</label><input id="cYear" placeholder="2025"></div>
             <div class="field"><label>Upload certificate file</label><input id="cFile" type="file" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"></div>
             <button class="btn btn-ghost" id="addCert">Add certificate</button>`
          : ""
      }
    </div>
  `;

  if (!editable) {
    const msgBtn = $("mainArea").querySelector("[data-msg]");
    if (msgBtn) {
      msgBtn.onclick = () => {
        activeChatPartner = person.id;
        renderApp("messages");
      };
    }
    return;
  }

  $("saveIntro").onclick = async () => {
    person.name = $("pName").value.trim() || person.name;
    person.headline = $("pHeadline").value.trim();
    const nextEmail = $("pEmail").value.trim();
    if (nextEmail) person.email = nextEmail;
    person.phone = $("pPhone").value.trim();
    person.dateOfBirth = $("pDob").value;
    person.location = $("pLoc").value.trim();
    person.company = $("pCo").value.trim();
    person.website = $("pWeb").value.trim();
    person.about = $("pAbout").value.trim();
    person.skills = $("pSkills").value.trim();
    const photo = $("pPhoto").files[0];
    const cv = $("pCv").files[0];
    if (photo) person.photo = await readFile(photo, 900000);
    if (cv) person.cvFile = { name: cv.name, type: cv.type, data: await readFile(cv, 1400000) };
    save(db);
    renderChrome();
    renderProfile(person.id, true);
  };

  $("addExp").onclick = () => {
    const title = $("exTitle").value.trim();
    if (!title) return;
    person.experience.unshift({
      id: uid("e"),
      title,
      company: $("exCo").value.trim(),
      start: $("exStart").value.trim(),
      end: $("exEnd").value.trim(),
      description: $("exDesc").value.trim()
    });
    save(db);
    renderProfile(person.id, true);
  };

  $("addEdu").onclick = () => {
    const school = $("edSchool").value.trim();
    if (!school) return;
    person.education.unshift({
      id: uid("ed"),
      school,
      field: $("edField").value.trim(),
      start: $("edStart").value.trim(),
      end: $("edEnd").value.trim()
    });
    save(db);
    renderProfile(person.id, true);
  };

  $("addCert").onclick = async () => {
    const name = $("cName").value.trim();
    if (!name) return;
    const file = $("cFile").files[0];
    let stored = null;
    if (file) stored = { name: file.name, type: file.type, data: await readFile(file, 1400000) };
    person.certificates.unshift({
      id: uid("c"),
      name,
      issuer: $("cIssuer").value.trim(),
      year: $("cYear").value.trim(),
      file: stored
    });
    save(db);
    renderProfile(person.id, true);
  };

  $("mainArea").querySelectorAll("[data-del-exp]").forEach((btn) => {
    btn.onclick = () => {
      person.experience = person.experience.filter((x) => x.id !== btn.dataset.delExp);
      save(db);
      renderProfile(person.id, true);
    };
  });
  $("mainArea").querySelectorAll("[data-del-edu]").forEach((btn) => {
    btn.onclick = () => {
      person.education = person.education.filter((x) => x.id !== btn.dataset.delEdu);
      save(db);
      renderProfile(person.id, true);
    };
  });
  $("mainArea").querySelectorAll("[data-del-cert]").forEach((btn) => {
    btn.onclick = () => {
      person.certificates = person.certificates.filter((x) => x.id !== btn.dataset.delCert);
      save(db);
      renderProfile(person.id, true);
    };
  });
}

function readFile(file, maxBytes) {
  return new Promise((resolve, reject) => {
    if (file.size > maxBytes) {
      alert("That file is too large for this prototype. Please use a smaller file.");
      reject(new Error("too large"));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderCloud() {
  $("mainArea").innerHTML = `
    <div class="card">
      <h2>WorkMeet Cloud</h2>
      <p>Accounts, jobs, applications and chats are saved on this device and synced to the WorkMeet cloud when you are online. Offline changes sync after you reconnect.</p>
      <p class="muted" style="margin-top:8px;">Status: <strong>${cloudStatus}</strong>${lastCloudError ? " · " + escapeHtml(lastCloudError) : ""}</p>
      <div class="row-actions" style="margin-top:16px;">
        <button class="btn btn-primary" id="syncNowBtn">Sync now</button>
        <button class="btn btn-ghost" id="exportCloud">Download backup</button>
        <label class="btn btn-ghost">Restore backup<input id="importCloud" type="file" accept="application/json" hidden></label>
      </div>
      <p class="muted" style="margin-top:12px;">Users: ${db.users.length} · Jobs: ${db.jobs.length} · Messages: ${db.messages.length} · Last update: ${formatDate(db.updatedAt || Date.now())}</p>
    </div>
  `;
  $("syncNowBtn").onclick = async () => {
    await syncNow("manual");
    renderCloud();
  };
  $("exportCloud").onclick = () => {
    const blob = new Blob([JSON.stringify(db)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "workmeet-cloud-backup.json";
    a.click();
  };
  $("importCloud").onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const incoming = JSON.parse(reader.result);
        if (!incoming.users) throw new Error("bad file");
        db = incoming;
        db.users = db.users.map(normalizeUser);
        save(db);
        renderCloud();
      } catch (err) {
        alert("That backup file could not be read.");
      }
    };
    reader.readAsText(file);
  };
}

function bind() {
  $("btnGetStarted").onclick = goRegister;
  $("btnSignIn").onclick = goLogin;
  $("btnTopRegister").onclick = goRegister;
  $("btnTopLogin").onclick = goLogin;
  $("linkToLogin").onclick = (e) => {
    e.preventDefault();
    goLogin();
  };
  $("linkToRegister").onclick = (e) => {
    e.preventDefault();
    goRegister();
  };
  $("brand").onclick = () => {
    currentUser() ? openDashboard() : goLanding();
  };
  $("btnLogout").onclick = logout;
  $("pillEmployee").onclick = () => setRegRole("employee");
  $("pillEmployer").onclick = () => setRegRole("employer");
  $("btnDoRegister").onclick = register;
  $("btnDoLogin").onclick = () => login($("loginEmail").value.trim(), $("loginPassword").value);
}

bind();
renderChrome();
goLanding();
syncNow("startup").then(() => {
  renderChrome();
  if (currentUser()) renderApp("home");
});

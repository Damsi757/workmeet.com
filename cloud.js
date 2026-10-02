/* WorkMeet live cloud: offline-first, syncs when the device is online. */
const CLOUD_API = "https://crudcrud.com/api/4661cef1de22424b924a8a1af29a6a17/wm/6abd3c17a911e003e8cc71a6";
const LOCAL_KEY = "workmeet_cloud_v5";
const SESSION_KEY = "workmeet_session_v5";
const QUEUE_KEY = "workmeet_sync_queue_v5";

let cloudStatus = "starting";
let cloudTimer = null;
let lastCloudError = "";

function setCloudStatus(state, detail) {
  cloudStatus = state;
  if (detail) lastCloudError = detail;
  const map = {
    starting: ["Checking cloud…", "badge-gray"],
    online: ["Cloud synced", "badge-green"],
    offline: ["Offline · saved on this device", "badge-gray"],
    syncing: ["Syncing…", "badge"],
    error: ["Cloud retry", "badge-red"]
  };
  const [label, cls] = map[state] || map.error;
  ["syncBadge", "syncBadgeGuest"].forEach((id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.className = "badge " + cls;
    el.textContent = label;
  });
}

function compactForCloud(data) {
  const copy = JSON.parse(JSON.stringify(data));
  (copy.users || []).forEach((u) => {
    if (u.cvFile && u.cvFile.data && String(u.cvFile.data).length > 80000) {
      u.cvFile = { name: u.cvFile.name, type: u.cvFile.type, data: "", note: "CV kept on device (file too large for cloud)" };
    }
    if (u.photo && String(u.photo).length > 200000) {
      u.photo = "";
    }
  });
  delete copy._id;
  return copy;
}

function mergeById(localList, remoteList) {
  const map = new Map();
  [...(remoteList || []), ...(localList || [])].forEach((item) => {
    if (!item || !item.id) return;
    const prev = map.get(item.id);
    if (!prev) {
      map.set(item.id, item);
      return;
    }
    const a = Number(prev.updatedAt || prev.createdAt || 0);
    const b = Number(item.updatedAt || item.createdAt || 0);
    map.set(item.id, b >= a ? item : prev);
  });
  return [...map.values()];
}

function mergeUsers(localUsers, remoteUsers) {
  const byId = mergeById(localUsers, remoteUsers);
  const byEmail = new Map();
  byId.forEach((u) => {
    const key = String(u.email || "").toLowerCase();
    if (!key) return;
    const prev = byEmail.get(key);
    if (!prev) {
      byEmail.set(key, u);
      return;
    }
    const a = Number(prev.updatedAt || 0);
    const b = Number(u.updatedAt || 0);
    byEmail.set(key, b >= a ? { ...prev, ...u } : { ...u, ...prev });
  });
  return [...byEmail.values()].map(normalizeUser);
}

function mergeDatabases(local, remote) {
  if (!remote || !remote.users) return local;
  const localTime = Number(local.updatedAt || 0);
  const remoteTime = Number(remote.updatedAt || 0);
  return {
    users: mergeUsers(local.users, remote.users),
    jobs: mergeById(local.jobs, remote.jobs),
    applications: mergeById(local.applications, remote.applications),
    messages: mergeById(local.messages, remote.messages),
    ads: mergeById(local.ads || [], remote.ads || []),
    updatedAt: Math.max(localTime, remoteTime, Date.now())
  };
}

async function pullCloud() {
  const res = await fetch(CLOUD_API, { cache: "no-store" });
  if (!res.ok) throw new Error("Cloud read failed (" + res.status + ")");
  return res.json();
}

async function pushCloud(data) {
  const body = compactForCloud(data);
  const res = await fetch(CLOUD_API, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error("Cloud write failed (" + res.status + ")");
}

function scheduleCloudPush() {
  if (cloudTimer) clearTimeout(cloudTimer);
  cloudTimer = setTimeout(() => {
    syncNow("push").catch(() => {});
  }, 600);
}

async function syncNow(reason) {
  if (!navigator.onLine) {
    setCloudStatus("offline");
    return;
  }
  setCloudStatus("syncing");
  try {
    const remote = await pullCloud();
    db = mergeDatabases(db, remote);
    localStorage.setItem(LOCAL_KEY, JSON.stringify(db));
    if (reason !== "pull-only") await pushCloud(db);
    setCloudStatus("online");
    if (typeof currentUser === "function" && currentUser() && document.getElementById("mainArea")) {
      /* stay on current screen */
    }
  } catch (err) {
    setCloudStatus(navigator.onLine ? "error" : "offline", String(err.message || err));
  }
}

window.addEventListener("online", () => syncNow("reconnect"));
window.addEventListener("offline", () => setCloudStatus("offline"));
setInterval(() => {
  if (navigator.onLine) syncNow("poll");
}, 20000);

# homelab

Personal server management dashboard — a lightweight AWS-console-style web UI for your own lab machines.

Runs entirely on your laptop. Manage VMware VMs, monitor host resources, SSH into VMs, and keep study notes — all from one browser tab.

```
homelab
├── Dashboard        CPU · RAM · disk at a glance
├── VMs              card grid with power control + quick actions
│   └── VM detail    start / stop / pause / resume · SSH terminal · study notes
└── Host bar         live CPU / RAM / disk at the bottom of every page
```

---

## Prerequisites

| Requirement | Notes |
|---|---|
| **Node.js 20+** | [nodejs.org](https://nodejs.org) — or use `nvm` / `fnm` |
| **VMware Workstation Pro 17+** | Free for personal use since Broadcom acquisition (2024) |
| **OpenSSH** | Windows 10/11: already installed. Check: `ssh -V` in a terminal |

---

## Setup

### 1. Clone

```bash
git clone https://github.com/YOUR_USERNAME/homelab.git
cd homelab
```

### 2. Install dependencies

```bash
npm install
```

> `node-pty` and `better-sqlite3` compile native binaries on first install.  
> On Windows, this requires **Visual Studio Build Tools** (C++ workload).  
> Install from: https://visualstudio.microsoft.com/visual-cpp-build-tools/

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local`:

```env
SESSION_SECRET=pick-a-long-random-string-here-at-least-32-chars
VMREST_PATH=C:\Program Files (x86)\VMware\VMware Workstation\vmrest.exe
VMREST_USER=admin
VMREST_PASS=your_vmrest_password
```

### 4. Set up vmrest credentials (first time only)

`vmrest.exe` is VMware's local REST API server. You need to configure a username and password for it once:

```powershell
& "C:\Program Files (x86)\VMware\VMware Workstation\vmrest.exe" --help
```

Run `vmrest.exe` interactively from the Start Menu or Explorer to open its configuration dialog, set a username and password, then copy those values into `.env.local` as `VMREST_USER` / `VMREST_PASS`.

### 5. Start

```bash
npm run dev
```

This starts three things in sequence:
1. `vmrest.exe` — VMware REST API (port 8697)
2. SSH WebSocket server (port 3001)
3. Next.js dev server (port 3000)

Open **http://localhost:3000** in your browser.

---

## First run

On first visit you'll be redirected to `/setup` to set a dashboard password.  
Set it once — it's stored as a bcrypt hash in `.data/homelab.db`.

After that, log in at `/login` with the password you set.

---

## SSH terminal

The in-browser SSH terminal connects to your VM via the WebSocket server on port 3001.

- **IP auto-detection**: vmrest returns the VM's IP when VMware Tools is running inside the guest.  
- **IP override**: if the IP is wrong or missing, open the VM detail page → click `[set ip]`.  
- **SSH user**: defaults to `root`. Click the username next to the terminal button to change it.

Windows requires OpenSSH (`ssh.exe`) to be on PATH. Test with `ssh -V` in PowerShell.

---

## External access (port forwarding)

> ⚠️ This dashboard has no TLS or rate limiting. Only expose it on a trusted network.

To access from another device on your local network:

1. Find your laptop's LAN IP: `ipconfig` → IPv4 address under your active adapter
2. Open browser on another device: `http://<laptop-ip>:3000`
3. The SSH WebSocket (port 3001) also needs to be reachable from that device

To expose over the internet via your router:

1. **Router port forward**: external port `3000` → laptop LAN IP port `3000` (repeat for `3001`)
2. **Windows Firewall**: allow inbound on ports 3000 and 3001
3. Use a dynamic DNS service if your ISP gives you a changing IP

---

## Running on a dedicated server machine

If you move this to a separate always-on PC instead of your laptop:

- Install Node.js 20+ on that machine
- Install VMware Workstation (if managing VMs there) or skip vmrest setup if the VMs are elsewhere
- Copy `.env.local`, set `SESSION_SECRET` to a new value
- Run `npm run build && npm start` for production mode
- Consider `pm2` or a Windows Service wrapper to keep it running after reboot:
  ```bash
  npm install -g pm2
  pm2 start npm --name homelab -- start
  pm2 save
  pm2 startup
  ```

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, TypeScript) |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Database | SQLite via `better-sqlite3` (`.data/homelab.db`) |
| Auth | `iron-session` (signed cookie) + `bcryptjs` |
| VM control | VMware vmrest REST API |
| Host metrics | `systeminformation` |
| SSH terminal | `node-pty` + `ws` (WebSocket) + `@xterm/xterm` |
| Tests | Vitest |

---

## Data

All persistent data lives in `.data/homelab.db` (created automatically on first run).  
The file is gitignored — it contains your password hash, VM notes, and IP overrides.

---

## License

MIT

# homelab — Domain Glossary

## Core concepts

**Host**
The user's laptop. Runs VMware Workstation Pro 17, the dashboard web app, and vmrest. Is itself the "server computer" for this project.

**VM (Virtual Machine)**
A VMware virtual machine running on the Host. Managed via vmrest API. May use NAT or Bridged networking. The dashboard treats a VM as the primary unit of management.

**vmrest**
VMware's built-in local REST API server (`vmrest.exe`). Runs on the Host. The dashboard backend calls it to list, start, stop, pause, and resume VMs. Started automatically by the dashboard's start script.

**Dashboard**
The web application itself. Runs on the Host. Accessible locally at `localhost:<port>` or externally via port forwarding. Single-user, password-protected.

**VM State**
One of: `running`, `stopped`, `paused`, `suspended`. Sourced from vmrest. Displayed prominently in the UI.

**Host Resources**
Real-time metrics for the Host machine: CPU usage (%), RAM usage (used / total), disk usage per drive. Shown separately from individual VM states.

**Server Note**
A freeform text memo attached to a specific VM. Stores study context: what the user is learning on this VM, commands tried, links. Persisted in SQLite.

**Session**
A browser SSH terminal connection to a VM. Opened from the VM detail view. Uses xterm.js on the frontend and node-pty on the backend.

## What this glossary avoids

- "Server" alone — too ambiguous. Use **VM** for virtual machines, **Host** for the laptop.
- "Machine" alone — use **VM** or **Host** explicitly.
- "Container" — this project does not manage Docker containers; do not conflate with VM.

# Oracle Cloud VM deployment

This deployment runs the existing Dockerfile on an OCI Compute VM. Docker Compose restarts the container after a process or VM restart. It does not create an OCI account, VM, database, or firewall rules.

## 1. Create the VM

Use an Ubuntu 22.04/24.04 VM. Ampere A1 is ARM64; the repository Dockerfile uses Node 22 and Compose builds natively for the VM architecture. If a native dependency in the bundled application does not support ARM64, use an AMD x86_64 VM or resolve that dependency first. Allow inbound TCP 8080 in the OCI VCN security list/NSG for direct access, and restrict SSH (TCP 22) to your trusted IP. For production, put the app behind HTTPS with a domain and reverse proxy rather than exposing plain HTTP.

OCI Always Free compute can be reclaimed if it meets Oracle's idle criteria over a 7-day period. A free VM is therefore not a guaranteed 24/7 host for a low-activity bot; a paid VM avoids that specific Always Free reclamation rule.

## 2. Install Docker

Install Docker Engine and the Docker Compose plugin using Docker's official Ubuntu instructions, then enable Docker at boot:

```sh
sudo systemctl enable --now docker
```

## 3. Clone and configure

```sh
sudo git clone https://github.com/muweide0-dot/NexusTierss.git /opt/nexustiers
sudo chown -R "$USER":"$USER" /opt/nexustiers
cd /opt/nexustiers
cp deploy/oci/.env.example deploy/oci/.env
chmod 600 deploy/oci/.env
nano deploy/oci/.env
```

Set these required variables in `deploy/oci/.env`:

- `DATABASE_URL` - a reachable PostgreSQL connection string. This guide does not create a database.
- `DISCORD_BOT_TOKEN` - the bot token.
- `DISCORD_GUILD_ID` - the Discord server ID.

Do not commit `.env` or paste secrets into chat. The local `.gitignore` under `deploy/oci` excludes it.

## 4. Build and start

From the repository root:

```sh
sudo docker compose -f deploy/oci/compose.yaml up -d --build
sudo docker compose -f deploy/oci/compose.yaml ps
sudo docker compose -f deploy/oci/compose.yaml logs -f --tail=100
```

The container has `restart: unless-stopped`; with the Docker service enabled, it starts again after a VM reboot unless you explicitly stopped it. The health check calls `/api/healthz`. The app is published on port 8080; the OCI VCN security list/NSG must allow inbound TCP 8080 for direct access.

## 5. Update the app

```sh
cd /opt/nexustiers
git pull --ff-only
sudo docker compose -f deploy/oci/compose.yaml up -d --build
```

The database must remain reachable from the VM, and the Discord bot needs outbound network access.

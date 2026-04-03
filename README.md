# Digimax

Digimax, Next.js tabanli tek servisli bir canli TV uygulamasidir. Arayuz, auth API rotalari ve logo proxy yapisi ayni uygulama icinde calisir.

## Uygulama Yapisı

- Frontend: Next.js pages router
- API: `/api/auth/*`, `/api/channel-logo`, `/api/healthz`
- Veri: SQLite (`better-sqlite3`)
- Player: `hls.js + plyr`
- Deployment modeli: Docker + Traefik + Portainer

## Yerel Gelistirme

```bash
npm install
npm run dev
```

Uygulama varsayilan olarak:

```text
http://localhost:3000
```

## Uretim Hazirligi

Bu repo sunucu kurulumuna hazir hale getirildi:

- `Dockerfile`
- `.dockerignore`
- `deploy/portainer-stack.yml`
- `deploy/INSTALL.md`

## Veri ve Kalici Dizinler

SQLite klasoru `DATA_DIR` ile override edilebilir. Varsayilan:

```text
/app/data
```

Uploads klasoru:

```text
/app/public/uploads
```

## Saglik Kontrolu

```text
/api/healthz
```

## Sunucu Kurulum Dokumani

Tam kurulum adimlari icin:

- `deploy/INSTALL.md`

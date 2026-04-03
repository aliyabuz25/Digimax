# Digimax Kurulum Talimati

Bu proje tek servisli bir Next.js uygulamasidir. Frontend ve `/api/*` rotalari ayni container icinden sunulur. Bu nedenle backend ve frontend ayri image yerine tek image kullanilir.

## 1. Preflight

Sunucuda bunlari dogrulayin:

```bash
uname -a
echo "$SHELL"
id -u
pwd
docker ps
docker network inspect edge >/dev/null
curl -I http://127.0.0.1:8080/
```

Beklenen sistem gercekleri:

- Traefik entrypoint: `web`
- Traefik host baglantisi: `127.0.0.1:8080`
- Traefik docker network: `edge`
- Host port acma yok

## 2. Dizin yapisi

Sunucuda asagidaki dizinleri hazirlayin:

```bash
mkdir -p /datastore/digimax/app
mkdir -p /datastore/digimax/uploads
mkdir -p /datastore/digimax/nginx-logs
mkdir -p /datastore/digimax/data
```

ZIP kullanacaksaniz:

- ZIP konumu: `/datastore/digimax/digimax.zip`
- Acilim hedefi: `/datastore/digimax/app`

Mac kaynakli artiklari temizleyin:

```bash
find /datastore/digimax/app -name '__MACOSX' -o -name '._*'
```

## 3. Kod notlari

- API cagrilari zaten relative calisiyor: `/api/auth/*`, `/api/channel-logo`
- Upload klasoru gelecekteki medya dosyalari icin `/app/public/uploads` olarak ayrildi
- SQLite veri klasoru `DATA_DIR` ile override edilebilir

## 4. Image build

Portainer `/datastore` build context goremezse image'i hostta build edin:

```bash
docker build -t digimax:latest -f /datastore/digimax/app/Dockerfile /datastore/digimax/app
```

## 5. Portainer stack

Hazir stack dosyasi:

- `deploy/portainer-stack.yml`

Ornek kullanim:

```bash
cat /datastore/digimax/app/deploy/portainer-stack.yml
```

Stack dosyasi `edge` external network ve Traefik `web` entrypoint ile hazirlandi. Domainleri kendinize gore degistirin:

- `tv.example.com`
- `www.tv.example.com`

## 6. Cloudflared / DNS

Cloudflare Zero Trust tarafinda her hostname su hedefe gitmeli:

```text
http://127.0.0.1:8080
```

DNS kaydi yoksa `ERR_NAME_NOT_RESOLVED` gorunur.

## 7. Test

```bash
curl -H "Host: tv.example.com" http://127.0.0.1:8080/
curl -H "Host: tv.example.com" http://127.0.0.1:8080/api/healthz
docker ps | grep digimax
```

## 8. Kalici veri

- SQLite DB: `/datastore/digimax/data`
- Uploads: `/datastore/digimax/uploads`

## 9. Notlar

- Host port acma yok
- Traefik label icinde API kurali parantezli yazildi
- Uzun label'lar tek tirnak ile tutuldu
- Bu proje monolith oldugu icin backend ve frontend ayni container icinde calisir

# Appload

Eine App, mit der Nutzer eine fertige Code-Datei hochladen und sie direkt als
personalisierte App verwenden können. Mit Konten, E-Mail-Bestätigung und einem
Admin-/Support-Bereich.

- **Frontend:** React + TypeScript + Vite (HashRouter)
- **Backend:** Supabase (Auth, PostgreSQL, Storage) — Projekt `appload` (`eybwhnvjavovcxvimtxr`)
- **Mobil:** Capacitor (Android + iOS)
- **Web:** GitHub Pages

## Rollen

| Rolle       | Rechte                                                                 |
| ----------- | ---------------------------------------------------------------------- |
| **Admin**   | Sieht alles: Konten, Projekte, sensible Daten. Vergibt Rollen, sperrt Nutzer, löscht Projekte. |
| **Support** | Sieht Konten & Projekte (nur Lesen), kann Projekte freigeben/ablehnen. |
| **User**    | Lädt eigene Apps hoch und nutzt sie.                                    |

> Der **allererste** registrierte Nutzer wird automatisch **Admin** (per DB-Trigger).
> Danach kann dieser Admin weitere Admins/Support ernennen.

## Lokal starten

```bash
npm install
npm run dev
```

`.env` (nicht im Git, nur der öffentliche Publishable-Key):

```
VITE_SUPABASE_URL=https://eybwhnvjavovcxvimtxr.supabase.co
VITE_SUPABASE_ANON_KEY=sb_publishable_...
```

## Website veröffentlichen (GitHub Pages)

1. Repo-Secrets setzen (Settings → Secrets → Actions):
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. Settings → Pages → Source = **GitHub Actions**.
3. Push auf `main` → der Workflow `deploy.yml` baut und veröffentlicht automatisch.

Danach in **Supabase → Authentication → URL Configuration** die veröffentlichte
Pages-URL als **Site URL** und unter **Redirect URLs** eintragen, damit die
E-Mail-Bestätigungslinks funktionieren.

## E-Mail-Bestätigung (wichtig für Produktion)

Standardmäßig verschickt Supabase Bestätigungs-Mails über einen stark limitierten
Test-Absender. Für den echten Betrieb: **Supabase → Authentication → Emails → SMTP**
einen eigenen Absender einrichten (z. B. Resend, Postmark, SendGrid).

## Android-App bauen

```bash
npm run build          # Web bauen
npx cap sync android   # in die native App kopieren
npx cap open android   # Android Studio -> APK/AAB bauen
```

- **APK zum direkten Verteilen** (ohne Store): Android Studio → Build → Build APK.
- **Für den Google Play Store:** signiertes **AAB** bauen, Google-Play-Developer-Konto
  (einmalig 25 $) nötig, dann in der Play Console hochladen.

## iOS-App bauen (nur auf einem Mac)

```bash
npm run build
npx cap sync ios
npx cap open ios       # Xcode öffnen
```

- Benötigt **macOS + Xcode**.
- Für den App Store: **Apple Developer Program** (99 $/Jahr) und App-Review.
- Hinweis: Apple-Richtlinie 2.5.2 verbietet das Nachladen/Ausführen von fremdem
  ausführbarem Code. Damit die App den Review besteht, muss sie eigenständigen
  Mehrwert bieten (Konten, Verwaltung, Anzeige von Web-Inhalten) — nicht nur eine
  leere Hülle sein.

## Datenmodell

- `profiles` — 1:1 zu `auth.users` (E-Mail, Name, Status aktiv/gesperrt)
- `user_roles` — Rollen (getrennte Tabelle gegen RLS-Rekursion)
- `apps` — hochgeladene Projekte (Name, Beschreibung, `bundle_path`, Status)
- Storage-Bucket `app-bundles` — die hochgeladenen Dateien (privat, pro Nutzer-Ordner)

Rollenprüfungen laufen über `private.has_role()` / `private.is_staff()`
(SECURITY DEFINER, nicht über die API aufrufbar).

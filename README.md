# Konzerte in der Petruskirche

Website für die Petruskirche Kiel: Astro mit Cloudflare Workers, ChurchTools-Konzertdaten
und Kontakt-/Raumanfragen. Gestaltung: [DESIGN.md](DESIGN.md).
Lizenzen und Quellen: [COPYRIGHT.md](COPYRIGHT.md).

## Entwicklung

[Nix](https://nix.dev/install-nix) mit `nix-command` und `flakes` sowie
[devenv](https://devenv.sh/getting-started/) installieren. Die Projektumgebung liefert
Node.js, pnpm und die benötigten Laufzeitbibliotheken; Versionen sind gesperrt.

```sh
devenv tasks run project:setup
cp .dev.vars.example .dev.vars
# Lokale Secrets in .dev.vars ergänzen, dann:
devenv up
```

Die lokale URL steht im Serverlog; der Server bindet nur an `127.0.0.1`.
Ctrl+C beendet ihn, nach `devenv up -d` stattdessen `devenv processes down`.
Das bloße Öffnen von `devenv shell` installiert keine Abhängigkeiten.

## Prüfen und bauen

```sh
devenv shell -- pnpm exec vp run test  # Vitest: Fachlogik und Sicherheitsgrenzen
devenv tasks run project:quality      # Zusätzlich Format/Lint, Typen und Buildprüfungen
devenv tasks run project:build        # Produktionsbuild nach dist/
devenv test --clean                   # CI-Prüfung mit bereinigter Umgebung
```

Ohne Nix, etwa in Cloudflare Builds:

```sh
pnpm install --frozen-lockfile
pnpm exec vp run quality
```

Astro baut die Website; `vp run build` verwenden, nicht `vp build`.
Tests laufen ausschließlich mit Vitest und synthetischen Daten, ohne echten Versand.
Nur konkrete Fehler- und Sicherheitsrisiken automatisiert prüfen; Layout,
Tastaturbedienung und Browserabläufe bei betroffenen Änderungen manuell prüfen.
Build und laufenden Dev-/Preview-Server im selben Worktree nicht parallel betreiben.

## Konfiguration und Betrieb

- `astro.config.mjs`: kanonische Domain und Astro-Konfiguration.
- `wrangler.toml`: öffentliche Variablen, Worker-Bindings und Formularaktivierung.
  ChurchTools zeigt den Konzertkalender als **#5** an; seine REST-API-ID ist **3**.
- `.dev.vars`: lokale Secrets gemäß `.dev.vars.example`, niemals einchecken.
  `CHURCHTOOLS_TOKEN` braucht nur Leserechte für Kalender, Ressourcen und Buchungen;
  `TURNSTILE_SECRET` gehört ausschließlich auf den Server. Produktionssecrets separat
  über Cloudflare/Wrangler verwalten.
- Änderungen an Formularadressen oder Versandmodus erfordern einen gemeinsamen Neubau
  von statischem HTML und Worker. Versand nutzt die getrennte Absender-Subdomain
  `formmail.petruskirche.events`; MX/SPF der Hauptdomain bei IONOS nicht dafür umstellen.
- Die Vorabversion bleibt bewusst `noindex`. Eine Domain-Anbindung oder ein erfolgreicher
  Test ist keine Launch-, Datenschutz- oder Versandfreigabe. Echte Testnachrichten und
  Änderungen an der Indexierung benötigen eine ausdrückliche Freigabe.
- Cloudflare Builds verwendet `pnpm exec vp run build`. Versionsvorschauen verwenden
  `pnpm exec wrangler versions upload --keep-vars`, ohne Produktionstraffic umzuschalten.

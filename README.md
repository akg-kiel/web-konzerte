# Konzerte in der Petruskirche

Astro-Site fuer Konzerte in der Petruskirche Kiel.

## Workflow

Immer oben anfangen, dann nach unten:

1. `mise.toml` pinnt Tools.
2. `vp` ist die Arbeitsoberflaeche.
3. `package.json` enthaelt nur Scripts und Dependencies.

```sh
mise trust
mise install
mise run deps
mise run dev
mise run od
mise run quality
```

OpenDesign: `mise run od` baut `dist/` und kopiert es in den OpenDesign-Ordner.

Produktion: Cloudflare-kompatibler Static Build nach `dist/`.

# Copyright, licensing and sources

This repository contains material under different terms:

- **Source code:** licensed under the [Mozilla Public License 2.0](LICENSE).
- **Original textual content:** © Apostel-Kirchengemeinde Kiel. All rights reserved unless the relevant content is explicitly marked as licensed under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) or [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/).
- **Logos and branding:** all rights reserved. The MPL-2.0 source-code license does not grant permission to use them.
- **Photos and concert artwork:** rights remain with their respective copyright holders. Inclusion in this repository does not grant permission for reuse.
- **Map geometry:** © [OpenStreetMap contributors](https://www.openstreetmap.org/copyright), available under [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/). Both local maps retain visible attribution. Sources and transformations are recorded below; the data license is separate from the source-code license.
- **Third-party material:** remains subject to its own copyright and license notices, including the font licenses in `public/fonts/`.

## Map sources

Both SVGs derive from OSM data retrieved on 2026-10-30, not raster images copied
from Google Maps or the church's parking PDF. Their projected geometry is retained
in the components; labels are manually positioned. North is up. These are schematic
orientation maps, not surveyed boundaries or recommended driving/accessibility routes.

### Parking plan

`src/components/sections/ParkingMap.astro` uses this
[OSM bounding-box extract](https://api.openstreetmap.org/api/0.6/map?bbox=10.1334,54.3580,10.1386,54.3605):

- Church: [way 135854582](https://www.openstreetmap.org/way/135854582).
- Highlighted parking area: [way 650363682](https://www.openstreetmap.org/way/650363682).
  OSM's `access=private` tag does not establish visitor permission.
- Petruskirche bus stop: [node 430956107](https://www.openstreetmap.org/node/430956107).
- Nearby buildings and street sections come from the same extract.

WGS84 projection: `x = (lon - 10.1344) * cos(54.359°) * 111320 * 1.95`;
`y = (54.3601 - lat) * 111320 * 1.95`. Coordinates are rounded to one decimal place
and cropped to a `520 × 400` view box. The church marker identifies the building,
not an entrance.

### Wik overview

`src/components/sections/WikMap.astro` uses this
[OSM bounding-box extract](https://api.openstreetmap.org/api/0.6/map?bbox=10.114,54.348,10.164,54.375).
Coastline ways 144681999, 716993185, 857248329 and 716993186 are joined in native
order; open sea lies east of the coast. Canal/lock polygons are ways 28070936,
59908447, 73033118, 73033120, 262658479 and 427799833. Parks and streets come
from the same extract.

Projection: `x = (lon - 10.116) * cos(54.36°) * 111320 * 0.2`;
`y = (54.373 - lat) * 111320 * 0.2`. Geometry is clipped to `640 × 500` and rounded
to one decimal place. The scale bar represents approximately 500 m per 100 SVG units.
The church pin anchors at 54.35935° N, 10.13574° E, projected to `(256.1, 303.9)`;
its circle sits 30 SVG units above its tip.

## Editorial sources

- Building history and architecture: [official Petruskirche page](https://akg-kiel.de/petruskirche), consulted 2026-10-05.
- Parking permissions: [AKG concert/event parking plan](https://akg-kiel.de/wp-content/uploads/2022/03/Parken-bei-Konzerten_Veranstaltungen.pdf), checked as text and rendered PDF on 2026-10-30. It is the source of the published area and hours, not evidence of present-day permission or guaranteed spaces. On-site signage takes precedence; the separate service-parking plan is not the source for concerts.

### Legal-page references

Consulted on 2026-10-22. These are sources, not a legal approval or evidence of
signed provider agreements:

- [DSG-EKD](https://www.kirchenrecht-ekd.de/document/58309), [Nordkirchenverfassung](https://www.kirchenrecht-nordkirche.de/document/24017) and [DSDVO](https://www.kirchenrecht-nordkirche.de/document/37671).
- [Gemeinde-Impressum](https://akg-kiel.de/impressum): source for organizational/contact details, not a legal template.
- [Kirchenkreis privacy contact](https://www.kirchenkreis-altholstein.de/datenschutz) and [EKD supervisory structure](https://datenschutz.ekd.de/ueber-uns/unsere-struktur/).
- [BfD-EKD DPF FAQ](https://datenschutz.ekd.de/infothek-items/haeufig-gestellte-fragen-zum-dpf/).
- [Turnstile Privacy Addendum](https://www.cloudflare.com/turnstile-privacy-policy/), [Cloudflare DPA](https://www.cloudflare.com/cloudflare-customer-dpa/) and [ChurchTools privacy information](https://www.church.tools/datenschutz).
- [§ 25 TDDDG](https://www.gesetze-im-internet.de/ttdsg/__25.html) and [§ 5 DDG](https://www.gesetze-im-internet.de/ddg/__5.html).

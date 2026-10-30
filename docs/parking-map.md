# Local arrival and parking plan

`src/components/sections/ParkingMap.astro` draws the plan on `/besuch-planen/#parken`
as an inline SVG. It uses the site's midnight, slate, champagne/gold and body-font
tokens. On small screens the plan precedes the directions and parking times.
No map library, runtime API, external tile, image or consent step is required.
Only following an explicit OpenStreetMap link leaves the site. The contact page
uses a separate, wider Wik overview in `src/components/sections/WikMap.astro`,
not a duplicate of the close-up parking plan. Both are local SVGs; the former
Google Maps component and its consent script have been removed. Privacy copy
now distinguishes local maps from following external OpenStreetMap links.

## Geographic source and attribution

© OpenStreetMap contributors, [ODbL 1.0](https://opendatacommons.org/licenses/odbl/1-0/).
Visible attribution links to [OpenStreetMap copyright](https://www.openstreetmap.org/copyright).
The original map data is available through the
[OSM API bounding-box extract](https://api.openstreetmap.org/api/0.6/map?bbox=10.1334,54.3580,10.1386,54.3605),
retrieved 2026-10-30. The component contains the projected outlines used in the
published drawing, not raster imagery copied from the AKG PDF or Google Maps.

- Church footprint: [way 135854582](https://www.openstreetmap.org/way/135854582).
  Marker `1` is the church building, **not** a claimed entrance or accessible route.
- Highlighted parking footprint: [way 650363682](https://www.openstreetmap.org/way/650363682),
  west of Rostocker Straße. The current OSM `access=private` tag does not establish
  visitor permission; the separate AKG concert plan is the source for that.
- Bus-stop marker `H`: [node 430956107](https://www.openstreetmap.org/node/430956107),
  the northern Petruskirche stop on Adalbertstraße. No live departure data is shown.
- Context: 30 nearby building outlines and 10 residential street sections,
  limited to Adalbertstraße, Arkonastraße, Herthastraße, Weimarer Straße and
  Rostocker Straße. Other parking areas are deliberately not highlighted.

North is up. WGS84 coordinates are projected to a local equirectangular plane,
using 111320 metres per degree and longitude correction `cos(54.359°)`.
SVG coordinates are `x = (lon - 10.1344) * cos(54.359°) * 111320 * 1.95` and
`y = (54.3601 - lat) * 111320 * 1.95`, rounded to one decimal place and cropped
to a `520 × 400` view box. Street labels are manually placed for readability.
There is no invented walking route or live navigation, and the public caption
explicitly describes the highlighted area as schematic. This is an orientation
plan, not a parcel-accurate statement of parking permission.

## Wik overview on the contact page

The overview places the Petruskirche in Wik, west of the Kieler Förde and south
of the Nord-Ostsee-Kanal. It shows principal streets (including Prinz-Heinrich-
Straße and Holtenauer Straße), quieter residential streets and park outlines.
There is no highlighted driving route, live navigation, pan/zoom dependency,
third-party tile request or map consent step. Its internal link opens the
unchanged parking close-up; its optional external OSM link opens a wider view.

The source is the [OSM API extract](https://api.openstreetmap.org/api/0.6/map?bbox=10.114,54.348,10.164,54.375),
retrieved 2026-10-30. The west-shore coastline is joined in native order from
ways 144681999, 716993185, 857248329 and 716993186. Open sea is on its eastern
side. Canal and lock polygons are ways 28070936, 59908447, 73033118, 73033120,
262658479 and 427799833. Park polygons and road centre-lines are also from the
same extract. Street and water labels are manually placed, not live labels.

The projection is `x = (lon - 10.116) * cos(54.36°) * 111320 * 0.2` and
`y = (54.373 - lat) * 111320 * 0.2`. Source lines/polygons are clipped to the
`640 × 500` view box, with coordinates rounded to one decimal place. The scale
bar's 100 SVG units represent approximately 500 m. The pin tip at
`(256.1, 303.9)` uses the same coordinates as the close-up's external OSM link:
54.35935° N, 10.13574° E. The pin's circle is drawn 30 SVG units north of its
anchor so the tip does not move the marked location south. It marks the church,
not an entrance or parking area.
The map has a named SVG, geographic description and visible OSM attribution;
it remains visible without JavaScript.

## Parking permission and maintenance

The [AKG concert/event parking plan](https://akg-kiel.de/wp-content/uploads/2022/03/Parken-bei-Konzerten_Veranstaltungen.pdf)
was checked as text and rendered PDF on 2026-10-30. It identifies the area west
of Rostocker Straße and permits concert/event parking only Monday–Thursday
18:00–24:00, Friday 15:00–24:00 and Saturday–Sunday 00:00–24:00.
The website presents those times as accessible HTML and does **not** link visitors
to the AKG PDF. The source URL dates from 2022; current on-site validity remains
an operator check. No fee, capacity, space availability or accessible parking
place is promised. Actual signage takes precedence.

Update both the local drawing and the HTML copy when the permitted area or
hours change. Recheck the above OSM objects if streets, buildings or stops move;
keep the visible attribution. `scripts/check-cloudflare-build.mjs` checks the
built maps, markers, attribution, hours, internal parking link and absence of
remote map embeds. The contact page still loads the separately disclosed
Turnstile form protection; removing Google Maps does not remove that service.

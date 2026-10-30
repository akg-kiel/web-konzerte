"""Regenerate the home hero fonts with: pip install 'fonttools[woff]'; python scripts/subset-hero-fonts.py."""

from pathlib import Path
import re

from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.subset import Options, Subsetter
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parents[1]
hero = (root / 'src/components/sections/Hero.astro').read_text()
lines = re.findall(r'<span class="hero-title-word[^\"]*">([^<]+)</span>', hero)
assert len(lines) == 2, 'Expected the two home hero title lines'

for style, text in zip(('normal', 'italic'), lines):
    source = root / f'public/fonts/merriweather-latin-wght-{style}.woff2'
    original = TTFont(source, recalcTimestamp=False)
    font = TTFont(source, recalcTimestamp=False)
    options = Options()
    options.layout_features = ['*']
    options.name_IDs = ['*']
    subset = Subsetter(options=options)
    subset.populate(text=text)
    subset.subset(font)
    # The OFL reserves "Merriweather": derived font families must use another name.
    for name in font['name'].names:
        if name.nameID in (1, 3, 4, 6, 16, 21, 25):
            family = 'PetrusDisplay' if name.nameID in (6, 25) else 'Petrus Display'
            value = name.toUnicode().replace('Merriweather', family)
            name.string = value.encode(name.getEncoding())
    target = root / f'public/fonts/petrus-display-{style}.woff2'
    font.save(target)
    result = TTFont(target)
    assert set(map(ord, text)) <= result.getBestCmap().keys()
    assert target.stat().st_size < 8_000
    for weight in (300, 400, 600, 900):
        before = original.getGlyphSet(location={'wght': weight})
        after = result.getGlyphSet(location={'wght': weight})
        for codepoint in set(map(ord, text)):
            old = before[original.getBestCmap()[codepoint]]
            new = after[result.getBestCmap()[codepoint]]
            assert old.width == new.width, 'Keep the original glyph advances'
            old_pen = DecomposingRecordingPen(before)
            new_pen = DecomposingRecordingPen(after)
            old.draw(old_pen)
            new.draw(new_pen)
            assert old_pen.value == new_pen.value, 'Keep the original glyph outlines'
    print(f'{target.name}: {target.stat().st_size} bytes; glyph checks passed')

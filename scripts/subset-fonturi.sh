#!/usr/bin/env bash
# ============================================================
# Rețeta prin care fișierele din Web Tamplate/_core/assets/fonts/
# devin fonturile livrate din public/fonts/.
#
# Se rulează O SINGURĂ DATĂ, la schimbarea unui font. Nu face parte
# din build: rezultatul e commis în repo.
#
# De ce există: fișierele sursă însumau 216 KB, din care o pagină în
# română descărca 158 KB — peste ținta de 120 KB din T03. Subsetate pe
# intervalele chiar folosite, ajung la 68 KB pe disc și 51 KB descărcați.
#
# Nevoie: pip install "fonttools[woff]" brotli
# ============================================================
set -euo pipefail

SURSA="${1:-$HOME/Desktop/Web Tamplate/_core/assets/fonts}"
DEST="$(cd "$(dirname "$0")/.." && pwd)/public/fonts"

# Latin de bază + Latin-1 + punctuație tipografică + €.
LATIN="U+0020-007E,U+00A0-00FF,U+2013-2014,U+2018-201A,U+201C-201E,U+2020-2022,U+2026,U+2030,U+2039-203A,U+20AC,U+2122,U+2212,U+FEFF,U+FFFD"

# Diacriticele românești. Ă ă · Œ œ · formele cu sedilă (pentru text
# lipit din documente vechi) · Ș ș Ț ț cu virgulă dedesubt — corecte.
EXT="U+0102-0103,U+0152-0153,U+015E-015F,U+0162-0163,U+0218-021B"

# `tnum` e obligatoriu: base.css folosește font-variant-numeric:
# tabular-nums pe prețuri, note și capacități.
FEAT="kern,liga,calt,tnum,ccmp,mark,mkmk,locl"

sub() {
  pyftsubset "$SURSA/$1.woff2" --output-file="$DEST/$2.woff2" --flavor=woff2 \
    --unicodes="$3" --layout-features="$FEAT" --name-IDs='*' \
    --notdef-outline --no-hinting
  printf '  %-22s %6s octeti\n' "$2.woff2" "$(stat -f%z "$DEST/$2.woff2" 2>/dev/null || stat -c%s "$DEST/$2.woff2")"
}

mkdir -p "$DEST"
echo "Subsetez din: $SURSA"
sub inter-latin      inter-ro-latin   "$LATIN"
sub inter-latin-ext  inter-ro-ext     "$EXT"
sub satoshi-700      satoshi-700-ro   "$LATIN,$EXT"
sub satoshi-900      satoshi-900-ro   "$LATIN,$EXT"

echo
echo "Total pe disc:"
du -ch "$DEST"/*.woff2 | tail -1
echo
echo "Verifica diacriticele inainte de commit: vezi comentariul din styles/fonts.css."

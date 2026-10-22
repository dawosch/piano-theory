#!/bin/sh
# Kopiert das Buch in einen Ordner, aus dem das Artifact-Tool veröffentlichen darf, und gibt die files-Map aus.
# Aufruf: sh tools/sync.sh <zielordner>
# index.html ist ein vollständiges Dokument (für GitHub Pages). Die Artifact-Plattform ergänzt Doctype,
# Charset und Viewport selbst, deshalb werden diese Zeilen in der Kopie entfernt.
S="$1"; mkdir -p "$S"; rm -f "$S"/*
B="$(cd "$(dirname "$0")/.." && pwd)"
cp "$B"/*.html "$B"/*.js "$B"/*.css "$S"/
sed -i '/^<!doctype html>$/d; /data-standalone/d' "$S/index.html"
cd "$S" && ls | grep -v '^index.html$' | python -I -c "import sys,json; print(json.dumps({f.strip(): f.strip() for f in sys.stdin if f.strip()}))"

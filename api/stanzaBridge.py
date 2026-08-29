#!/usr/bin/env python3
"""Optional local Stanza executor for MeaningForge's narrative stage.

Input/output are JSON lines so the Node prototype can invoke this process
without making Python a required runtime dependency. Models are never
downloaded at construction time: an unavailable installation reports an error
and MeaningForge keeps its deterministic candidate pass.
"""
import json
import sys

try:
    import stanza
except Exception as error:
    print(json.dumps({"ok": False, "error": f"Stanza unavailable: {error}"}))
    raise SystemExit(0)

request = json.load(sys.stdin)
language = request.get("language", "zh-hans")
spans = request.get("spans", [])
try:
    pipeline = stanza.Pipeline(lang=language, processors="tokenize,pos,lemma,depparse,ner", tokenize_no_ssplit=False, verbose=False, download_method=None)
except Exception as error:
    print(json.dumps({"ok": False, "error": f"Stanza model unavailable: {error}"}))
    raise SystemExit(0)

# Calling a neural pipeline once per paragraph made the optional executor
# unusably slow for a complete short story.  We preserve exact paragraph
# membership by joining spans with boundary whitespace, then map Stanza's
# character offsets back to the source span that contains them.
joined, ranges = [], []
cursor = 0
for index, span in enumerate(spans):
    value = span.get("text", "")
    if index:
        joined.append("\n\n")
        cursor += 2
    start = cursor
    joined.append(value)
    cursor += len(value)
    ranges.append((start, cursor, span.get("id")))

def span_id_at(offset):
    for start, end, identifier in ranges:
        if start <= offset < end:
            return identifier
    return None

document = pipeline("".join(joined))
entities, events = [], []
for entity in document.entities:
    identifier = span_id_at(entity.start_char)
    if identifier:
        entities.append({"span_id": identifier, "surface_form": entity.text, "type": entity.type})
for sentence in document.sentences:
    if not sentence.words:
        continue
    identifier = span_id_at(sentence.words[0].start_char)
    if not identifier:
        continue
    subjects = [word.text for word in sentence.words if word.deprel in ("nsubj", "nsubj:pass")]
    for word in sentence.words:
        if word.upos in ("VERB", "AUX"):
            events.append({"span_id": identifier, "predicate": word.lemma or word.text, "participants": subjects})
print(json.dumps({"ok": True, "entities": entities, "events": events}, ensure_ascii=False))

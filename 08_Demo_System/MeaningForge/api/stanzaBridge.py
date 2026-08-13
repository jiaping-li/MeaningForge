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
    pipeline = stanza.Pipeline(lang=language, processors="tokenize,pos,lemma,depparse,ner", tokenize_no_ssplit=True, verbose=False, download_method=None)
except Exception as error:
    print(json.dumps({"ok": False, "error": f"Stanza model unavailable: {error}"}))
    raise SystemExit(0)

entities, events = [], []
for span in spans:
    doc = pipeline(span.get("text", ""))
    for entity in doc.entities:
        entities.append({"span_id": span["id"], "surface_form": entity.text, "type": entity.type})
    for sentence in doc.sentences:
        subjects = [word.text for word in sentence.words if word.deprel in ("nsubj", "nsubj:pass")]
        for word in sentence.words:
            if word.upos in ("VERB", "AUX"):
                events.append({"span_id": span["id"], "predicate": word.lemma or word.text, "participants": subjects})
print(json.dumps({"ok": True, "entities": entities, "events": events}, ensure_ascii=False))

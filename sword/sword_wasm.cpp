// A small C API over libsword for the extension: open a SWORD directory, list
// its Bible modules, and read a passage (OSIS ref) as plain-text verses.
// Results are JSON strings that stay valid until the next call.

#include <swmgr.h>
#include <swmodule.h>
#include <versekey.h>
#include <listkey.h>
#include <string>
#include <emscripten/emscripten.h>

using namespace sword;

static SWMgr *mgr = nullptr;
static std::string out;

static std::string json(const char *s) {
	std::string r = "\"";
	for (const unsigned char *p = (const unsigned char *)(s ? s : ""); *p; p++) {
		switch (*p) {
		case '"': r += "\\\""; break;
		case '\\': r += "\\\\"; break;
		case '\n': r += "\\n"; break;
		case '\r': r += "\\r"; break;
		case '\t': r += "\\t"; break;
		default:
			if (*p < 0x20) { char b[8]; snprintf(b, sizeof b, "\\u%04x", *p); r += b; }
			else r += (char)*p;
		}
	}
	return r + "\"";
}

// Removes each element that contains marker, from the open tag before it to
// the next close tag. Only for elements that don't nest one of their own kind.
static void removeElements(std::string &raw, const char *open, const char *marker, const char *close) {
	size_t from = 0, at;
	while ((at = raw.find(marker, from)) != std::string::npos) {
		size_t start = raw.rfind(open, at);
		size_t end = raw.find(close, at);
		if (start == std::string::npos || end == std::string::npos) break;
		raw.erase(start, end + strlen(close) - start);
		from = start;
	}
}

// The verse text alone, in the module's markup. Leaves out titles: Psalm
// titles ("A Psalm of David…"), the letters in Psalm 119 ("ALEPH") and section
// headings. Also leaves out colophons, the note after the last verse of an
// epistle ("Written to the Romans from Corinthus…"). SWORD's Headings option
// can't be relied on for this: canonical titles stay in the text whenever we
// filter text of our own.
static std::string verseText(SWModule *m) {
	std::string raw = m->getRawEntry();
	removeElements(raw, "<title", "<title", "</title>");
	removeElements(raw, "<div", "type=\"colophon\"", "</div>");
	return raw;
}

extern "C" {

// Reopens the modules under path (a directory holding mods.d/ and modules/).
EMSCRIPTEN_KEEPALIVE int sw_open(const char *path) {
	delete mgr;
	mgr = new SWMgr(path);
	// Plain verse text only (see also verseText).
	for (const char *opt : {"Footnotes", "Lemmas", "Strong's Numbers", "Words of Christ in Red",
	                        "Morphological Tags", "Cross-references", "Headings"}) {
		mgr->setGlobalOption(opt, "Off");
	}
	return (int)mgr->getModules().size();
}

EMSCRIPTEN_KEEPALIVE const char *sw_modules() {
	out = "[";
	if (mgr) {
		for (auto &it : mgr->getModules()) {
			SWModule *m = it.second;
			if (strcmp(m->getType(), SWMgr::MODTYPE_BIBLES)) continue;
			// A locked module has a CipherKey entry with no key in it yet.
			const char *cipher = m->getConfigEntry("CipherKey");
			if (out.size() > 1) out += ",";
			out += "{\"name\":" + json(m->getName())
			    + ",\"description\":" + json(m->getDescription())
			    + ",\"language\":" + json(m->getLanguage())
			    + ",\"abbreviation\":" + json(m->getConfigEntry("Abbreviation"))
			    + ",\"versification\":" + json(m->getConfigEntry("Versification"))
			    + ",\"locked\":" + (cipher && !*cipher ? "true" : "false") + "}";
		}
	}
	return (out += "]").c_str();
}

// osisRef is one reference as the bcv parser writes it, in KJV numbering:
// "John.3.16-John.3.18" or "Ps.23". (SWORD misreads a comma-separated list of
// OSIS refs, so split those first.) Each verse is mapped into the module's own
// versification, and verses the module doesn't have are left out. Returns
// [{"book":"John","chapter":3,"verse":16,"text":"..."}, ...] or {"error":"..."}.
EMSCRIPTEN_KEEPALIVE const char *sw_passage(const char *module, const char *osisRef) {
	SWModule *m = mgr ? mgr->getModule(module) : nullptr;
	if (!m) return (out = "{\"error\":\"module not found\"}").c_str();
	VerseKey kjv;
	kjv.setVersificationSystem("KJV");
	ListKey verses = kjv.parseVerseList(osisRef, "", true);
	out = "[";
	std::string last;
	for (verses = TOP; !verses.popError(); verses++) {
		m->setKey(verses);
		if (m->popError()) continue;
		VerseKey *at = (VerseKey *)m->getKey();
		// Two KJV verses can map to one verse of the module; show it once.
		std::string here = at->getOSISRef();
		if (here == last) continue;
		last = here;
		std::string raw = verseText(m);
		if (out.size() > 1) out += ",";
		out += "{\"book\":" + json(at->getOSISBookName())
		    + ",\"chapter\":" + std::to_string(at->getChapter())
		    + ",\"verse\":" + std::to_string(at->getVerse())
		    + ",\"text\":" + json(m->stripText(raw.c_str(), (int)raw.size())) + "}";
	}
	return (out += "]").c_str();
}

EMSCRIPTEN_KEEPALIVE void sw_set_cipher_key(const char *module, const char *key) {
	if (mgr) mgr->setCipherKey(module, key);
}

}

/**
 * @file text.ts — lexical channel of the engine (f_text). Pure.
 *
 * Lexical relevance query↔candidate (BM25-lite with IDF LOCAL to the query's
 * candidate set — no inverted index, no global corpus):
 *   - Candidate document = title (+ taxonomy keywords, with title strength) +
 *     description/names (body).
 *   - Query = the seeker's free text + expansion terms (taxonomy names).
 *   - Local IDF: terms shared by ALL candidates cancel out; discriminant terms
 *     carry the weight.
 *
 * It also softens the gate (rescue of miscategorized candidates): a candidate
 * whose declared topic does not match may still enter if f_text ≥ τ with at
 * least one title hit.
 *
 * Stopwords are injectable per language; a minimal Spanish set ships as the
 * default (the reference deployment operates in es-CO).
 */

/** Minimal Spanish stopwords (sufficient for short need/title texts). */
export const STOPWORDS_ES: ReadonlySet<string> = new Set([
    "de", "del", "la", "las", "el", "los", "un", "una", "unos", "unas", "y", "o", "u",
    "a", "al", "en", "con", "sin", "por", "para", "que", "se", "su", "sus", "mi", "mis",
    "tu", "tus", "me", "te", "le", "les", "lo", "es", "son", "esta", "este", "esto",
    "estoy", "hay", "ya", "no", "si", "muy", "mas", "pero", "como", "cuando", "donde",
    "necesito", "busco", "quiero", "requiero", "urgente", "favor", "ayuda", "alguien",
    "servicio", "servicios", "casa", "hogar", "tengo", "hacer", "dañado", "dañada",
]);

/** Minimal English stopwords (for non-Spanish deployments). */
export const STOPWORDS_EN: ReadonlySet<string> = new Set([
    "the", "a", "an", "and", "or", "of", "in", "on", "at", "to", "for", "with",
    "without", "by", "from", "is", "are", "was", "were", "be", "been", "it", "its",
    "my", "your", "his", "her", "our", "their", "this", "that", "these", "those",
    "i", "you", "he", "she", "we", "they", "me", "him", "them", "need", "want",
    "looking", "someone", "help", "please", "urgent", "service", "services", "home",
]);

let activeStopwords: ReadonlySet<string> = STOPWORDS_ES;

/** Replaces the active stopword set (call once at deployment bootstrap). */
export function setStopwords(words: ReadonlySet<string>): void {
    activeStopwords = words;
}

/** Normalizes: lowercase, no accents/diacritics, letters/digits/spaces only. */
export function normalizeText(s: string): string {
    return (s || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^a-z0-9ñ\s]/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/** Tokenizes normalized text: drops stopwords and 1–2 letter tokens. */
export function tokenize(s: string): string[] {
    const out: string[] = [];
    for (const t of normalizeText(s).split(" ")) {
        if (t.length < 3) continue;
        if (activeStopwords.has(t)) continue;
        out.push(t);
    }
    return out;
}

/** Textual document of a candidate, pre-tokenized once. */
export interface TextDoc {
    /** Tokens with "title" strength: title + taxonomy names + keywords. */
    titleTokens: ReadonlySet<string>;
    /** All document tokens (title + body). */
    tokens: ReadonlySet<string>;
}

/** Textual query. `idf` is added by the caller after seeing the candidates. */
export interface TextQuery {
    tokens: string[];
    /** Local IDF per token (over THIS query's candidate set). */
    idf?: ReadonlyMap<string, number>;
}

/**
 * Builds the candidate document. `extraTitleTerms` (taxonomy names, catalog
 * keywords) count as title: they are the strong thematic identity.
 */
export function buildTextDoc(title: string, body: string, extraTitleTerms: string[] = []): TextDoc {
    const titleTokens = new Set<string>(tokenize(title));
    for (const term of extraTitleTerms) for (const t of tokenize(term)) titleTokens.add(t);
    const tokens = new Set<string>(titleTokens);
    for (const t of tokenize(body)) tokens.add(t);
    return { titleTokens, tokens };
}

/** Builds the query: free text + expansion terms (taxonomy/keywords). */
export function buildTextQuery(text: string, expansionTerms: string[] = []): TextQuery {
    const seen = new Set<string>(tokenize(text));
    for (const term of expansionTerms) for (const t of tokenize(term)) seen.add(t);
    return { tokens: [...seen] };
}

/**
 * Local IDF (BM25-style, floored at 0.15 so no term is fully cancelled):
 *   idf(t) = ln(1 + (N − df + 0.5)/(df + 0.5)), N = candidates in the query.
 * With small N (scarce catalog) it degrades smoothly: few docs ⇒ idf ≈ const.
 */
export function computeLocalIdf(query: TextQuery, docs: ReadonlyArray<TextDoc>): Map<string, number> {
    const N = docs.length;
    const idf = new Map<string, number>();
    for (const t of query.tokens) {
        let df = 0;
        for (const d of docs) if (d.tokens.has(t)) df++;
        const v = N > 0 ? Math.log(1 + (N - df + 0.5) / (df + 0.5)) : 1;
        idf.set(t, Math.max(0.15, v));
    }
    return idf;
}

export interface TextScore {
    /** Relevance ∈ [0,1]. 0 if query or document are empty. */
    score: number;
    /** Query tokens that hit the TITLE (requirement of the gate rescue). */
    titleHits: number;
}

/**
 * f_text: IDF-weighted presence, with title overweight (×1 vs ×0.6 for body),
 * normalized by the query's total mass. Full title match → 1.
 */
export function textScore(query: TextQuery | undefined, doc: TextDoc | undefined): TextScore {
    if (!query || !doc || query.tokens.length === 0 || doc.tokens.size === 0) {
        return { score: 0, titleHits: 0 };
    }
    let num = 0;
    let den = 0;
    let titleHits = 0;
    for (const t of query.tokens) {
        const w = query.idf?.get(t) ?? 1;
        den += w;
        if (doc.titleTokens.has(t)) {
            num += w;
            titleHits++;
        } else if (doc.tokens.has(t)) {
            num += 0.6 * w;
        }
    }
    if (den <= 0) return { score: 0, titleHits: 0 };
    return { score: Math.min(1, num / den), titleHits };
}

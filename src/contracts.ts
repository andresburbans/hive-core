/**
 * @file contracts.ts — contracts shared by ALL decisions of the engine.
 *
 * The same engine decides in several directions (seeker→candidates, broadcast
 * need→candidates, provider→open needs, seeker→incoming offers). Each
 * deployment maps its data to these contracts; the engine only sees the
 * contracts. This is what makes the model domain-agnostic: anything
 * expressible as a situated query against situated candidates — service
 * marketplaces, emergency dispatch, field-crew allocation, distributed
 * logistics — can consume it by changing data sources and priors only.
 * Pure (types + helpers).
 */

import type { Counts5 } from "./dirichlet";
import type { EngagementCounters } from "./engagement";
import type { WeightProfile } from "./config";
import type { TextDoc, TextQuery } from "./text";
import type { MobilityKernel } from "./kernel";
import type { PricingByUnit } from "./price";

/**
 * A situated need: what the seeker asks, from where, in what context.
 * `budget`/`urgent` apply to the broadcast (`request`) flow.
 */
export interface SituatedQuery {
    /** Fine-grained topics of the thematic focus (deployment taxonomy). */
    focusTopicIds: string[];
    /** Coarse domain of the focus. */
    focusDomainId: string;
    center: { lat: number; lng: number };
    /**
     * H3 cell of the center: enables the native hexagonal metric. Must be at
     * the search resolution OR FINER (finer cells are lifted to their parent);
     * a coarser cell cannot be refined and the metric falls back to Haversine.
     */
    centerCell?: string;
    /**
     * Evaluation clock (epoch ms). Freezing it makes `scoreCandidate` fully
     * deterministic — same inputs, same result — which experiments and replays
     * require. Defaults to `Date.now()`.
     */
    nowMs?: number;
    /**
     * Discovery mode: without a thematic focus the gate only requires coverage
     * and the ranking is decided by distance + reputation + text. Covers the
     * empty query ("near me") and the text-only query (text ranks without the
     * gate emptying the list — key under a scarce catalog).
     */
    discovery?: boolean;
    /** Textual query (tokens + local IDF) — the f_text channel. */
    text?: TextQuery;
    /** Mobility kernel (learned per topic). Absent → DEFAULT_KERNEL. */
    kernel?: MobilityKernel;
    /** Local supply of the topic (density for α_eff). Absent → factor 1. */
    localSupply?: number;
    budget?: number;
    /** Charging unit the budget refers to (deployment-defined, e.g. "hour"). */
    unit?: string;
    urgent?: boolean;
    flow: "browse" | "request";
}

/** A situated capability: what a candidate offers, from where, with what evidence. */
export interface SituatedCandidate {
    id: string;
    /** Owning entity (provider), if distinct from the offer itself. */
    entityId?: string;
    lat: number;
    lng: number;
    /** H3 cell at search resolution or finer (see `SituatedQuery.centerCell`). */
    cell?: string;
    domainId: string;
    topicId: string;
    pricing: PricingByUnit;
    /** Main charging unit (defines the fallback band). */
    primaryUnit: string;
    coverageRadiusKm: number;
    /** Ordinal evidence counts (or derived from a scalar while reviews accrue). */
    ratingCounts: Counts5;
    /** Pre-tokenized textual document (title + taxonomy + description). */
    textDoc?: TextDoc;
    /** Categorical trait counts (in reserve: not yet a scored signal). */
    traitCounts?: Record<string, number>;
    verified?: boolean;
    /** epoch ms; undefined → neutral signal. */
    lastActiveMs?: number;
    createdMs?: number;
    engagement?: EngagementCounters;
}

/* ─── Reverse direction (provider→open needs) ──────────────────────────────── */

/** An open broadcast need seen as a candidate opportunity for one provider. */
export interface OpenNeed {
    id: string;
    cell?: string;
    lat?: number;
    lng?: number;
    domainId: string;
    topicIds: string[];
    budget: number;
    /** Charging unit of the budget. */
    unit?: string;
    urgent?: boolean;
    createdMs: number;
    scheduledMs?: number;
    /** Tokens of the need's free text. */
    text?: TextQuery;
}

/** The context of the provider consulting their opportunity feed. */
export interface ProviderContext {
    centerCell?: string;
    center?: { lat: number; lng: number };
    offeredDomainIds: ReadonlyArray<string>;
    offeredTopicIds: ReadonlyArray<string>;
    maxDistanceKm: number;
    /** Combined price bands of the provider's offers (per charging unit). */
    pricing?: PricingByUnit;
    /** Textual documents of the provider's offers (for f_text need↔trade). */
    textDocs?: ReadonlyArray<TextDoc>;
    nowMs?: number;
}

/* ─── Offer ranking (seeker→incoming offers) ───────────────────────────────── */

/** An incoming offer on a broadcast need, ready to rank. */
export interface OfferFeatures {
    /** Amount actually offered/locked in the negotiation. */
    amount: number;
    /** The seeker's budget on the need (if known). */
    budget?: number;
    candidateRating?: number;
    candidateMatchCount?: number;
}

/** Relevant charging unit: the one requested by the seeker or the candidate's main one. */
export function resolveUnit(q: Pick<SituatedQuery, "unit">, primaryUnit: string): string {
    return q.unit || primaryUnit;
}

/** Weight profile per flow + urgency. */
export function weightProfileFor(q: Pick<SituatedQuery, "flow" | "urgent">): WeightProfile {
    if (q.flow === "request") return q.urgent ? "request_urgent" : "request";
    return "browse";
}

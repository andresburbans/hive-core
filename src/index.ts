/**
 * @file index.ts — hive-core barrel.
 *
 * HIVE (Hyper-local Intelligent Vicinity Engine): a geography-first retrieval
 * and ranking model where location is the primary retrieval constraint, not a
 * post-hoc ordering criterion. Pure and isomorphic: the same code runs
 * on-device and server-side.
 *
 * Pipeline:  P --F_geo--> C --G--> C' --S--> C'' --order--> R
 *   F_geo : discrete-neighborhood retrieval (`retrieval.ts`)
 *   G     : feasibility gate — a non-candidate is never scored (`scoring.ts`)
 *   S     : multi-signal affinity with first-class uncertainty (`scoring.ts`)
 *   order : interpretable linear form today, learning-ready by construction
 */

export * from "./config";
export * from "./random";
export * from "./dirichlet";
export * from "./decay";
export * from "./hexMetric";
export * from "./kernel";
export * from "./text";
export * from "./price";
export * from "./engagement";
export * from "./traits";
export * from "./prior";
export * from "./contracts";
export * from "./scoring";
export * from "./retrieval";

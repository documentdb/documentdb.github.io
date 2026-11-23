// Narration for the film on the sample campaign pages. The film is not part of
// the experiment: both variants play the same one, with the same words, so a
// visitor of either page watches exactly the same thing. One tap in a shopping
// app is followed from the phone to a PostgreSQL heap page and back. What the
// variants compare is the copy around the film (headline, description, button
// labels and the cards below), which each page supplies itself.
//
// Every technical statement here is taken from the DocumentDB source
// (github.com/documentdb/documentdb): table and index naming from
// pg_documentdb/src/commands, the gateway's port, protocol and SQL from
// pg_documentdb_gw, and the extension dependencies from documentdb.control.
// TrailyShop and Traily Run, the shop and the shoe in the film, are invented.

import type { ShotKey } from "./scene/film";

export interface FilmCaption {
  /** Part of the film this line belongs to. */
  shot: ShotKey;
  /** A few words, set in bold. */
  title: string;
  /** One sentence of narration. */
  text: string;
  /** Exact identifiers for the written version, set in monospace. */
  facts: string[];
}

/** One line per shot, in the order of SHOTS. */
export const narration: FilmCaption[] = [
  {
    shot: "tap",
    title: "One tap in your app.",
    text: "A shopper buys a pair of Traily Run. The app sends one update to DocumentDB.",
    facts: ["DocumentDB API", "updateOne", "$inc"],
  },
  {
    shot: "doc",
    title: "The product is one document.",
    text: "Tags, stock, a location and an embedding live together and travel as BSON.",
    facts: ["BSON", "arrays and nested fields", "up to 16 MB"],
  },
  {
    shot: "wire",
    title: "On its way to your server.",
    text: "The bytes leave the phone for a machine you run. One container holds everything below.",
    facts: ["Docker", "Linux packages", "Kubernetes operator"],
  },
  {
    shot: "gateway",
    title: "The DocumentDB gateway answers.",
    text: "Port 10260 accepts the wire protocol and turns the command into a PostgreSQL call.",
    facts: ["OP_MSG", "SCRAM-SHA-256 over TLS", "documentdb_api.update_txn_proc"],
  },
  {
    shot: "btree",
    title: "A B-tree finds the row.",
    text: "_id is the table's primary key, so the lookup walks a B-tree down to one 8 kB heap page.",
    facts: ["collection_pk_<id>", "documentdb_data.documents_<id>", "one row per document"],
  },
  {
    shot: "mvcc",
    title: "The update writes a new version.",
    text: "The old row stays for reads already running, the change is logged, and vacuum reclaims it.",
    facts: ["xmin / xmax", "write-ahead log", "READ COMMITTED"],
  },
  {
    shot: "indexes",
    title: "More indexes, same rows.",
    text: "RUM answers tag queries, pgvector finds similar gear, PostGIS finds the nearest store.",
    facts: ["RUM", "vector-hnsw", "2dsphere"],
  },
  {
    shot: "stack",
    title: "Answered. All of it yours.",
    text: "DocumentDB on top, PostgreSQL underneath, MIT licensed, running where you choose.",
    facts: ["MIT license", "PostgreSQL 15 to 18", "Linux Foundation"],
  },
];

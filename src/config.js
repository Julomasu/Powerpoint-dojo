// Compte et synchronisation (Supabase). L'adresse et la clé « publishable / anon » sont publiques par conception :
// la sécurité vient des règles de la base (supabase/schema.sql), pas du secret de la clé.
// ⚠ Ne JAMAIS mettre ici la clé « service_role » (ce dépôt est public).
// Tant que `url` et `key` sont vides, le Dojo fonctionne sans compte (progression locale seulement).
// `table` : une table propre à PowerPoint Dojo, pour ne pas mélanger avec la progression de l'Excel Dojo.
export const CLOUD = {
  url: "",
  key: "",
  table: "pptdojo_progress",
};

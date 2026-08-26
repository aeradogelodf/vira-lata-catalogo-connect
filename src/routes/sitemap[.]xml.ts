import { createFileRoute } from "@tanstack/react-router";
import type {} from "@tanstack/react-start";

import { supabase } from "@/integrations/supabase/client";
import { SITE_URL } from "@/lib/site";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        // Rotas estáticas públicas e indexáveis (sem lastmod: não há
        // timestamp autoritativo por página para elas).
        const entries: SitemapEntry[] = [
          { path: "/", changefreq: "weekly", priority: "1.0" },
          { path: "/catalogo", changefreq: "daily", priority: "0.9" },
          { path: "/servicos", changefreq: "weekly", priority: "0.8" },
          { path: "/contato", changefreq: "monthly", priority: "0.6" },
        ];

        // Produtos ativos — mesma fonte e filtro do loader de /produto/$slug.
        // Categorias e marcas não têm rotas públicas próprias, portanto não
        // entram no sitemap (evita URLs quebradas/duplicadas).
        const { data: products } = await supabase
          .from("products")
          .select("slug, updated_at")
          .eq("active", true)
          .order("updated_at", { ascending: false });

        for (const product of products ?? []) {
          entries.push({
            path: `/produto/${product.slug}`,
            // lastmod vem do updated_at real do produto (mudança de conteúdo).
            lastmod: new Date(product.updated_at).toISOString().slice(0, 10),
            changefreq: "weekly",
            priority: "0.7",
          });
        }

        const urls = entries.map((e) =>
          [
            `  <url>`,
            `    <loc>${SITE_URL}${e.path}</loc>`,
            e.lastmod ? `    <lastmod>${e.lastmod}</lastmod>` : null,
            e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
            e.priority ? `    <priority>${e.priority}</priority>` : null,
            `  </url>`,
          ]
            .filter(Boolean)
            .join("\n"),
        );

        const xml = [
          `<?xml version="1.0" encoding="UTF-8"?>`,
          `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
          ...urls,
          `</urlset>`,
        ].join("\n");

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});

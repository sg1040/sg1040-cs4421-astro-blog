type AstroPostComponent = typeof import("../posts/blog/doom-review.astro")["default"];

export type PostCategory = "blog" | "artlog";

export interface PostEntry {
  slug: string;
  title: string;
  href: string;
  component: AstroComponentFactory;
}

const blogModules = import.meta.glob<AstroPostComponent>(
  "../posts/blog/*.astro",
  { eager: true, import: "default" },
);
const artlogModules = import.meta.glob<AstroPostComponent>(
  "../posts/artlog/*.astro",
  { eager: true, import: "default" },
);

export function getPosts(category: PostCategory): PostEntry[] {
  const modules = category === "blog" ? blogModules : artlogModules;
  const route = category === "blog" ? "/blog" : "/art-log";

  return Object.entries(modules)
    .map(([path, component]) => {
      const slug = path.split("/").at(-1)?.replace(/\.astro$/, "") ?? "";
      const title = slug
        .split(/[-_]/)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");

      return { slug, title, href: `${route}/${slug}/`, component };
    })
    .sort((first, second) => first.title.localeCompare(second.title));
}
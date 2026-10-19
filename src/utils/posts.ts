type AstroPostModule = {
  default: AstroComponentFactory;
  title?: string;
  date?: string;
};

export type PostCategory = "blog" | "artlog";

export interface PostEntry {
  slug: string;
  title: string;
  date?: string;
  href: string;
  component: AstroComponentFactory;
}

const blogModules = import.meta.glob<AstroPostModule>(
  "../posts/blog/*.astro",
  { eager: true },
);

const artlogModules = import.meta.glob<AstroPostModule>(
  "../posts/artlog/*.astro",
  { eager: true },
);

export function getPosts(category: PostCategory): PostEntry[] {
  const modules = category === "blog" ? blogModules : artlogModules;
  const route = category === "blog" ? "/blog" : "/art-log";

  return Object.entries(modules)
    .map(([path, module]) => {
      const slug =
        path.split("/").at(-1)?.replace(/\.astro$/, "") ?? "";

      const fallbackTitle = slug
        .split(/[-_]/)
        .map(
          (word) =>
            word.charAt(0).toUpperCase() + word.slice(1),
        )
        .join(" ");

      return {
        slug,
        title: module.title ?? fallbackTitle,
        date: module.date,
        href: `${route}/${slug}/`,
        component: module.default,
      };
    })
    .sort(
      (first, second) =>
        new Date(second.date ?? 0).getTime() -
        new Date(first.date ?? 0).getTime(),
    );
}
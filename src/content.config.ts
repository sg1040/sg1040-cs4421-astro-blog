import { defineCollection, reference, z } from 'astro:content';

const authors = defineCollection({
    type: 'content',
    schema: ({ image }) => z.object({
        name: z.string(),
        avatar: image(),
        bio: z.string(),
        socials: z.record(z.string(), z.string()).optional(),
    }),
});

const blog = defineCollection({
    type: 'content',
    schema: ({ image }) => z.object({
        title: z.string(),
        description: z.string(),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        heroImage: image().optional(),
        author: reference('authors'),
    }),
});

export const collections = {
    blog,
    authors,
};

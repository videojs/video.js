#!/usr/bin/env bash
# A small course site on the react-next fixture: lesson data, a course home page listing the lessons, and a page per
# lesson with a placeholder where its video belongs.
set -euo pipefail

mkdir -p lib 'app/lessons/[slug]'

cat > lib/lessons.ts <<'TS'
export type Lesson = {
  slug: string;
  title: string;
  description: string;
  duration: string;
  /** HLS stream from Mux. */
  videoUrl: string;
  thumbnailUrl: string;
};

export const lessons: Lesson[] = [
  {
    slug: "welcome",
    title: "Welcome to the course",
    description:
      "Meet your instructor, see the short film we will make together, and set up your workspace.",
    duration: "4 min",
    videoUrl: "https://stream.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4.m3u8",
    thumbnailUrl: "https://image.mux.com/lhnU49l1VGi3zrTAZhDm9LUUxSjpaPW9BL4jY25Kwo4/thumbnail.webp?time=6",
  },
  {
    slug: "lighting-basics",
    title: "Lighting basics",
    description:
      "Shape a scene with a single key light, then add fill and backlight for depth.",
    duration: "12 min",
    videoUrl: "https://stream.mux.com/s41JYeqIpBMBzE4OzxDyGR2yrp2hD1CQ6gJN9SlVGDQ.m3u8",
    thumbnailUrl: "https://image.mux.com/s41JYeqIpBMBzE4OzxDyGR2yrp2hD1CQ6gJN9SlVGDQ/thumbnail.webp?time=95",
  },
  {
    slug: "editing-your-first-cut",
    title: "Editing your first cut",
    description:
      "Assemble your footage into a rough cut, then tighten it until the story holds.",
    duration: "18 min",
    videoUrl: "https://stream.mux.com/BV3YZtogl89mg9VcNBhhnHm02Y34zI1nlMuMQfAbl3dM.m3u8",
    thumbnailUrl: "https://image.mux.com/BV3YZtogl89mg9VcNBhhnHm02Y34zI1nlMuMQfAbl3dM/thumbnail.webp?time=12",
  },
];

export function getLesson(slug: string): Lesson | undefined {
  return lessons.find((lesson) => lesson.slug === slug);
}
TS

cat > app/page.tsx <<'TSX'
import Link from "next/link";

import { lessons } from "@/lib/lessons";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">Acme Academy</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Filmmaking Fundamentals</h1>
      <p className="mt-3 text-lg text-zinc-600">
        Plan, light, shoot, and edit your first short film in three lessons.
      </p>
      <ol className="mt-10 divide-y divide-zinc-200 border-y border-zinc-200">
        {lessons.map((lesson, index) => (
          <li key={lesson.slug}>
            <Link href={`/lessons/${lesson.slug}`} className="flex items-center gap-4 py-4 hover:bg-zinc-50">
              <span className="w-6 text-zinc-400">{index + 1}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lesson.thumbnailUrl} alt="" className="aspect-video w-28 rounded object-cover" />
              <span className="flex-1">
                <span className="block font-medium">{lesson.title}</span>
                <span className="block text-sm text-zinc-600">{lesson.description}</span>
              </span>
              <span className="text-sm text-zinc-500">{lesson.duration}</span>
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
}
TSX

cat > 'app/lessons/[slug]/page.tsx' <<'TSX'
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getLesson, lessons } from "@/lib/lessons";

export function generateStaticParams() {
  return lessons.map((lesson) => ({ slug: lesson.slug }));
}

export async function generateMetadata({ params }: PageProps<"/lessons/[slug]">): Promise<Metadata> {
  const lesson = getLesson((await params).slug);

  return { title: lesson ? `${lesson.title} · Filmmaking Fundamentals` : "Lesson not found" };
}

export default async function LessonPage({ params }: PageProps<"/lessons/[slug]">) {
  const { slug } = await params;
  const lesson = getLesson(slug);

  if (!lesson) notFound();

  const index = lessons.indexOf(lesson);
  const next = lessons[index + 1];

  return (
    <main className="mx-auto w-full max-w-3xl px-6 py-16">
      <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-900">
        ← All lessons
      </Link>
      <p className="mt-6 text-sm font-medium text-zinc-500">
        Lesson {index + 1} of {lessons.length} · {lesson.duration}
      </p>
      <h1 className="mt-1 text-3xl font-semibold tracking-tight">{lesson.title}</h1>

      {/* TODO: lesson video */}
      <div className="mt-6 flex aspect-video w-full items-center justify-center rounded-lg bg-zinc-100 text-zinc-500">
        Video coming soon
      </div>

      <p className="mt-6 text-lg text-zinc-600">{lesson.description}</p>

      {next ? (
        <Link
          href={`/lessons/${next.slug}`}
          className="mt-10 inline-block font-medium text-zinc-900 underline underline-offset-4"
        >
          Next: {next.title} →
        </Link>
      ) : (
        <p className="mt-10 font-medium text-zinc-900">You finished the course.</p>
      )}
    </main>
  );
}
TSX

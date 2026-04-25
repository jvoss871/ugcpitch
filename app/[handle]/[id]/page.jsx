import { getPitch } from '@/lib/db';
import PitchViewClient from '@/app/pitch/view/PitchViewClient';
import { notFound } from 'next/navigation';

const SITE = 'https://ugcedge.com';

export async function generateMetadata({ params }) {
  const { handle, id } = await params;
  try {
    const data = await getPitch(id);
    if (!data) return { title: 'UGC Edge' };

    const creator = data.profile?.name || data.profile?.username || 'Creator';
    const brand   = data.pitch?.title || 'Brand';
    const bio     = data.profile?.bio || '';
    const tags    = (data.profile?.niche_tags ?? []).slice(0, 3).join(' · ');

    const title       = `${creator} × ${brand}`;
    const description = bio ? bio.slice(0, 150) : tags ? `${creator} — ${tags}` : `${creator}'s UGC pitch for ${brand}`;
    const url         = `${SITE}/${handle}/${id}`;

    return {
      title,
      description,
      openGraph: { title, description, url, type: 'profile', siteName: 'UGC Edge' },
      twitter:   { card: 'summary', title, description },
    };
  } catch {
    return { title: 'UGC Edge' };
  }
}

export default async function HandlePitchPage({ params }) {
  const { id } = await params;
  const data = await getPitch(id);
  if (!data) notFound();
  return <PitchViewClient pitchId={id} />;
}

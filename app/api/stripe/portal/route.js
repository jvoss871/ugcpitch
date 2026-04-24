import Stripe from 'stripe';
import { getUser } from '@/lib/db';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ugcedge.com';

export async function POST(req) {
  try {
    const { username } = await req.json();
    if (!username) return Response.json({ error: 'username required' }, { status: 400 });

    const user = await getUser(username);
    if (!user?.stripeCustomerId) {
      return Response.json({ error: 'No billing account found' }, { status: 404 });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${BASE_URL}/upgrade`,
    });

    return Response.json({ url: session.url });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}

export default function Privacy() {
  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      <h1 className="text-4xl font-black text-gray-900 mb-2">Privacy Policy</h1>
      <p className="text-sm text-gray-400 mb-12">Effective date: June 1, 2025</p>

      <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">1. What We Collect</h2>
          <ul className="list-disc list-inside space-y-1.5">
            <li><strong>Account info</strong> — email address when you sign up.</li>
            <li><strong>Profile content</strong> — bio, niche tags, social handles, portfolio links, and any media you upload.</li>
            <li><strong>Pitch content</strong> — job descriptions you paste and pitches we generate for you.</li>
            <li><strong>Usage data</strong> — pages visited, pitches created, and when your pitch links are opened by brands.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">2. How We Use It</h2>
          <ul className="list-disc list-inside space-y-1.5">
            <li>To provide, operate, and improve the Service.</li>
            <li>To generate AI pitch copy from job descriptions you submit.</li>
            <li>To track pitch opens so you can see when brands view your page.</li>
            <li>To contact you about your account or major changes to the Service.</li>
          </ul>
          <p className="mt-3">We do not sell your data. We do not use your pitch content to train AI models.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">3. Third-Party Services</h2>
          <ul className="list-disc list-inside space-y-1.5">
            <li><strong>Supabase</strong> — stores account data and pitch content. Data is stored in the US.</li>
            <li><strong>Groq</strong> — processes job descriptions to generate pitch copy. Inputs are sent to Groq's API; they are subject to <a href="https://groq.com/privacy-policy/" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline">Groq's privacy policy</a>.</li>
            <li><strong>Stripe</strong> — handles payment processing for paid plans. We never see or store your card details.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">4. Cookies</h2>
          <p>We use only essential cookies required for authentication. We don't use advertising or tracking cookies.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">5. Data Retention</h2>
          <p>We keep your data as long as your account is active. If you delete your account, we remove your personal data within 30 days, except where retention is required by law.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900 mb-3">6. Your Rights</h2>
          <p>You can request a copy of your data, ask us to correct it, or ask us to delete it at any time. If you're in the EU/UK, you have additional rights under GDPR/UK GDPR.</p>
        </section>

      </div>
    </div>
  );
}

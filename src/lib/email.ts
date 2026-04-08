import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY ?? "";
const resend = resendApiKey ? new Resend(resendApiKey) : null;
const fromEmail = process.env.ADMIN_EMAIL
  ? `Intellink <${process.env.ADMIN_EMAIL}>`
  : "Intellink <onboarding@resend.dev>";
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

async function sendEmail(args: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!resend) {
    console.warn(
      `Resend API key missing. Skipping email "${args.subject}" to ${args.to}.`,
    );
    return;
  }

  await resend.emails.send({
    from: fromEmail,
    to: args.to,
    subject: args.subject,
    html: args.html,
  });
}

export async function sendSubscriptionWelcomeEmail(
  email: string,
  name: string,
  plan: string,
) {
  await sendEmail({
    to: email,
    subject: "Welcome to Intellink. Your profile is live.",
    html: `
      <h2>Welcome to Intellink, ${name}</h2>
      <p>Your ${plan} subscription is active and your profile can now go live.</p>
      <p>Set up your profile, publish your offerings, and start sharing your link.</p>
      <p><a href="${baseUrl}/dashboard">Open your dashboard</a></p>
    `,
  });
}

export async function sendSubscriptionExpiryWarningEmail(
  email: string,
  name: string,
  expiresAt: string,
) {
  await sendEmail({
    to: email,
    subject: "Your Intellink subscription expires soon",
    html: `
      <h2>Your subscription expires soon</h2>
      <p>Hi ${name},</p>
      <p>Your subscription expires on ${new Date(expiresAt).toLocaleDateString()}.</p>
      <p>Renew now to keep your profile visible and your offerings active.</p>
      <p><a href="${baseUrl}/pricing">Renew subscription</a></p>
    `,
  });
}

export async function sendSubscriptionExpiredEmail(
  email: string,
  name: string,
) {
  await sendEmail({
    to: email,
    subject: "Your Intellink subscription has expired",
    html: `
      <h2>Your profile is now inactive</h2>
      <p>Hi ${name},</p>
      <p>Your subscription has expired, so your public profile is hidden and clients can no longer purchase your offerings.</p>
      <p><a href="${baseUrl}/pricing">Renew now</a></p>
    `,
  });
}

export async function sendNewQuestionEmail(
  email: string,
  expertName: string,
  clientName: string,
  questionText: string,
) {
  await sendEmail({
    to: email,
    subject: "You have a new question on Intellink",
    html: `
      <h2>New question</h2>
      <p>Hi ${expertName},</p>
      <p>${clientName} purchased your Q&amp;A offering.</p>
      <blockquote>${questionText}</blockquote>
      <p><a href="${baseUrl}/dashboard">Reply from your dashboard</a></p>
    `,
  });
}

export async function sendSessionBookedEmail(
  email: string,
  expertName: string,
  clientName: string,
  scheduledTime: string,
) {
  await sendEmail({
    to: email,
    subject: "You have a new session booking on Intellink",
    html: `
      <h2>New session booked</h2>
      <p>Hi ${expertName},</p>
      <p>${clientName} booked a session with you.</p>
      <p>Preferred time: ${new Date(scheduledTime).toLocaleString()}</p>
      <p><a href="${baseUrl}/dashboard">View your dashboard</a></p>
    `,
  });
}

export async function sendResourceSoldEmail(
  email: string,
  expertName: string,
  clientName: string,
  resourceTitle: string,
) {
  await sendEmail({
    to: email,
    subject: "Your resource just sold on Intellink",
    html: `
      <h2>New resource sale</h2>
      <p>Hi ${expertName},</p>
      <p>${clientName} purchased ${resourceTitle}.</p>
      <p><a href="${baseUrl}/dashboard">See your activity</a></p>
    `,
  });
}

export async function sendAnswerEmail(
  email: string,
  clientName: string,
  expertName: string,
  answerText: string,
  reviewUrl?: string,
) {
  const formattedAnswer = answerText
    .split("\n")
    .map((line) => `<p>${line}</p>`)
    .join("");

  await sendEmail({
    to: email,
    subject: `${expertName} answered your question`,
    html: `
      <h2>Your answer is ready</h2>
      <p>Hi ${clientName},</p>
      <p>${expertName} has answered your question:</p>
      <div>${formattedAnswer}</div>
      ${
        reviewUrl
          ? `<p>If this helped you, leave a review to help other clients trust the right experts.</p>
             <p><a href="${reviewUrl}">Leave a review</a></p>`
          : ""
      }
      <p>Thank you for using Intellink.</p>
    `,
  });
}

export async function sendResourceDownloadEmail(
  email: string,
  clientName: string,
  resourceTitle: string,
  downloadUrl: string,
  reviewUrl?: string,
) {
  await sendEmail({
    to: email,
    subject: `Your Intellink download is ready: ${resourceTitle}`,
    html: `
      <h2>Your download is ready</h2>
      <p>Hi ${clientName},</p>
      <p>Thanks for purchasing ${resourceTitle}.</p>
      <p><a href="${downloadUrl}">Download your resource</a></p>
      ${
        reviewUrl
          ? `<p>Used it already? Help other clients by sharing a quick review.</p>
             <p><a href="${reviewUrl}">Leave a review</a></p>`
          : ""
      }
    `,
  });
}

export async function sendPayoutReceivedEmail(
  email: string,
  expertName: string,
  amount: string,
  clientName: string,
) {
  await sendEmail({
    to: email,
    subject: "You just received a payout from Intellink",
    html: `
      <h2>Payout sent</h2>
      <p>Hi ${expertName},</p>
      <p>You just received ${amount} from a client purchase on Intellink.</p>
      <p>Client: ${clientName}</p>
      <p><a href="${baseUrl}/dashboard">View dashboard</a></p>
    `,
  });
}

export async function sendExpertRestrictedEmail(
  email: string,
  expertName: string,
  oneStarReviewCount: number,
) {
  await sendEmail({
    to: email,
    subject: "Your Intellink profile has been restricted",
    html: `
      <h2>Your profile has been restricted</h2>
      <p>Hi ${expertName},</p>
      <p>Your expert profile has been automatically restricted after receiving ${oneStarReviewCount} one-star reviews within the last 7 days.</p>
      <p>Your public page is hidden from new client purchases while the trust issue is reviewed.</p>
      <p><a href="${baseUrl}/dashboard">Open your dashboard</a></p>
    `,
  });
}

import { onDocumentCreated } from "firebase-functions/v2/firestore";
import * as postmark from "postmark";

export const sendOnboardingEmail = onDocumentCreated(
    { document: "leads/{leadId}" },
    async (event) => {
        const snapshot = event.data;
        if (!snapshot) {
            console.error("No data associated with the event.");
            return;
        }

        const { email, name } = snapshot.data();

        if (!email) {
            console.error("No email provided in the lead document.");
            return;
        }

        const client = new postmark.ServerClient(process.env.POSTMARK_SERVER_TOKEN as string);

        let attempt = 0;
        const maxRetries = 3;
        let success = false;

        while (attempt < maxRetries && !success) {
            try {
                const response = await client.sendEmail({
                    From: "Cornelius Toole <cornelius@waitaminutedigital.com>",
                    To: email,
                    Bcc: "waitaminutedigital.social@gmail.com",
                    Subject: "System Audit Initiated // Waitaminute Digital",
                    HtmlBody: `
                        <div style="font-family: Arial, sans-serif; color: #111; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; padding: 20px; border-radius: 8px; border-top: 4px solid #a855f7;">
                            <h2 style="color: #a855f7; margin-top: 0; text-transform: uppercase; letter-spacing: 1px;">System Audit Initiated</h2>
                            <p>Commander ${name || "there"},</p>
                            <p>Congratulations on your decision to upgrade your digital footprint. This is the first step toward architecting your unfair advantage.</p>
                            <p>Our designated AI agents are currently reviewing your architecture and processing your project scope. We are preparing tailored insights for our upcoming transmission on Day 1 of your journey with us.</p>
                            <p>While you stand by for the calendar sync, we invite you to review our <a href="https://waitaminutedigital.com/#solutions" style="color: #a855f7; font-weight: bold; text-decoration: none;">Selected Masterpieces</a> showcasing high-impact digital experiences built for speed, scale, and ROI.</p>
                            <br/>
                            <p>Stand by for further transmission.</p>
                            <p style="font-size: 12px; color: #666; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 10px;">
                                <strong>WAITAMINUTE.DIGITAL</strong><br/>
                                Production-First AI Agency
                            </p>
                        </div>
                    `,
                    MessageStream: "waitaminutedigital-transactional",
                });

                console.log(`Successfully sent Day 1 onboarding email to ${email} via Postmark. MessageID: ${response.MessageID}`);
                success = true;
            } catch (err) {
                console.error(`Unexpected exception during Postmark API call:`, err);
                attempt++;
                if (attempt < maxRetries) {
                    await new Promise((res) => setTimeout(res, 1000 * attempt));
                }
            }
        }

        if (!success) {
            console.error(`Failed to send onboarding email to ${email} after ${maxRetries} attempts.`);
        }
    }
);

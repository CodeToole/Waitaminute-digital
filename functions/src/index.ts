import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { defineSecret } from "firebase-functions/params";
import { Resend } from "resend";

const resendApiKey = defineSecret("RESEND_API_KEY");

export const sendOnboardingEmail = onDocumentCreated(
    { document: "leads/{leadId}", secrets: [resendApiKey] },
    async (event) => {
        const snapshot = event.data;
        if (!snapshot) {
            console.error("No data associated with the event.");
            return;
        }

        const { email, name, interestTag } = snapshot.data();

        if (!email) {
            console.error("No email provided in the lead document.");
            return;
        }

        const resend = new Resend(resendApiKey.value());

        // Extract firstName and lastName from name
        const nameParts = (name || "").trim().split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

        // Map interestTag to Audience ID
        const AUDIENCE_MAP: Record<string, string> = {
            "WaaS Engine": "adaa3729-2989-4815-97d2-017605a9f810",
            "Custom AI Architecture": "66b34b8f-8b02-4652-a654-2549f191d28f",
            "Digital Strategy": "6ea2dd71-8c8e-4f04-8344-b5b549216ff5",
        };

        const WAAS_LEADS_AUDIENCE_ID = "adaa3729-2989-4815-97d2-017605a9f810";
        const audienceId = (interestTag && AUDIENCE_MAP[interestTag as string]) ? AUDIENCE_MAP[interestTag as string] : WAAS_LEADS_AUDIENCE_ID;

        {
            try {
                console.log(`Adding contact to audience: ${audienceId} for interestTag: ${interestTag}`);
                const { data: contactData, error: contactError } = await resend.contacts.create({
                    audienceId: audienceId,
                    email: email,
                    firstName: firstName,
                    lastName: lastName,
                    unsubscribed: false,
                });

                if (contactError) {
                    console.error(`Failed to add lead ${snapshot.id} to audience ${audienceId}:`, contactError);
                } else {
                    console.log(`Successfully added lead ${snapshot.id} to audience ${audienceId}. Contact ID: ${contactData?.id}`);
                }
            } catch (err) {
                console.error(`Unexpected exception adding lead ${snapshot.id} to audience ${audienceId}:`, err);
            }
        }

        let attempt = 0;
        const maxRetries = 3;
        let success = false;

        while (attempt < maxRetries && !success) {
            try {
                const { data, error } = await resend.emails.send({
                    from: "Cornelius Toole <cornelius@waitaminutedigital.com>",
                    to: email,
                    bcc: "waitaminutedigital.social@gmail.com",
                    subject: "System Audit Initiated // Waitaminute Digital",
                    html: `
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
                });

                if (error) {
                    const errorName = (error as any).name || "";
                    const errorMessage = (error as any).message || "";

                    if (errorName === "internal_server_error" || errorMessage.includes("500") || errorMessage.includes("502") || errorMessage.includes("503") || errorMessage.includes("504")) {
                        console.warn(`Resend 500-level error: ${errorMessage}. Retrying... (${attempt + 1}/${maxRetries})`);
                        attempt++;
                        if (attempt < maxRetries) {
                            await new Promise((res) => setTimeout(res, 1000 * attempt));
                        }
                    } else {
                        console.error(`Resend non-500 error:`, error);
                        break; // Break on 400-level errors
                    }
                } else {
                    console.log(`Successfully sent Day 1 onboarding email to lead ${snapshot.id} via Resend. ID: ${data?.id}`);
                    success = true;
                }
            } catch (err) {
                console.error(`Unexpected exception during Resend API call:`, err);
                attempt++;
                if (attempt < maxRetries) {
                    await new Promise((res) => setTimeout(res, 1000 * attempt));
                }
            }
        }

        if (!success) {
            console.error(`Failed to send onboarding email to lead ${snapshot.id} after ${maxRetries} attempts.`);
        }
    }
);

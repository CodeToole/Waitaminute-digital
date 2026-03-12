const fftest = require("firebase-functions-test");
const testEnv = fftest();

// Mock defineSecret before importing index
jest.mock("firebase-functions/params", () => ({
    defineSecret: jest.fn().mockReturnValue({ value: () => "fake_api_key" }),
}));

// Mock Resend before importing index
import { Resend } from "resend";
jest.mock("resend");

// Import the function to be tested
import { sendOnboardingEmail } from "./index";

describe("sendOnboardingEmail", () => {
    let mockContactsCreate: jest.Mock;
    let mockEmailsSend: jest.Mock;
    let wrapped: any;

    beforeAll(() => {
        // Wrap the cloud function
        wrapped = testEnv.wrap(sendOnboardingEmail);
    });

    beforeEach(() => {
        jest.clearAllMocks();

        mockContactsCreate = jest.fn().mockResolvedValue({ data: { id: "contact_123" }, error: null });
        mockEmailsSend = jest.fn().mockResolvedValue({ data: { id: "email_123" }, error: null });

        (Resend as jest.Mock).mockImplementation(() => ({
            contacts: { create: mockContactsCreate },
            emails: { send: mockEmailsSend },
        }));

        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    afterAll(() => {
        testEnv.cleanup();
    });

    it("should exit early if no event data is provided", async () => {
        // Use testEnv to create a simulated event
        const event = { data: undefined };
        await wrapped(event);

        expect(console.error).toHaveBeenCalledWith("No data associated with the event.");
        expect(mockContactsCreate).not.toHaveBeenCalled();
        expect(mockEmailsSend).not.toHaveBeenCalled();
    });

    it("should exit early if no email is provided in the lead document", async () => {
        const snap = testEnv.firestore.makeDocumentSnapshot(
            { name: "Test User" },
            "leads/lead_123"
        );
        const event = { data: snap };
        await wrapped(event);

        expect(console.error).toHaveBeenCalledWith("No email provided in the lead document.");
        expect(mockContactsCreate).not.toHaveBeenCalled();
        expect(mockEmailsSend).not.toHaveBeenCalled();
    });

    it("should successfully add a contact and send an email", async () => {
        const snap = testEnv.firestore.makeDocumentSnapshot(
            { email: "test@example.com", name: "John Doe", interestTag: "WaaS Engine" },
            "leads/lead_123"
        );

        await wrapped({ data: snap });

        expect(mockContactsCreate).toHaveBeenCalledTimes(1);
        expect(mockContactsCreate).toHaveBeenCalledWith({
            audienceId: "adaa3729-2989-4815-97d2-017605a9f810",
            email: "test@example.com",
            firstName: "John",
            lastName: "Doe",
            unsubscribed: false,
        });

        expect(mockEmailsSend).toHaveBeenCalledTimes(1);
        expect(mockEmailsSend).toHaveBeenCalledWith(expect.objectContaining({
            to: "test@example.com",
            subject: "System Audit Initiated // Waitaminute Digital",
        }));
    });

    it("should use default audience ID if interestTag is not found in AUDIENCE_MAP", async () => {
        const snap = testEnv.firestore.makeDocumentSnapshot(
            { email: "test2@example.com", name: "Jane Smith", interestTag: "Unknown Tag" },
            "leads/lead_123"
        );

        await wrapped({ data: snap });

        expect(mockContactsCreate).toHaveBeenCalledWith(expect.objectContaining({
            audienceId: "adaa3729-2989-4815-97d2-017605a9f810",
        }));
    });

    it("should handle error when adding contact fails, but continue to send email", async () => {
        mockContactsCreate.mockResolvedValueOnce({ data: null, error: { message: "Contact creation failed" } });

        const snap = testEnv.firestore.makeDocumentSnapshot(
            { email: "test3@example.com", name: "Test User" },
            "leads/lead_123"
        );

        await wrapped({ data: snap });

        expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Failed to add test3@example.com to audience"), { message: "Contact creation failed" });
        expect(mockEmailsSend).toHaveBeenCalledTimes(1);
    });

    it("should handle exception when adding contact fails, but continue to send email", async () => {
        mockContactsCreate.mockRejectedValueOnce(new Error("Unexpected exception"));

        const snap = testEnv.firestore.makeDocumentSnapshot(
            { email: "test4@example.com", name: "Test User" },
            "leads/lead_123"
        );

        await wrapped({ data: snap });

        expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Unexpected exception adding test4@example.com to audience"), expect.any(Error));
        expect(mockEmailsSend).toHaveBeenCalledTimes(1);
    });

    it("should not retry on 400-level Resend errors when sending email", async () => {
        mockEmailsSend.mockResolvedValueOnce({ data: null, error: { name: "validation_error", message: "400 Bad Request" } });

        const snap = testEnv.firestore.makeDocumentSnapshot(
            { email: "test5@example.com" },
            "leads/lead_123"
        );

        await wrapped({ data: snap });

        expect(mockEmailsSend).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalledWith("Resend non-500 error:", { name: "validation_error", message: "400 Bad Request" });
    });

    it("should retry on 500-level Resend errors and succeed", async () => {
        mockEmailsSend
            .mockResolvedValueOnce({ data: null, error: { name: "internal_server_error", message: "500 Internal Server Error" } })
            .mockResolvedValueOnce({ data: { id: "email_retry_success" }, error: null });

        const snap = testEnv.firestore.makeDocumentSnapshot(
            { email: "test6@example.com" },
            "leads/lead_123"
        );

        await wrapped({ data: snap });

        expect(mockEmailsSend).toHaveBeenCalledTimes(2);
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("Resend 500-level error"));
    });

    it("should exhaust retries and fail if 500-level error persists", async () => {
        mockEmailsSend.mockResolvedValue({ data: null, error: { message: "502 Bad Gateway" } });

        const snap = testEnv.firestore.makeDocumentSnapshot(
            { email: "test7@example.com" },
            "leads/lead_123"
        );

        await wrapped({ data: snap });

        expect(mockEmailsSend).toHaveBeenCalledTimes(3); // maxRetries is 3
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Failed to send onboarding email to test7@example.com after 3 attempts."));
    }, 10000);

    it("should retry on unexpected exception during email send", async () => {
        mockEmailsSend
            .mockRejectedValueOnce(new Error("Network Error"))
            .mockResolvedValueOnce({ data: { id: "email_retry_success_2" }, error: null });

        const snap = testEnv.firestore.makeDocumentSnapshot(
            { email: "test8@example.com" },
            "leads/lead_123"
        );

        await wrapped({ data: snap });

        expect(mockEmailsSend).toHaveBeenCalledTimes(2);
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Unexpected exception during Resend API call"), expect.any(Error));
    });
});

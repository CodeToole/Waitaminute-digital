import "./index";
import { Resend } from "resend";

// Mock the defineSecret
jest.mock("firebase-functions/params", () => ({
    defineSecret: jest.fn().mockReturnValue({ value: () => "fake_api_key" }),
}));

// Mock the onDocumentCreated
jest.mock("firebase-functions/v2/firestore", () => ({
    onDocumentCreated: jest.fn((options, callback) => {
        (globalThis as any).documentCallback = callback;
        return jest.fn();
    }),
}));

// Mock Resend
jest.mock("resend");

describe("sendOnboardingEmail", () => {
    let mockContactsCreate: jest.Mock;
    let mockEmailsSend: jest.Mock;

    beforeEach(() => {
        // Reset all mocks before each test
        jest.clearAllMocks();

        // Setup mock implementations for Resend methods
        mockContactsCreate = jest.fn().mockResolvedValue({ data: { id: "contact_123" }, error: null });
        mockEmailsSend = jest.fn().mockResolvedValue({ data: { id: "email_123" }, error: null });

        (Resend as jest.Mock).mockImplementation(() => ({
            contacts: {
                create: mockContactsCreate,
            },
            emails: {
                send: mockEmailsSend,
            },
        }));

        // Mock console methods to avoid test output noise
        jest.spyOn(console, 'log').mockImplementation(() => {});
        jest.spyOn(console, 'error').mockImplementation(() => {});
        jest.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it("should exit early if no event data is provided", async () => {
        const event = { data: null };
        await (globalThis as any).documentCallback(event);

        expect(console.error).toHaveBeenCalledWith("No data associated with the event.");
        expect(mockContactsCreate).not.toHaveBeenCalled();
        expect(mockEmailsSend).not.toHaveBeenCalled();
    });

    it("should exit early if no email is provided in the lead document", async () => {
        const event = { data: { data: () => ({ name: "Test User" }) } };
        await (globalThis as any).documentCallback(event);

        expect(console.error).toHaveBeenCalledWith("No email provided in the lead document.");
        expect(mockContactsCreate).not.toHaveBeenCalled();
        expect(mockEmailsSend).not.toHaveBeenCalled();
    });

    it("should successfully add a contact and send an email", async () => {
        const event = {
            data: {
                data: () => ({
                    email: "test@example.com",
                    name: "John Doe",
                    interestTag: "WaaS Engine"
                })
            }
        };

        await (globalThis as any).documentCallback(event);

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
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Successfully added test@example.com to audience"));
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Successfully sent Day 1 onboarding email to test@example.com via Resend"));
    });

    it("should use default audience ID if interestTag is not found in AUDIENCE_MAP", async () => {
        const event = {
            data: {
                data: () => ({
                    email: "test2@example.com",
                    name: "Jane Smith",
                    interestTag: "Unknown Tag"
                })
            }
        };

        await (globalThis as any).documentCallback(event);

        expect(mockContactsCreate).toHaveBeenCalledWith(expect.objectContaining({
            audienceId: "adaa3729-2989-4815-97d2-017605a9f810", // WAAS_LEADS_AUDIENCE_ID
        }));
    });

    it("should handle error when adding contact fails, but continue to send email", async () => {
        mockContactsCreate.mockResolvedValueOnce({ data: null, error: { message: "Contact creation failed" } });

        const event = {
            data: {
                data: () => ({
                    email: "test3@example.com",
                    name: "Test User",
                })
            }
        };

        await (globalThis as any).documentCallback(event);

        expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Failed to add test3@example.com to audience"), { message: "Contact creation failed" });
        expect(mockEmailsSend).toHaveBeenCalledTimes(1);
    });

    it("should handle Resend API error for contact creation", async () => {
        mockContactsCreate.mockResolvedValueOnce({ data: null, error: { message: "Error" } });

        const event = {
            data: {
                data: () => ({ email: "test-contact-error@example.com", name: "User" })
            }
        };

        await (globalThis as any).documentCallback(event);

        expect(console.error).toHaveBeenCalledWith(
            expect.stringContaining("Failed to add test-contact-error@example.com to audience"),
            { message: "Error" }
        );
    });

    it("should handle successful contact creation with missing contactData id", async () => {
        mockContactsCreate.mockResolvedValueOnce({ data: null, error: null });

        const event = {
            data: {
                data: () => ({ email: "test-nodata@example.com" })
            }
        };

        await (globalThis as any).documentCallback(event);

        expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Successfully added test-nodata@example.com to audience"));
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Contact ID: undefined"));
    });

    it("should test Resend API client throwing an error during contact creation", async () => {
        mockContactsCreate.mockRejectedValueOnce(new Error("Resend API client exception"));

        const event = {
            data: {
                data: () => ({
                    email: "test4@example.com",
                    name: "Test User",
                })
            }
        };

        await (globalThis as any).documentCallback(event);

        expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Unexpected exception adding test4@example.com to audience"), expect.any(Error));
        expect(mockEmailsSend).toHaveBeenCalledTimes(1);
    });

    it("should not retry on 400-level Resend errors when sending email", async () => {
        mockEmailsSend.mockResolvedValueOnce({ data: null, error: { name: "validation_error", message: "400 Bad Request" } });

        const event = {
            data: {
                data: () => ({ email: "test5@example.com" })
            }
        };

        await (globalThis as any).documentCallback(event);

        expect(mockEmailsSend).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalledWith("Resend non-500 error:", { name: "validation_error", message: "400 Bad Request" });
    });

    it("should retry on 500-level Resend errors and succeed", async () => {
        mockEmailsSend
            .mockResolvedValueOnce({ data: null, error: { name: "internal_server_error", message: "500 Internal Server Error" } })
            .mockResolvedValueOnce({ data: { id: "email_retry_success" }, error: null });

        const event = {
            data: {
                data: () => ({ email: "test6@example.com" })
            }
        };

        await (globalThis as any).documentCallback(event);

        expect(mockEmailsSend).toHaveBeenCalledTimes(2);
        expect(console.warn).toHaveBeenCalledWith(expect.stringContaining("Resend 500-level error"));
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Successfully sent Day 1 onboarding email"));
    });

    it("should exhaust retries and fail if 500-level error persists", async () => {
        mockEmailsSend.mockResolvedValue({ data: null, error: { message: "502 Bad Gateway" } });

        const event = {
            data: {
                data: () => ({ email: "test7@example.com" })
            }
        };

        await (globalThis as any).documentCallback(event);

        expect(mockEmailsSend).toHaveBeenCalledTimes(3); // maxRetries is 3
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Failed to send onboarding email to test7@example.com after 3 attempts."));
    }, 10000); // increase timeout due to delay in retries

    it("should not retry on 400-level Resend errors without an error name or message", async () => {
        mockEmailsSend.mockResolvedValueOnce({ data: null, error: {} });

        const event = {
            data: {
                data: () => ({ email: "test-no-errordata@example.com" })
            }
        };

        await (globalThis as any).documentCallback(event);

        expect(mockEmailsSend).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenCalledWith("Resend non-500 error:", {});
    });

    it("should handle successful email send with missing data id", async () => {
        mockEmailsSend.mockResolvedValueOnce({ data: null, error: null });

        const event = {
            data: {
                data: () => ({ email: "test-success-nodata@example.com" })
            }
        };

        await (globalThis as any).documentCallback(event);

        expect(mockEmailsSend).toHaveBeenCalledTimes(1);
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Successfully sent Day 1 onboarding email"));
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining("ID: undefined"));
    });

    it("should retry on unexpected exception during email send", async () => {
        mockEmailsSend
            .mockRejectedValueOnce(new Error("Network Error"))
            .mockResolvedValueOnce({ data: { id: "email_retry_success_2" }, error: null });

        const event = {
            data: {
                data: () => ({ email: "test8@example.com" })
            }
        };

        await (globalThis as any).documentCallback(event);

        expect(mockEmailsSend).toHaveBeenCalledTimes(2);
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Unexpected exception during Resend API call"), expect.any(Error));
        expect(console.log).toHaveBeenCalledWith(expect.stringContaining("Successfully sent Day 1 onboarding email"));
    });

    it("should exhaust retries and fail if unexpected exception persists", async () => {
        mockEmailsSend.mockRejectedValue(new Error("Persistent Network Error"));

        const event = {
            data: {
                data: () => ({ email: "test9@example.com" })
            }
        };

        await (globalThis as any).documentCallback(event);

        expect(mockEmailsSend).toHaveBeenCalledTimes(3); // maxRetries is 3
        expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Failed to send onboarding email to test9@example.com after 3 attempts."));
    }, 10000);
});

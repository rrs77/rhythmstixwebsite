const MAILCHIMP_API_KEY = process.env.MAILCHIMP_API_KEY || "";
const MAILCHIMP_LIST_ID = process.env.MAILCHIMP_LIST_ID || "";

function getServerPrefix(): string {
  const parts = MAILCHIMP_API_KEY.split("-");
  return parts[parts.length - 1] || "us1";
}

function getBaseUrl(): string {
  return `https://${getServerPrefix()}.api.mailchimp.com/3.0`;
}

function getAuthHeader(): string {
  return `Basic ${Buffer.from(`anystring:${MAILCHIMP_API_KEY}`).toString("base64")}`;
}

export function isMailchimpConfigured(): boolean {
  return !!(MAILCHIMP_API_KEY && MAILCHIMP_LIST_ID);
}

export async function subscribeToMailchimp(
  email: string,
  firstName?: string,
  lastName?: string,
  tags?: string[]
): Promise<{ success: boolean; error?: string }> {
  if (!isMailchimpConfigured()) {
    return { success: false, error: "Mailchimp not configured" };
  }

  try {
    const crypto = await import("crypto");
    const subscriberHash = crypto
      .createHash("md5")
      .update(email.toLowerCase())
      .digest("hex");

    const response = await fetch(
      `${getBaseUrl()}/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}`,
      {
        method: "PUT",
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email_address: email,
          status_if_new: "subscribed",
          status: "subscribed",
          merge_fields: {
            ...(firstName ? { FNAME: firstName } : {}),
            ...(lastName ? { LNAME: lastName } : {}),
          },
        }),
      }
    );

    if (response.ok) {
      if (tags && tags.length > 0) {
        await fetch(
          `${getBaseUrl()}/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}/tags`,
          {
            method: "POST",
            headers: {
              Authorization: getAuthHeader(),
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              tags: tags.map((t) => ({ name: t, status: "active" })),
            }),
          }
        );
      }
      return { success: true };
    }

    const data = (await response.json()) as any;
    return { success: false, error: data.detail || "Subscription failed" };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error" };
  }
}

export async function unsubscribeFromMailchimp(
  email: string
): Promise<{ success: boolean; error?: string }> {
  if (!isMailchimpConfigured()) {
    return { success: false, error: "Mailchimp not configured" };
  }

  try {
    const crypto = await import("crypto");
    const subscriberHash = crypto
      .createHash("md5")
      .update(email.toLowerCase())
      .digest("hex");

    const response = await fetch(
      `${getBaseUrl()}/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}`,
      {
        method: "PATCH",
        headers: {
          Authorization: getAuthHeader(),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "unsubscribed" }),
      }
    );

    if (response.ok) {
      return { success: true };
    }

    const data = (await response.json()) as any;
    return { success: false, error: data.detail || "Unsubscribe failed" };
  } catch (err: any) {
    return { success: false, error: err.message || "Network error" };
  }
}

export async function getSubscriptionStatus(
  email: string
): Promise<{ subscribed: boolean; error?: string }> {
  if (!isMailchimpConfigured()) {
    return { subscribed: false, error: "Mailchimp not configured" };
  }

  try {
    const crypto = await import("crypto");
    const subscriberHash = crypto
      .createHash("md5")
      .update(email.toLowerCase())
      .digest("hex");

    const response = await fetch(
      `${getBaseUrl()}/lists/${MAILCHIMP_LIST_ID}/members/${subscriberHash}`,
      {
        headers: { Authorization: getAuthHeader() },
      }
    );

    if (!response.ok) {
      return { subscribed: false };
    }

    const data = (await response.json()) as any;
    return { subscribed: data.status === "subscribed" };
  } catch {
    return { subscribed: false };
  }
}

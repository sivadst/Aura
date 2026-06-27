import { google, calendar_v3 } from "googleapis";
import { prisma } from "@/lib/prisma";

export class GoogleCalendarService {
  private oauth2Client: any;
  private calendar: calendar_v3.Calendar;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/calendar/callback`
    );
    this.calendar = google.calendar({ version: "v3", auth: this.oauth2Client });
  }

  async getAuthUrl(userId: string, organizationId: string): Promise<string> {
    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: [
        "https://www.googleapis.com/auth/calendar",
        "https://www.googleapis.com/auth/calendar.events",
      ],
      prompt: "consent",
      state: Buffer.from(JSON.stringify({ userId, organizationId })).toString("base64"),
    });
  }

  async handleCallback(code: string, state: string) {
    const { userId, organizationId } = JSON.parse(Buffer.from(state, "base64").toString());
    const { tokens } = await this.oauth2Client.getToken(code);

    await prisma.calendarAccount.upsert({
      where: { userId },
      create: {
        userId,
        organizationId,
        provider: "google",
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token!,
        expiryDate: new Date(tokens.expiry_date!),
        email: "", // We could fetch it from user info API, but it's optional here.
      },
      update: {
        accessToken: tokens.access_token!,
        refreshToken: tokens.refresh_token || undefined,
        expiryDate: new Date(tokens.expiry_date!),
      },
    });

    return { success: true };
  }

  private async refreshTokenIfNeeded(account: any) {
    if (new Date() >= account.expiryDate) {
      this.oauth2Client.setCredentials({
        refresh_token: account.refreshToken,
      });
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      
      await prisma.calendarAccount.update({
        where: { id: account.id },
        data: {
          accessToken: credentials.access_token!,
          expiryDate: new Date(credentials.expiry_date!),
        },
      });
      
      this.oauth2Client.setCredentials(credentials);
    } else {
      this.oauth2Client.setCredentials({
        access_token: account.accessToken,
        refresh_token: account.refreshToken,
      });
    }
  }

  async getFreeSlots(
    userId: string,
    options: {
      durationMinutes: number;
      daysAhead?: number;
      startHour?: number;
      endHour?: number;
    }
  ): Promise<Date[]> {
    const account = await prisma.calendarAccount.findUnique({
      where: { userId },
    });

    if (!account) throw new Error("Calendar not connected");

    await this.refreshTokenIfNeeded(account);

    const { durationMinutes = 30, daysAhead = 14, startHour = 9, endHour = 17 } = options;

    const timeMin = new Date();
    const timeMax = new Date();
    timeMax.setDate(timeMax.getDate() + daysAhead);

    const response = await this.calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        items: [{ id: "primary" }],
      },
    });

    const busySlots = response.data.calendars?.primary?.busy || [];
    
    // Generate candidate slots (skipping weekends)
    const slots: Date[] = [];
    const candidate = new Date(timeMin);
    candidate.setMinutes(0, 0, 0);

    while (candidate < timeMax) {
      const day = candidate.getDay();
      const hour = candidate.getHours();

      // Skip weekends
      if (day !== 0 && day !== 6) {
        // Within business hours
        if (hour >= startHour && hour < endHour) {
          // Check if slot is free
          const slotEnd = new Date(candidate.getTime() + durationMinutes * 60000);
          const isBusy = busySlots.some(busy => {
            const busyStart = new Date(busy.start!);
            const busyEnd = new Date(busy.end!);
            return candidate < busyEnd && slotEnd > busyStart;
          });

          if (!isBusy) {
            slots.push(new Date(candidate));
            if (slots.length >= 3) break; // Return top 3
          }
        }
      }

      candidate.setMinutes(candidate.getMinutes() + 30);
    }

    return slots;
  }

  async createEvent(
    userId: string,
    event: {
      summary: string;
      description?: string;
      startTime: Date;
      endTime: Date;
      attendees?: string[];
      location?: string;
    }
  ) {
    const account = await prisma.calendarAccount.findUnique({
      where: { userId },
    });

    if (!account) throw new Error("Calendar not connected");

    await this.refreshTokenIfNeeded(account);

    const response = await this.calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: { dateTime: event.startTime.toISOString() },
        end: { dateTime: event.endTime.toISOString() },
        attendees: event.attendees?.map(email => ({ email })),
        location: event.location,
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 1440 }, // 24 hours
            { method: "popup", minutes: 15 },
          ],
        },
      },
      sendUpdates: "all", // Send invites to attendees
    });

    return {
      eventId: response.data.id!,
      htmlLink: response.data.htmlLink!,
      meetLink: response.data.hangoutLink!,
    };
  }
}

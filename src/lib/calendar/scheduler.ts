import { logger } from "../logger";

export function suggestMeetingTimes(
  preferredDays: number = 3,
  timezone: string = "America/New_York"
): string[] {
  const times: string[] = [];
  const now = new Date();
  
  for (let i = 1; i <= preferredDays; i++) {
    const date = new Date(now);
    date.setDate(date.getDate() + i);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    const dateStr = date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
    
    times.push(`${dateStr} at 10:00 AM ${timezone}`);
    times.push(`${dateStr} at 2:00 PM ${timezone}`);
  }
  
  return times.slice(0, 3);
}

export function generateMeetingLink(): string {
  // Placeholder — integrate Calendly or Google Calendar API later
  return `https://calendly.com/your-link/${Date.now()}`;
}

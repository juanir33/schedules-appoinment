import { CreateReservation } from "@/src/lib/firestore/types/createReservation.type";
import { google } from "googleapis";
import { NextResponse } from "next/server";


export async function POST(request: Request) {
  const body : CreateReservation = await request.json();
  const {client, service, reservationDate} = body
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!
  );

  oAuth2Client.setCredentials({ refresh_token: process.env.GOOGLE_REFRESH_TOKEN! });

  const calendar = google.calendar({ version: "v3", auth: oAuth2Client });

  await calendar.events.insert({
    calendarId: 'primary',
    requestBody: {
      summary: `${service} - ${client}`,
      start: { dateTime: new Date(reservationDate).toISOString() },
      end: { dateTime: new Date(new Date(reservationDate).getTime() + 60 * 60 * 1000).toISOString() },
    },
  });

  return NextResponse.json({ success: true });
}

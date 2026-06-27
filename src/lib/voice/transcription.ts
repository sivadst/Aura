import OpenAI from "openai";
import { prisma } from "@/lib/prisma";
import fs from "fs";

const openai = new OpenAI();

export class MeetingTranscriptionService {
  static async startRecording(organizationId: string, calendarEventId: string) {
    // In a real implementation, you would call a bot API (like Recall.ai, Zoom API) to join the meeting.
    // For this prototype, we'll simulate the creation of a recording entity.
    
    return prisma.meetingRecording.upsert({
      where: { calendarEventId },
      create: {
        organizationId,
        calendarEventId,
        status: "recording",
        keyTopics: [],
        actionItems: [],
        sentiment: {},
        talkRatio: {},
        riskFlags: [],
        nextSteps: [],
      },
      update: {
        status: "recording",
      },
    });
  }

  static async processRecording(recordingId: string, audioFilePath: string) {
    await prisma.meetingRecording.update({
      where: { id: recordingId },
      data: { status: "processing" },
    });

    try {
      // Simulate transcription with OpenAI Whisper if a real file is provided
      // Since this is a prototype and we might not have a real file, we provide a fallback mock
      let transcriptText = "";
      
      if (fs.existsSync(audioFilePath)) {
        const transcription = await openai.audio.transcriptions.create({
          file: fs.createReadStream(audioFilePath),
          model: "whisper-1",
        });
        transcriptText = transcription.text;
      } else {
        // Mock transcript for demonstration
        transcriptText = `
          Rep: Hi John, thanks for joining. How are you?
          Prospect: Good, thanks. We are looking for a solution to automate our sales follow-ups.
          Rep: Great. Our platform does exactly that. What is your timeline and budget?
          Prospect: We hope to launch in Q3. Budget is around 50k, but we are worried about implementation time.
          Rep: Implementation takes about 2 weeks. I can send over a detailed timeline.
          Prospect: That sounds perfect. Please send it over. Let's touch base next Tuesday.
        `;
      }

      await prisma.meetingRecording.update({
        where: { id: recordingId },
        data: { transcription: transcriptText },
      });

      return await this.analyzeTranscript(recordingId, transcriptText);
    } catch (error) {
      console.error("Transcription error:", error);
      await prisma.meetingRecording.update({
        where: { id: recordingId },
        data: { status: "failed" },
      });
      throw error;
    }
  }

  static async analyzeTranscript(recordingId: string, transcript: string) {
    const prompt = `
      Analyze the following sales meeting transcript. Provide a JSON response with exactly this structure:
      {
        "summary": "2-3 sentence summary",
        "keyTopics": ["topic1", "topic2"],
        "actionItems": [{"text": "action", "assignee": "Rep/Prospect", "dueDate": "if mentioned", "completed": false}],
        "sentiment": {"overall": "positive/neutral/negative", "breakdown": ["list of emotional shifts"]},
        "talkRatio": {"salesRep": 0.5, "prospect": 0.5},
        "dealInsights": "Insight into the deal health",
        "riskFlags": ["risk1", "risk2"],
        "nextSteps": ["step1", "step2"]
      }
      
      Transcript:
      ${transcript}
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
    });

    const analysis = JSON.parse(completion.choices[0].message.content || "{}");

    const updated = await prisma.meetingRecording.update({
      where: { id: recordingId },
      data: {
        summary: analysis.summary,
        keyTopics: analysis.keyTopics || [],
        actionItems: analysis.actionItems || [],
        sentiment: analysis.sentiment || {},
        talkRatio: analysis.talkRatio || {},
        dealInsights: analysis.dealInsights,
        riskFlags: analysis.riskFlags || [],
        nextSteps: analysis.nextSteps || [],
        status: "completed",
        processedAt: new Date(),
      },
    });

    return updated;
  }
}

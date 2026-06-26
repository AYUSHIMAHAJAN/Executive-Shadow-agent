export interface MessySample {
  name: string;
  category: "Email" | "Syllabus" | "Launch" | "Voice Adjustment";
  description: string;
  text: string;
}

export const MESSY_SAMPLES: MessySample[] = [
  {
    name: "Urgent Release Forwarded Mail",
    category: "Email",
    description: "Messy email thread about a Friday mobile lunch release containing scattered deadlines.",
    text: `From: harris.vp@executive.com
Subject: Fwd: CRITICAL Release blockers before Friday 5 PM

Let's coordinate immediately. I see a few key things that are blocking our launch on Friday.
We need to do the following in order:
1. First, we need to inspect the API server logs for the memory leak reported last night. This is key. It'll probably take about 45 minutes.
2. Sarah says the checkout screen loading is still slow. We must optimize the Redux store state selectors. Budget 60 minutes for this.
3. Then, draft the launch announcement and push it into the Slack PR channel. Budget 30 mins, but this is a high priority as marketing needs to review it early.
4. Finally, complete the end-to-end integration checklist before deploying to production. This always takes a good 75 minutes.

Make sure dependencies are respected. Also note that Harris needs to approve the PR copy at least 2 hours before the 5 PM Friday deadline!`
  },
  {
    name: "Midterm Paper Plan",
    category: "Syllabus",
    description: "Syllabus requirements with multiple deliverables and staggered tasks.",
    text: `CS101 Midterm Syllabus & Writing Plan.
The draft paper is due Wednesday by 6:00 PM.
We need to outline the thesis, collect 4 academic sources, write the introductory chapter, draft the method details, compose results, and proofread.
- Collection of sources must happen first (takes 90 mins).
- Outlining thesis based on sources takes 45 mins.
- Drafting intro and method chapters: 120 mins.
- Composing results from our raw lab sheet: 60 mins.
- Peer review with John before final draft is due: 45 mins (low priority but helpful).
- Proofreading and formatting citations: 30 mins.`
  },
  {
    name: "Product Hunt Launch Brief",
    category: "Launch",
    description: "A fast-paced startup brief with tight tasks before a launch.",
    text: `Product Hunt is scheduled for Tuesday morning at 8:00 AM!
All hands on deck!
- Let's finalize the high-res marketing screenshots (90 mins). This is high priority.
- Draft the maker first comment answering FAQ (30 mins).
- Sync with our hunters to verify the preview link works (20 mins).
- Create a list of 20 direct support channels for outreach (120 mins).
- Set up active monitoring dashboards for server health (45 mins).`
  },
  {
    name: "Voice: Emergency Postponement",
    category: "Voice Adjustment",
    description: "Live voice feedback asking the Executive Shadow to shift the calendar.",
    text: `Draft transcript: "Wait, I am totally stuck on the checkout optimization task. Postpone the QA checklist task by 90 minutes, push the rest of my schedule after 2 PM to accommodate, and let's make sure high priority tasks are preserved. Execute this shift now."`
  }
];

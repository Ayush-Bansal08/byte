import { describe, expect, it } from 'vitest';
import { offlineAnswer } from '@/lib/ai/answer';
import { AskRequest } from '@/lib/ai/schema';

/**
 * What a visitor actually asks, and what Byte must say even with no AI model at all.
 * Each answer has to be on topic (pattern) and honest about what it doesn't know (found).
 */
const CASES: [question: string, mustMatch: RegExp, found?: boolean][] = [
  ['what is his name', /Ayush Bansal/],
  ['who is ayush', /LNMIIT/],
  ['what does he do', /backend systems, cloud platforms and AI agents/],
  ['is he a good engineer?', /systems that check their own work/],
  ['why should we hire him', /SAKA.*Helios.*Finn/],
  ['what programming languages does he know', /TypeScript.*Python.*Go/],
  ['does he know python', /^Yes\. He has used Python in .*DockHealer/],
  ['does he know react', /^Yes\. He has used React in SAKA/],
  ['does he know golang', /^Yes\. He has used Go in Helios/],
  ['has he used aws', /AWS isn’t in his verified projects or résumé/, false],
  ['does he know rust?', /isn’t in his verified projects or résumé/, false],
  ['what is SAKA', /^SAKA: .*Telegram/],
  ['how does helios work', /25% → 50% → 75% → 100%/],
  ['what is dockhealer', /^DockHealer: /],
  ['explain pollforge', /^PollForge: /],
  ['what was the bug in som gold', /training bug/],
  ['what did he do at finn', /25\+ PRs/],
  ['how many pull requests did he merge', /25\+/],
  ['what is his gpa', /Grades are not published/],
  ['is he available', /internships/],
  ['what is his email', /ab262133@gmail\.com/],
  ['where can i see his resume', /résumé page/],
  ['what is a canary release', /small share of users/],
  ['what is an MCP server', /Model Context Protocol/],
  ['does saka trade while i sleep?', /unprompted|nine detectors/],
  ['which project is the most impressive', /SAKA/],
  ['has he worked in a team', /team hackathon entry/],
  ['how old is he', /hasn’t shared/],
  ['what is the weather today', /don't have verified information/, false],
];

describe('Byte answers common questions correctly, even offline', () => {
  for (const [q, re, found = true] of CASES) {
    it(q, () => {
      const r = offlineAnswer(AskRequest.parse({ question: q, context: { path: '/' } }));
      expect(r.answer).toMatch(re);
      expect(r.found).toBe(found);
    });
  }
});

describe('page context helps but never hijacks', () => {
  const on = (question: string, project: string) => offlineAnswer(AskRequest.parse({ question, context: { path: `/work/${project}`, project } }));
  it('"How does this work?" on DockHealer explains the DockHealer pipeline', () => {
    expect(on('How does this work?', 'dockhealer').answer).toMatch(/Validate → Build → Smoke test/);
  });
  it('"How can I contact him?" on Helios is about contact, not Helios', () => {
    expect(on('How can I contact him?', 'helios').answer).toMatch(/ab262133@gmail\.com/);
  });
  it('"What was his role?" on Helios is about his Helios role', () => {
    expect(on('What was his role?', 'helios').answer).toMatch(/Helios/);
  });
});

describe('specific beats generic', () => {
  it('a Kubernetes question gets the Kubernetes answer, not the generic project list', () => {
    const r = offlineAnswer(AskRequest.parse({ question: 'Which of his projects would matter most to a team running Kubernetes in production, and why?', context: { path: '/' } }));
    expect(r.answer).toMatch(/Helios/);
    expect(r.answer).not.toMatch(/^Five featured projects/);
  });
  it('"What are his projects?" still lists them', () => {
    expect(offlineAnswer(AskRequest.parse({ question: 'What are his projects?', context: { path: '/' } })).answer).toMatch(/^Five featured projects/);
  });
});

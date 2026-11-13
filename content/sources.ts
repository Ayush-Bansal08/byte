/**
 * Every public claim on the site points at one or more of these sources.
 * Byte's answers may only cite IDs from this list; URLs are resolved server-side,
 * so a model can never inject a link.
 */
export type Source = {
  id: string;
  title: string;
  url: string | null; // null = private document (résumé) not linkable as a URL
  kind: 'resume' | 'repo' | 'showcase' | 'demo' | 'video' | 'profile' | 'paper';
};

export const SOURCES = [
  { id: 'resume', title: 'Résumé (Nov 2026)', url: '/resume', kind: 'resume' },
  { id: 'gh-profile', title: 'GitHub profile README', url: 'https://github.com/Ayush-Bansal08', kind: 'profile' },
  { id: 'linkedin', title: 'LinkedIn', url: 'https://www.linkedin.com/in/ayush-bansal-21b12a311/', kind: 'profile' },
  { id: 'saka-showcase', title: 'SAKA on ETHGlobal Showcase', url: 'https://ethglobal.com/showcase/saka-defi-ai-agent-gbb53', kind: 'showcase' },
  { id: 'saka-repo', title: 'SAKA repository', url: 'https://github.com/Ayush-Bansal08/SAKA', kind: 'repo' },
  { id: 'saka-demo', title: 'SAKA live demo', url: 'https://saka-rust.vercel.app', kind: 'demo' },
  { id: 'saka-video', title: 'SAKA demo video', url: 'https://drive.google.com/file/d/1f1BYpQFaRfzk45dL3RWnMTBC9i1DfED1/view', kind: 'video' },
  { id: 'saka-x', title: '0G Labs announcement on X', url: 'https://x.com/0G_labs/status/2119056021511627221', kind: 'showcase' },
  { id: 'saka-mcp', title: 'uniswap-agent-mcp plugin (fork of Uniswap/uniswap-ai)', url: 'https://github.com/Ayush-Bansal08/uniswap-ai/tree/feat/uniswap-agent-mcp/packages/plugins/uniswap-agent-mcp', kind: 'repo' },
  { id: 'helios-repo', title: 'Helios repository (k8s-project)', url: 'https://github.com/Ayush-Bansal08/k8s-project', kind: 'repo' },
  { id: 'helios-operator', title: 'Helios PreviewEnvironment controller (Go)', url: 'https://github.com/Ayush-Bansal08/k8s-project/blob/main/operator/internal/controller/previewenvironment_controller.go', kind: 'repo' },
  { id: 'helios-video', title: 'Helios video walkthrough', url: 'https://drive.google.com/file/d/14-x45ra9iRBMOevZ0CqfLridM_HQqiSa/view?usp=sharing', kind: 'video' },
  { id: 'dockhealer-repo', title: 'DockHealer repository', url: 'https://github.com/Ayush-Bansal08/Dockhealer', kind: 'repo' },
  { id: 'dockhealer-eval', title: 'DockHealer evaluation protocol', url: 'https://github.com/Ayush-Bansal08/Dockhealer/blob/main/docs/EVAL_PROTOCOL.md', kind: 'repo' },
  { id: 'pollforge-repo', title: 'PollForge repository', url: 'https://github.com/Ayush-Bansal08/PollForge', kind: 'repo' },
  { id: 'pollforge-video', title: 'PollForge demo video', url: 'https://drive.google.com/file/d/1pVh277Bao5hEftS_H58uTEaM6GU1tDl0/view?usp=sharing', kind: 'video' },
  { id: 'som-repo', title: 'SOM-Gold research repository (UNSW)', url: 'https://github.com/sydney-machine-learning/remotesensing-SOM', kind: 'repo' },
  { id: 'som-citation', title: 'SOM-Gold paper citation (under review)', url: 'https://github.com/sydney-machine-learning/remotesensing-SOM#paper-citation', kind: 'paper' },
] as const satisfies readonly Source[];

export type SourceId = (typeof SOURCES)[number]['id'];

export const SOURCE_BY_ID: Record<SourceId, Source> = Object.fromEntries(
  SOURCES.map((s) => [s.id, s]),
) as Record<SourceId, Source>;

export function isSourceId(id: string): id is SourceId {
  return id in SOURCE_BY_ID;
}

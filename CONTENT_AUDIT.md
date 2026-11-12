# Content audit

Every claim on the site, where it comes from, and what needs Ayush's confirmation. Primary source: the résumé (Nov 2026). Supporting: GitHub repositories and profile README, the ETHGlobal showcase.

## Needs your confirmation

| # | Item | Why | What the site does now |
|---|---|---|---|
| 1 | **SOM-Gold paper status** | Résumé says "published research paper"; the research repo's citation says **"Under review"** (authors: Cheng Wang, Ayush Bansal, Ehsan Farahbakhsh, Rohitash Chandra) | Says "co-author, under review" |
| 2 | **SAKA team members and split of work** | Showcase lists no team; all 41 public commits are under your account; you described it as "our project" | Calls it a team project and claims only what commits show |
| 3 | **LNMHacks project name** | Résumé gives placement but not the project; a local folder `flashevent_lnmhacks_project` (FlashEvent Markets) suggests it, but nothing public links them | Names no project |
| 4 | **PollForge chaos testing / pod-termination test** | In the résumé, not in the repository README | Attributed to the résumé ("per the résumé") |
| 5 | **Résumé contact links** | Résumé text shows `linkedin.com/in/ayush` and `github.com/ayush`; your profile README links `linkedin.com/in/ayush-bansal-21b12a311` and `github.com/Ayush-Bansal08` | Uses the profile README links |
| 6 | **About section voice** | Written from your projects, not your own words | Please edit `content/profile.ts` → `about` |
| 7 | **Résumé PDF** | Attached in chat, not in the workspace | Add `public/resume.pdf` to enable the download button |
| 8 | **Phone number** | On the résumé | Deliberately not published |

## Verified claims

| Claim | Source(s) |
|---|---|
| B.Tech ECE, LNMIIT Jaipur, Aug 2024 – Jun 2028 | Résumé |
| ETHGlobal Mumbai 2026: 2nd place, 0G "Build with 0G Private Computer" track, $1,500, for SAKA | Showcase (prize), résumé ($1,500) |
| LNMHacks 8.0 (Jan 2026): partner prize $600, 1st in Viral Consumer Apps, 500+ participants | Résumé, profile README |
| Finn (Airforge Tech), SWE intern, May–Jul 2026, Bengaluru: 25+ merged PRs across 5+ services; LLM agent workflows, APIs, event-driven workflows; Docker/K8s/Nginx deploys twice weekly | Résumé, profile README |
| UNSW Sydney AI/ML research intern (remote), May–Aug 2026, under Dr. Rohitash Chandra: recall 0% → 76.6%; 8 bugs (Cohen's κ, AE masks, unseeded RNGs); ground truth rebuilt from public WFS; McNemar/sweeps/ablations; SOM beats k-means | Résumé, profile README, research repo |
| SAKA: pipeline (prepare → score → simulate → guard → policy → execute → log), 0G planner/guard/explainer, 16-tool unsigned-only Uniswap MCP server, Privy policy wallets, passkeys, 9 autopilot detectors, 600+ Vitest tests, planner eval 32/35, testnet-only execution | Showcase, repository README |
| SAKA screenshots | Repository (`docs/ui-revamp/screenshots/after/`, MIT), labelled "mock data" as in the repo |
| Helios: Go/Kubebuilder operator, ArgoCD, canary 25→50→75→100 gated on ≥95% success (4 checks, 20 s), HPA 1→10 under 100 VUs, Kyverno/Falco/Trivy, Chaos Mesh, k3s on Azure (VM stopped when idle), debugging incidents | Repository README, résumé |
| DockHealer: 16-rule validator (7+9), 22 failure classes (13+9), bounded loop, hardened smoke container, 186 tests, Terraform VM (/32 NSG), evaluation results **not yet published** | Repository README, résumé |
| PollForge: Flask → Redis → .NET → PostgreSQL → Node/Socket.IO; AKS + ACR; OIDC GitHub Actions; cert-manager; ServiceMonitor; LPOP message-loss limitation | Repository README, résumé |

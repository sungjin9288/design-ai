---
name: design-pr-review
description: Review a GitHub pull request for design-system compliance and produce a cited, structured verdict with a manual fallback. Use when a user asks for design-focused PR review or approval guidance.
---

Open and follow [PLAYBOOK.md](PLAYBOOK.md) as the executable workflow. Load only the linked sources relevant to the task, and complete its verification and done criteria before reporting completion.

Links in PLAYBOOK.md are relative to this skill's real directory inside the design-ai checkout. When the skill is installed through a symlink (for example by `install.sh`) and a linked file does not resolve, run `realpath` on this skill's directory and resolve the links from that path.

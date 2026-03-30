---
description: Complete a security review of the pending changes on the current branch. High-confidence vulnerabilities only.
allowed-tools: Bash(git diff:*), Bash(git status:*), Bash(git log:*), Bash(git show:*), Bash(grep:*), Read, Glob, Grep
---

@../../agents/security-reviewer.md

GIT STATUS:
```
!`git status`
```

FILES MODIFIED:
```
!`git diff --name-only origin/HEAD...`
```

COMMITS:
```
!`git log --no-decorate origin/HEAD...`
```

DIFF CONTENT:
```
!`git diff --merge-base origin/HEAD`
```

Review the complete diff above and follow the analysis methodology in the security-reviewer agent.

Begin in 3 steps:
1. Use a sub-task to identify vulnerabilities — explore codebase context, then analyse the diff
2. For each vulnerability, create a parallel sub-task to filter false positives using the EXCLUSIONS list
3. Filter out any finding below 0.8 confidence

Your final reply must contain only the markdown security report.

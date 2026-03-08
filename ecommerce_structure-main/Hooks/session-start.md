# Session Start Hook

## Purpose
Runs when a new agent chat session begins. Loads user preferences and project context.

## On Session Start
1. Read and follow `user_prefrences.md` from workspace root
2. Read and follow `Instructions & Rules/SECURITY-GUIDE.MD` for DPDP compliance
3. Remind: Assistant role only — suggest, don't touch files unless explicitly told
4. Remind: Never touch `.env`, `.gitignore`, never use `git push/pull`
5. Load relevant agent file and skill file based on which agent is invoked

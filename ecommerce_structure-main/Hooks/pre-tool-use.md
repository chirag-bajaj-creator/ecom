# Pre-Tool Use Hook

## Purpose
Runs before the agent uses any tool (file edit, terminal command, etc.) to enforce safety rules.

## Rules to Enforce
1. **BLOCK** any edit to `.env` or `.gitignore` files
2. **BLOCK** any terminal command containing `git push`, `git pull`, `git force`, `git reset --hard`
3. **BLOCK** any `rm -rf` or `Remove-Item -Recurse` on project root
4. **WARN** if agent tries to edit a file without user explicitly saying "edit", "write", "make", "create", "update", "change", "fix"

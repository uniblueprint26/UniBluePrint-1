# Deploy the 8 Foundation generator functions

These eight functions now read the new detail answers (`additional_detail`). They are edited in the repo but not yet live. Deploy them once. Their JWT check stays on (the default).

Functions: generate-application-answers, generate-cover-letter, generate-cv, generate-interview-prep, generate-job-search-support, generate-linkedin, generate-personal-statement, generate-portfolio-plan.

## Easiest: GitHub Codespaces (works from a browser)
1. Open the repo on GitHub, switch to the branch `claude/website-build-ouh47r`, click Code, then Codespaces, then Create codespace on this branch.
2. Make a Supabase access token at https://supabase.com/dashboard/account/tokens (name it deploy, copy it).
3. In the Codespaces terminal run:

```
export SUPABASE_ACCESS_TOKEN=PASTE_TOKEN_HERE
for f in generate-application-answers generate-cover-letter generate-cv generate-interview-prep generate-job-search-support generate-linkedin generate-personal-statement generate-portfolio-plan; do
  npx --yes supabase@latest functions deploy $f --project-ref ozpeofkvnpikhopkgcxc --use-api
done
```

4. Check https://supabase.com/dashboard/project/ozpeofkvnpikhopkgcxc/functions : each shows a new version today.
5. Delete the access token afterwards and delete the codespace.

## Or: your own computer
Install the CLI (https://supabase.com/docs/guides/local-development/cli/getting-started), clone the repo, check out the branch, and run the same loop. `--use-api` means Docker is not needed.

Never paste the access token into chat.

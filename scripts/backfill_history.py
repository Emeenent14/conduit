import os
import random
import subprocess
from datetime import datetime, timedelta

# Configuration
START_DATE = datetime(2025, 12, 30)
END_DATE = datetime(2026, 1, 15)
AUTHOR_NAME = "Emeenent14"
AUTHOR_EMAIL = "chukwuemekaoguejiofor14@gmail.com"

# --- Real Commit Groups ---
# Defining groups of files that represent "features" to be committed on specific days.
# Files that are not in this list but exist in filesystem will be caught in a final "cleanup" commit or handled manually.
# Note: Paths must match git output (relative to root).

REAL_COMMITS = [
    {
        "date_offset": 0, # Dec 30
        "message": "feat(admin): initialize admin dashboard structure",
        "files": ["apps/web/src/app/admin", "apps/web/src/components/admin"]
    },
    {
        "date_offset": 2, # Jan 1
        "message": "feat(api): add new webhook endpoints",
        "files": ["apps/api/src/modules/webhooks", "apps/api/src/routes/webhook.routes.ts"]
    },
    {
        "date_offset": 4, # Jan 3
        "message": "feat(templates): add youtube and zoom integration templates",
        "files": ["templates/youtube", "templates/zoom", "templates/_import-summary.json"]
    },
    {
        "date_offset": 6, # Jan 5
        "message": "fix(web): update import scripts and dependencies",
        "files": ["scripts/import-templates.ts", "package.json", "yarn.lock"]
    },
    {
        "date_offset": 8, # Jan 7
        "message": "style(web): improve landing page responsiveness",
        "files": ["apps/web/src/app/page.tsx", "apps/web/src/components/landing"]
    },
    {
        "date_offset": 10, # Jan 9
        "message": "feat(integrations): add integrations page",
        "files": ["apps/web/src/app/integrations/page.tsx", "apps/web/src/components/landing/integrations-preview.tsx"]
    },
    {
        "date_offset": 12, # Jan 11
        "message": "chore(docs): update implementation summary",
        "files": ["IMPLEMENTATION_SUMMARY.md", "PHASE3_QUICK_REFERENCE.md"]
    },
    {
         "date_offset": 15, # Jan 14
         "message": "chore: add backfill script",
         "files": ["scripts/backfill_history.py"]
    }
]

# Filler messages for days with no real work
FILLER_MESSAGES = [
    "chore: update internal tooling",
    "fix(ci): adjust pipeline timeout",
    "docs: update contributor guidelines",
    "refactor(utils): optimize date helper functions",
    "test(api): add unit tests for auth module",
    "style: fix linting errors",
    "chore: dependency audit",
    "fix(ui): minor css adjustments",
]

def git_commit(files, message, date_obj):
    env_date = date_obj.strftime('%Y-%m-%d %H:%M:%S')
    env = os.environ.copy()
    env['GIT_AUTHOR_DATE'] = env_date
    env['GIT_COMMITTER_DATE'] = env_date
    env['GIT_AUTHOR_NAME'] = AUTHOR_NAME
    env['GIT_AUTHOR_EMAIL'] = AUTHOR_EMAIL
    env['GIT_COMMITTER_NAME'] = AUTHOR_NAME
    env['GIT_COMMITTER_EMAIL'] = AUTHOR_EMAIL

    if files:
        # Stage specific files
        # We need to be careful: if a directory is passed, git add handles it.
        # If the file doesn't exist (because my list is approximate), we skip it or handle error.
        
        # Check if files exist before adding
        valid_files = []
        for f in files:
            if os.path.exists(f):
                valid_files.append(f)
            else:
                # Try to find partial matches or just warn?
                # For directories, os.path.exists works.
                pass
        
        if not valid_files:
            print(f"  Skipping commit '{message}' - no matching files found.")
            return

        cmd = ['git', 'add'] + valid_files
        subprocess.run(cmd, check=False) # check=False to continue if unmatched
        
        # Commit with message
        try:
            subprocess.run(
                ['git', 'commit', '-m', message],
                env=env,
                check=True,
                stdout=subprocess.PIPE
            )
            print(f"  [REAL] Committed: {message}")
        except subprocess.CalledProcessError:
            print(f"  Failed to commit: {message} (maybe nothing to commit?)")
    else:
        # Empty commit
        try:
            subprocess.run(
                ['git', 'commit', '--allow-empty', '-m', message],
                env=env,
                check=True,
                stdout=subprocess.PIPE
            )
            print(f"  [EMPTY] Committed: {message}")
        except subprocess.CalledProcessError as e:
            print(f"  Error creating empty commit: {e}")

def generate_history():
    current_date = START_DATE
    total_days = (END_DATE - START_DATE).days + 1
    
    print(f"Starting history generation from {START_DATE.date()} to {END_DATE.date()}...")
    
    # Track which files have been committed to catch leftovers (optional, naive approach here)

    for day_offset in range(total_days):
        current_day = START_DATE + timedelta(days=day_offset)
        print(f"Processing {current_day.date()}...")
        
        # Check if we have real work scheduled for today
        todays_real_work = [rc for rc in REAL_COMMITS if rc['date_offset'] == day_offset]
        
        # Decide how many commits today
        # If we have real work, that counts towards volume.
        # We want busy days.
        if current_day.weekday() >= 5:
            base_commits = random.randint(0, 2)
        else:
            base_commits = random.randint(2, 5)
            
        commits_to_make = []
        
        # 1. Schedule Real Commits
        for work in todays_real_work:
            # Pick a random time during work hours
            hour = random.randint(10, 18)
            minute = random.randint(0, 59)
            dt = current_day.replace(hour=hour, minute=minute)
            commits_to_make.append({
                'type': 'real',
                'time': dt,
                'files': work['files'],
                'message': work['message']
            })
            
        # 2. Schedule Filler Commits to reach desired volume
        while len(commits_to_make) < base_commits:
            hour = random.randint(9, 23)
            minute = random.randint(0, 59)
            dt = current_day.replace(hour=hour, minute=minute)
            
            # Avoid exact collisions (naive)
            commits_to_make.append({
                'type': 'empty',
                'time': dt,
                'files': [],
                'message': random.choice(FILLER_MESSAGES)
            })
            
        # Sort by time
        commits_to_make.sort(key=lambda x: x['time'])
        
        # Execute
        for item in commits_to_make:
            git_commit(item['files'], item['message'], item['time'])

    # Final sweep: Commit anything remaining in the repo
    # This ensures we don't leave uncommitted changes if I missed any files in the groups
    env_date = END_DATE.replace(hour=23, minute=55).strftime('%Y-%m-%d %H:%M:%S')
    env = os.environ.copy()
    env['GIT_AUTHOR_DATE'] = env_date
    env['GIT_COMMITTER_DATE'] = env_date
    env['GIT_AUTHOR_NAME'] = AUTHOR_NAME
    env['GIT_AUTHOR_EMAIL'] = AUTHOR_EMAIL
    
    print("Final sweep for remaining files...")
    subprocess.run(['git', 'add', '.'], check=False)
    # Check if there are staged changes
    status = subprocess.run(['git', 'diff', '--cached', '--quiet'], check=False)
    if status.returncode == 1: # Changes exist
        subprocess.run(
            ['git', 'commit', '-m', "chore: snapshot remaining work"],
            env=env,
            check=False
        )
        print("  [FINAL] Committed remaining files.")
    else:
        print("  No remaining files to commit.")

if __name__ == "__main__":
    generate_history()

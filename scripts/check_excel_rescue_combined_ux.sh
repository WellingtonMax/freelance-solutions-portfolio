#!/usr/bin/env bash
# P01-F01: local combined-tree regression check for PR #83 (UX) + #84 (frontend).
# Disposable clone only; no push, remote merge, deploy, credentials or user files.
set -Eeuo pipefail
for cmd in git python3 node; do command -v "$cmd" >/dev/null || { echo "Missing: $cmd" >&2; exit 2; }; done
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT
git clone --quiet --no-checkout https://github.com/WellingtonMax/freelance-solutions-portfolio.git "$tmp/repo"
cd "$tmp/repo"
git fetch --quiet origin refs/pull/83/head:refs/remotes/origin/ux83 refs/pull/84/head:refs/remotes/origin/front84
ux="$(git rev-parse refs/remotes/origin/ux83)"
front="$(git rev-parse refs/remotes/origin/front84)"
printf 'UX PR #83: %s\nFrontend PR #84: %s\n' "$ux" "$front"
git checkout --quiet --detach "$ux"
git -c user.name='Disposable UX check' -c user.email='ux-check@example.invalid' merge --no-ff --no-edit "$front"
printf 'Combined local commit: %s\n' "$(git rev-parse HEAD)"
cd 01-excel-rescue
python3 -m unittest discover -v
for test in try-ui.test.cjs test_sample_ui.cjs test_sample_one_click.cjs; do
  if [[ -f "$test" ]]; then node --test "$test"; fi
done
echo 'Local automated checks finished. Browser/CI, keyboard, screen reader, 320/375px and 400% zoom remain separate manual acceptance gates.'

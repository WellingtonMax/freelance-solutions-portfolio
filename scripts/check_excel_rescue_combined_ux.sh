#!/usr/bin/env bash
# P01-F01: disposable combined-tree check for PR #83 (UX) and #84 (frontend).
# No push, remote merge, deploy, credentials or persistent checkout.
set -Eeuo pipefail
if [[ $# -gt 1 || ( $# -eq 1 && "$1" != '--browser' ) ]]; then
  echo 'Usage: check_excel_rescue_combined_ux.sh [--browser]' >&2
  exit 2
fi
for cmd in git python3 node; do
  command -v "$cmd" >/dev/null || { echo "Missing: $cmd" >&2; exit 2; }
done
if [[ ${1:-} == '--browser' ]]; then
  python3 -c 'import playwright.sync_api' || {
    echo 'Browser acceptance requires Python Playwright and installed Chromium; no browser test was run.' >&2
    exit 2
  }
fi
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
if [[ ${1:-} == '--browser' ]]; then
  echo 'Running Chromium browser regression on the COMBINED tree (not a screen-reader audit).'
  python3 check_try_browser.py
else
  echo 'Browser regression NOT RUN. Re-run with --browser after installing Playwright and Chromium.'
fi
echo 'Manual acceptance still required: screen reader, 400% zoom, and independent keyboard review. No CI or merge approval implied.'
